import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";
import { crc32, deflateSync } from "node:zlib";
import {
  ColorProfile,
  ImageMagick,
  MagickFormat,
  MagickGeometry,
  MagickImageInfo,
  Orientation,
} from "@imagemagick/magick-wasm";
import {
  conversionDownloadName,
  MAX_CONVERSION_BYTES,
} from "../../lib/tools/image-conversion.ts";

const workerUrl = new URL(
  "../../lib/tools/image-conversion.worker.ts",
  import.meta.url,
);
const helperUrl = new URL(
  "../../lib/tools/image-conversion.ts",
  import.meta.url,
);

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

function png(width = 12, height = 7, color = [255, 0, 0, 128]) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const stride = width * 4 + 1;
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) pixels.set(color, y * stride + x * 4 + 1);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

test("conversion filenames keep the original basename and requested extension", () => {
  assert.equal(
    conversionDownloadName("照片.final.heic", "jpg"),
    "照片.final-converted.jpg",
  );
  assert.equal(
    conversionDownloadName("/path/image", "webp"),
    "image-converted.webp",
  );
  assert.equal(
    conversionDownloadName("C:\\folder\\photo.png", "PNG"),
    "photo-converted.png",
  );
});

test("real conversion worker and shipped WASM codecs", async (t) => {
  const saved = new Map(
    ["location", "postMessage", "onmessage"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const messages = [];
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { href: workerUrl.href },
  });
  Object.defineProperty(globalThis, "postMessage", {
    configurable: true,
    value: (message) => messages.push(message),
  });
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (
        specifier === "./image-conversion" &&
        context.parentURL === workerUrl.href
      ) {
        return { url: helperUrl.href, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
  });

  try {
    await import(workerUrl.href);
    hooks.deregister();
    const receive = globalThis.onmessage;
    const send = async (data) => {
      await receive({ data });
      assert.equal(messages.length, 1, "each request produces one response");
      return messages.shift();
    };
    const wasm = await readFile(
      new URL(import.meta.resolve("@imagemagick/magick-wasm/magick.wasm")),
    );
    const ready = await send({
      type: "init",
      wasm: wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.length),
    });
    assert.equal(ready.type, "ready");
    assert.equal(ready.engineBytes, wasm.length);
    assert.equal(ready.wasmBytes.byteLength, wasm.length);
    assert.equal(ready.sourceUrl, workerUrl.href);
    const convert = async (file, format = "png") => {
      const response = await send({
        type: "convert",
        id: 1,
        file,
        format,
        quality: 92,
      });
      assert.equal(response.type, "result", response.message);
      return response.result;
    };
    const source = png();

    await t.test(
      "capability list exposes the actual raster encoders and read-only inputs",
      () => {
        assert.equal(
          ready.formats.filter((format) => format.canWrite).length,
          20,
        );
        for (const id of ["heic", "heif", "svg"]) {
          const format = ready.formats.find((format) => format.id === id);
          assert.equal(format.canRead, true);
          assert.equal(format.canWrite, false);
        }
        assert.equal(
          ready.formats.some((format) =>
            ["pdf", "mvg", "ps"].includes(format.id),
          ),
          false,
        );
      },
    );

    for (const format of ready.formats.filter((format) => format.canWrite)) {
      await t.test(
        `PNG → ${format.label} → PNG retains dimensions and produces a PNG preview`,
        async () => {
          const result = await convert(
            new File([source], "input.png"),
            format.id,
          );
          const expectedHeight = format.id === "ico" ? 12 : 7;
          assert.equal(result.blob.type, format.mime);
          assert.ok(result.blob.size > 0);
          assert.deepEqual([result.width, result.height], [12, expectedHeight]);
          const preview = MagickImageInfo.create(
            new Uint8Array(await result.preview.arrayBuffer()),
          );
          assert.equal(preview.format, MagickFormat.Png);
          assert.deepEqual(
            [preview.width, preview.height],
            [12, expectedHeight],
          );
          const back = await convert(
            new File([result.blob], `roundtrip.${format.extension}`),
          );
          const decoded = MagickImageInfo.create(
            new Uint8Array(await back.blob.arrayBuffer()),
          );
          assert.equal(decoded.format, MagickFormat.Png);
          assert.deepEqual(
            [decoded.width, decoded.height],
            [12, expectedHeight],
          );
        },
      );
    }

    await t.test("real HEIC and HEIF fixture bytes decode to PNG", async () => {
      for (const [name, size] of [
        ["conformance-window-padding.heic", 1],
        ["hevc32.heif", 32],
      ]) {
        const data = await readFile(
          new URL(`../fixtures/images/${name}`, import.meta.url),
        );
        const result = await convert(new File([data], name));
        const decoded = MagickImageInfo.create(
          new Uint8Array(await result.blob.arrayBuffer()),
        );
        assert.deepEqual([decoded.width, decoded.height], [size, size]);
        assert.equal(decoded.format, MagickFormat.Png);
      }
    });

    await t.test("SVG rasterizes through the local renderer", async () => {
      const result = await convert(
        new File(
          [
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="12"><rect width="24" height="12" fill="red"/></svg>',
          ],
          "vector.svg",
        ),
      );
      assert.deepEqual([result.width, result.height], [24, 12]);
      assert.equal(result.inputFormat, "SVG");
    });

    await t.test(
      "headers identify a misleading extension and MIME",
      async () => {
        const result = await convert(
          new File([source], "misnamed.jpg", { type: "image/jpeg" }),
        );
        assert.equal(result.inputFormat, "PNG");
        assert.deepEqual([result.width, result.height], [12, 7]);
      },
    );

    await t.test(
      "JPEG/BMP replace transparency with white and PNG retains alpha",
      async () => {
        for (const format of ["jpeg", "bmp", "png"]) {
          const result = await convert(new File([source], "input.png"), format);
          ImageMagick.read(
            new Uint8Array(await result.blob.arrayBuffer()),
            (image) => {
              image.getPixels((pixels) => {
                const [red, green, blue, alpha] = pixels.toByteArray(
                  0,
                  0,
                  1,
                  1,
                  "RGBA",
                );
                if (format === "png") {
                  assert.equal(alpha, 128);
                } else {
                  assert.equal(alpha, 255);
                  assert.ok(red >= 250 && green >= 120 && blue >= 120);
                }
              });
            },
          );
        }
      },
    );

    await t.test(
      "large images keep dimensions while previews and ICO are bounded",
      async () => {
        const large = new File([png(1000, 600)], "large.png");
        const result = await convert(large);
        assert.deepEqual([result.width, result.height], [1000, 600]);
        const preview = MagickImageInfo.create(
          new Uint8Array(await result.preview.arrayBuffer()),
        );
        assert.deepEqual([preview.width, preview.height], [360, 216]);
        const icon = await convert(large, "ico");
        assert.deepEqual([icon.width, icon.height], [256, 256]);
      },
    );

    await t.test(
      "orientation applies before metadata is stripped",
      async () => {
        const oriented = ImageMagick.read(source, (image) => {
          image.orientation = Orientation.RightTop;
          image.comment = "private image metadata";
          return image.write(MagickFormat.Tiff, (data) => new Uint8Array(data));
        });
        const result = await convert(new File([oriented], "oriented.tiff"));
        assert.deepEqual(
          [result.originalWidth, result.originalHeight],
          [12, 7],
        );
        assert.deepEqual([result.width, result.height], [7, 12]);
        ImageMagick.read(
          new Uint8Array(await result.blob.arrayBuffer()),
          (image) => {
            assert.equal(image.comment, null);
            assert.deepEqual(image.profileNames, []);
          },
        );
      },
    );

    await t.test(
      "profiled colors transform to sRGB before private metadata is removed",
      async () => {
        const profile = await readFile(
          new URL("../fixtures/images/DisplayP3-v4.icc", import.meta.url),
        );
        const profiled = ImageMagick.read(
          png(1, 1, [128, 200, 128, 255]),
          (image) => {
            image.setProfile(new ColorProfile(profile));
            return image.write(
              MagickFormat.Png,
              (data) => new Uint8Array(data),
            );
          },
        );
        const result = await convert(new File([profiled], "wide-gamut.png"));
        ImageMagick.read(
          new Uint8Array(await result.blob.arrayBuffer()),
          (image) => {
            const actual = image.getPixels((pixels) =>
              pixels.toByteArray(0, 0, 1, 1, "RGB"),
            );
            for (const [index, expected] of [103, 202, 120].entries()) {
              assert.ok(
                Math.abs(actual[index] - expected) <= 1,
                `sRGB channel ${index}: expected ${expected}, received ${actual[index]}`,
              );
            }
            assert.deepEqual(image.profileNames, []);
          },
        );
      },
    );

    await t.test(
      "GIF first frame retains its logical canvas and offset",
      async () => {
        const offsetGif = ImageMagick.read(
          png(12, 7, [255, 0, 0, 255]),
          (image) => {
            image.page = new MagickGeometry(20, 10, 120, 70);
            image.getPixels((pixels) => pixels.setPixel(0, 0, [0, 0, 0, 0]));
            return image.write(
              MagickFormat.Gif,
              (data) => new Uint8Array(data),
            );
          },
        );
        const result = await convert(new File([offsetGif], "offset.gif"));
        assert.deepEqual(
          [
            result.originalWidth,
            result.originalHeight,
            result.width,
            result.height,
          ],
          [120, 70, 120, 70],
        );
        ImageMagick.read(
          new Uint8Array(await result.blob.arrayBuffer()),
          (image) => {
            image.getPixels((pixels) => {
              assert.deepEqual(
                [...pixels.toByteArray(21, 10, 1, 1, "RGBA")],
                [255, 0, 0, 255],
              );
              assert.equal(pixels.toByteArray(0, 0, 1, 1, "RGBA")[3], 0);
            });
          },
        );
        const oversized = new Uint8Array(offsetGif);
        new DataView(oversized.buffer).setUint16(6, 6000, true);
        new DataView(oversized.buffer).setUint16(8, 4001, true);
        const error = await send({
          type: "convert",
          id: 9,
          file: new File([oversized], "large-canvas.gif"),
          format: "png",
          quality: 92,
        });
        assert.equal(error.type, "error");
        assert.match(error.message, /2400 万|处理限制/);
      },
    );

    await t.test(
      "animated GIF and multipage TIFF only export the first frame",
      async () => {
        for (const format of [MagickFormat.Gif, MagickFormat.Tiff]) {
          const animated = ImageMagick.readCollection(source, (images) =>
            ImageMagick.readCollection(
              png(12, 7, [0, 255, 0, 255]),
              (other) => {
                images.push(other.pop());
                return images.write(format, (data) => new Uint8Array(data));
              },
            ),
          );
          assert.equal(
            ImageMagick.readCollection(animated, (images) => images.length),
            2,
          );
          const result = await convert(
            new File([animated], `sequence.${format.toLowerCase()}`),
            "gif",
          );
          assert.equal(
            ImageMagick.readCollection(
              new Uint8Array(await result.blob.arrayBuffer()),
              (images) => images.length,
            ),
            1,
          );
        }
      },
    );

    await t.test(
      "invalid, empty, oversized and unsupported inputs fail without breaking later jobs",
      async () => {
        const cases = [
          { file: new File([], "empty.png"), pattern: /文件为空/ },
          {
            file: new File(
              [new Uint8Array(MAX_CONVERSION_BYTES + 1)],
              "large.png",
            ),
            pattern: /20 MB/,
          },
          { file: new File(["%PDF-1.7"], "document.pdf"), pattern: /不支持/ },
          {
            file: new File(
              ["push graphic-context\nviewbox 0 0 10 10"],
              "script.mvg",
            ),
            pattern: /不支持/,
          },
          { file: new File(["not a png"], "broken.png"), pattern: /失败/ },
          {
            file: new File([source], "input.png"),
            format: "svg",
            pattern: /输出格式/,
          },
        ];
        const oversizedHeader = Buffer.from(source.subarray(16, 29));
        oversizedHeader.writeUInt32BE(6000, 0);
        oversizedHeader.writeUInt32BE(4001, 4);
        const oversized = Buffer.concat([
          source.subarray(0, 8),
          chunk("IHDR", oversizedHeader),
          source.subarray(33),
        ]);
        cases.push({
          file: new File([oversized], "huge.png"),
          pattern: /2400 万|处理限制/,
        });
        for (const { file, format = "png", pattern } of cases) {
          const result = await send({
            type: "convert",
            id: 2,
            file,
            format,
            quality: 92,
          });
          assert.equal(result.type, "error");
          assert.equal(result.id, 2);
          assert.match(result.message, pattern);
        }
        assert.equal(
          (await convert(new File([source], "valid.png"))).width,
          12,
        );
      },
    );
  } finally {
    hooks.deregister();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
