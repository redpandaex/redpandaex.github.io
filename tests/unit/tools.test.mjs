import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  imageDownloadName,
  imageOutputDimensions,
  validateImageFile,
} from "../../lib/tools/image-compression.ts";
import { compareText, normalizeText } from "../../lib/tools/text-diff.ts";

const compare = (before, after, ignoreWhitespace = false) =>
  compareText({ id: 1, before, after, ignoreWhitespace });

test("text comparison identifies Chinese insertions/deletions and original line numbers", () => {
  const result = compare("开头\n旧内容\n结尾", "开头\n新内容\n结尾");
  assert.equal(result.added, 1);
  assert.equal(result.removed, 1);
  assert.deepEqual(
    result.rows.map(({ kind, before, after }) => [kind, before, after]),
    [
      ["unchanged", 1, 1],
      ["removed", 2, null],
      ["added", null, 2],
      ["unchanged", 3, 3],
    ],
  );
  assert.match(result.download, /-旧内容\n\+新内容/);
});

test("BOM and CRLF normalize without losing significant whitespace", () => {
  assert.equal(normalizeText("\uFEFF甲\r\n乙\r"), "甲\n乙\n");
  assert.equal(compare("甲\r\n乙\r\n", "甲\n乙\n").added, 0);
  assert.equal(compare(" 甲  \n", "甲\n", true).removed, 0);
  assert.equal(compare(" 甲  \n", "甲\n").removed, 1);
});

test("empty sides retain additions/removals and trailing newline changes", () => {
  assert.deepEqual(
    compare("", "甲\n乙").rows.map((row) => row.kind),
    ["added", "added"],
  );
  assert.equal(compare("甲", "").removed, 1);
  assert.equal(compare("", "").rows.length, 0);
  assert.equal(compare("甲", "甲\n").added, 1);
});

test("large mostly identical documents keep complete export without quadratic line matching", () => {
  const before = Array.from(
    { length: 12000 },
    (_, index) => `文档第 ${index} 行`,
  ).join("\n");
  const after = before.replace("文档第 6000 行", "这一行有修改");
  const result = compare(before, after);
  assert.equal(result.added, 1);
  assert.equal(result.removed, 1);
  assert.equal(result.rows.length, 12001);
  assert.match(result.download, /文档第 11999 行/);
});

test("text size, line and binary input limits reject before computation", () => {
  assert.throws(() => compare("a".repeat(2 * 1024 * 1024 + 1), "b"), /2 MiB/);
  assert.throws(() => compare("行\n".repeat(30001), "b"), /30,000/);
  assert.throws(() => compare("a\0b", "b"), /UTF-8/);
});

test("image resizing preserves aspect and never enlarges", () => {
  assert.deepEqual(imageOutputDimensions(4000, 2000, 1920), {
    width: 1920,
    height: 960,
  });
  assert.deepEqual(imageOutputDimensions(300, 150, 1920), {
    width: 300,
    height: 150,
  });
  assert.deepEqual(imageOutputDimensions(4000, 2000, 0), {
    width: 4000,
    height: 2000,
  });
  assert.equal(
    imageDownloadName("example.png", "image/jpeg"),
    "example-compressed.jpg",
  );
});

test("image file headers, rather than supplied extension or MIME, control validation", async () => {
  const bytes = await readFile(
    new URL("../../public/images/redpanda-studio.webp", import.meta.url),
  );
  await validateImageFile(
    new File([bytes], "misnamed.jpg", { type: "image/jpeg" }),
  );
  await assert.rejects(
    validateImageFile(new File(["<svg/>"], "fake.png", { type: "image/png" })),
    /JPEG|PNG|WebP/,
  );
  await assert.rejects(
    validateImageFile(new File([], "empty.png")),
    /文件为空/,
  );
});

test("oversized image dimensions are rejected before allocating a decoded bitmap", async () => {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, 6000);
  view.setUint32(20, 4001);
  await assert.rejects(
    validateImageFile(new File([bytes], "huge.png")),
    /2400 万/,
  );
});
