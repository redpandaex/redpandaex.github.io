import { diffLines } from "diff";

export const MAX_TEXT_BYTES = 2 * 1024 * 1024;
export const MAX_TEXT_LINES = 30_000;
export const DIFF_PREVIEW_LINES = 500;

export type DiffRow = {
  kind: "added" | "removed" | "unchanged";
  text: string;
  before: number | null;
  after: number | null;
};
export type TextDiffResult = {
  rows: DiffRow[];
  added: number;
  removed: number;
  download: string;
};
export type TextDiffRequest = {
  id: number;
  before: string;
  after: string;
  ignoreWhitespace: boolean;
};
export type TextDiffResponse =
  | { type: "ready"; sourceUrl: string }
  | { type: "result"; id: number; result: TextDiffResult }
  | { type: "error"; id: number; message: string };

export function normalizeText(text: string) {
  return text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

export function validateText(text: string) {
  if (
    text.length > MAX_TEXT_BYTES ||
    new TextEncoder().encode(text).byteLength > MAX_TEXT_BYTES
  ) {
    throw new Error("单侧文本最多 2 MiB，请分段对比。");
  }
  if (text.split("\n").length > MAX_TEXT_LINES) {
    throw new Error("单侧文本最多 30,000 行，请分段对比。");
  }
  if (text.includes("\0")) throw new Error("请选择 UTF-8 文本文件。");
}

export function compareText(request: TextDiffRequest): TextDiffResult {
  const before = normalizeText(request.before);
  const after = normalizeText(request.after);
  validateText(before);
  validateText(after);
  const changes = diffLines(before, after, {
    ignoreWhitespace: request.ignoreWhitespace,
    timeout: 2000,
    maxEditLength: 12_000,
  });
  if (!changes) {
    throw new Error("差异过多或计算超过 2 秒，请缩小文本范围后重试。");
  }
  let beforeLine = 1;
  let afterLine = 1;
  let added = 0;
  let removed = 0;
  const rows: DiffRow[] = [];
  for (const change of changes) {
    const kind = change.added
      ? "added"
      : change.removed
        ? "removed"
        : "unchanged";
    const lines = change.value.split("\n");
    if (lines.at(-1) === "") lines.pop();
    for (const text of lines) {
      rows.push({
        kind,
        text,
        before: change.added ? null : beforeLine++,
        after: change.removed ? null : afterLine++,
      });
      if (change.added) added++;
      if (change.removed) removed++;
    }
  }
  return {
    rows,
    added,
    removed,
    download: [
      "--- 原始文本",
      "+++ 修改后文本",
      ...rows.map(
        (row) =>
          `${row.kind === "added" ? "+" : row.kind === "removed" ? "-" : " "}${row.text}`,
      ),
    ].join("\n"),
  };
}
