import {
  AlphaAction,
  ColorProfile,
  ColorSpace,
  ConfigurationFiles,
  Gravity,
  type IMagickImage,
  type IMagickImageInfo,
  ImageMagick,
  initializeImageMagick,
  Magick,
  MagickColors,
  MagickFormat,
  MagickGeometry,
  MagickImageInfo,
  MagickReadSettings,
  ResourceLimits,
} from "@imagemagick/magick-wasm";
import {
  IMAGE_CONVERSION_CATALOG,
  type ImageConversionFormat,
  type ImageConversionInitRequest,
  type ImageConversionRequest,
  type ImageConversionResponse,
  type ImageConversionResult,
  MAX_CONVERSION_BYTES,
  MAX_CONVERSION_PIXELS,
} from "./image-conversion";

const scope = globalThis as unknown as {
  location: Location;
  onmessage:
    | ((
        event: MessageEvent<
          ImageConversionRequest | ImageConversionInitRequest
        >,
      ) => void)
    | null;
  postMessage: (message: ImageConversionResponse) => void;
};

let initialization: Promise<void> | undefined;
let formats: ImageConversionFormat[] = [];
let busy = false;

// Compact ICC Profiles / profiles/sRGB-v4.icc, CC0, 480 bytes.
// https://github.com/saucecontrol/Compact-ICC-Profiles
// Git blob: d9f3c055bd4d7573124090569e1b9533932214eb
const srgbProfileBytes =
  "AAAB4GxjbXMEIAAAbW50clJHQiBYWVogB+IAAwAUAAkADgAdYWNzcE1TRlQAAAAAc2F3c2N0cmwAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1oYW5keem/Vlo+AbaDI4VVRvdPqgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKZGVzYwAAAPwAAAAkY3BydAAAASAAAAAid3RwdAAAAUQAAAAUY2hhZAAAAVgAAAAsclhZWgAAAYQAAAAUZ1hZWgAAAZgAAAAUYlhZWgAAAawAAAAUclRSQwAAAcAAAAAgZ1RSQwAAAcAAAAAgYlRSQwAAAcAAAAAgbWx1YwAAAAAAAAABAAAADGVuVVMAAAAIAAAAHABzAFIARwBCbWx1YwAAAAAAAAABAAAADGVuVVMAAAAGAAAAHABDAEMAMAAAWFlaIAAAAAAAAPbWAAEAAAAA0y1zZjMyAAAAAAABDD8AAAXd///zJgAAB5AAAP2S///7of///aIAAAPcAADAcVhZWiAAAAAAAABvoAAAOPIAAAOPWFlaIAAAAAAAAGKWAAC3iQAAGNpYWVogAAAAAAAAJKAAAA+FAAC2xHBhcmEAAAAAAAMAAAACZmkAAPKnAAANWQAAE9AAAApb";
let srgbProfile: ColorProfile | undefined;

function magickFormat(id: string): MagickFormat {
  return id.toUpperCase() as MagickFormat;
}

async function initialize(wasm?: ArrayBuffer): Promise<void> {
  let wasmUrl: string | undefined;
  if (!wasm) {
    wasmUrl = new URL("@imagemagick/magick-wasm/magick.wasm", import.meta.url)
      .href;
    const response = await fetch(wasmUrl, { cache: "force-cache" });
    if (!response.ok) {
      throw new Error("图片转换引擎下载失败，请检查网络后重试。");
    }
    wasm = await response.arrayBuffer();
  }

  // Only named image decoders can be used. MVG is an internal dependency of
  // MSVG; requests below never select it as a standalone input decoder.
  const coders = IMAGE_CONVERSION_CATALOG.map(({ id }) => id.toUpperCase());
  coders.push(
    "ICON",
    "PNM",
    "MSVG",
    "MVG",
    "JPG",
    "TIF",
    "PNG8",
    "PNG24",
    "PNG32",
  );
  ConfigurationFiles.default.policy.data = `<policymap>
    <policy domain="delegate" rights="none" pattern="*" />
    <policy domain="filter" rights="none" pattern="*" />
    <policy domain="coder" rights="none" pattern="*" />
    <policy domain="coder" rights="read|write" pattern="{${coders.join(",")}}" />
    <policy domain="path" rights="none" pattern="@*" />
    <policy domain="path" rights="none" pattern="|*" />
  </policymap>`;
  await initializeImageMagick(new Uint8Array(wasm));

  ResourceLimits.memory = BigInt(384 * 1024 * 1024);
  ResourceLimits.maxMemoryRequest = BigInt(256 * 1024 * 1024);
  ResourceLimits.maxProfileSize = BigInt(8 * 1024 * 1024);
  ResourceLimits.disk = BigInt(0);
  ResourceLimits.area = BigInt(MAX_CONVERSION_PIXELS);
  ResourceLimits.width = BigInt(MAX_CONVERSION_PIXELS);
  ResourceLimits.height = BigInt(MAX_CONVERSION_PIXELS);
  // ImageMagick also counts temporary working images against this limit.
  // frameCount below controls the single frame that is actually decoded.
  ResourceLimits.listLength = BigInt(16);

  const supported = new Map(
    Magick.supportedFormats.map((format) => [format.format, format]),
  );
  formats = IMAGE_CONVERSION_CATALOG.flatMap((format) => {
    const info = supported.get(magickFormat(format.id));
    if (!info || (!info.supportsReading && !info.supportsWriting)) return [];
    return [
      {
        ...format,
        canRead: info.supportsReading,
        canWrite: info.supportsWriting && format.id !== "svg",
      },
    ];
  });
  scope.postMessage({
    type: "ready",
    formats,
    engineBytes: wasm.byteLength,
    sourceUrl: scope.location.href,
    dependencyUrls: performance
      .getEntriesByType("resource")
      .map(({ name }) => name)
      .filter((url) => new URL(url).pathname.endsWith(".js")),
    wasmBytes: wasm,
    wasmUrl,
  });
}

function checkDimensions(width: number, height: number): void {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error("无法读取图片尺寸，请尝试其他文件。");
  }
  if (width * height > MAX_CONVERSION_PIXELS) {
    throw new Error("图片超过 2400 万像素，请缩小图片后再转换。");
  }
}

function fit(image: IMagickImage, maximum: number): void {
  if (image.width > maximum || image.height > maximum) {
    image.resize(maximum, maximum);
  }
}

function copyBlob(data: Uint8Array, mime: string): Blob {
  // The callback's bytes belong to WASM and expire when the image is disposed.
  return new Blob([new Uint8Array(data)], { type: mime });
}

function detectedInput(bytes: Uint8Array): string | undefined {
  const header = String.fromCharCode(...bytes.subarray(0, 64));
  const starts = (...signature: number[]) =>
    signature.every((value, index) => bytes[index] === value);
  if (starts(137, 80, 78, 71, 13, 10, 26, 10)) return "png";
  if (starts(255, 216, 255)) return "jpeg";
  if (/^GIF8[79]a/.test(header)) return "gif";
  if (/^RIFF[\s\S]{4}WEBP/.test(header)) return "webp";
  if (header.startsWith("BM")) return "bmp";
  if (starts(0, 0, 1, 0)) return "ico";
  if (
    starts(73, 73, 42, 0) ||
    starts(73, 73, 43, 0) ||
    starts(77, 77, 0, 42) ||
    starts(77, 77, 0, 43)
  )
    return "tiff";
  if (header.slice(4, 8) === "ftyp") {
    if (/avif|avis/.test(header.slice(8))) return "avif";
    if (/hei[cf]|heix|hevc|hevx/.test(header.slice(8))) return "heic";
    if (/mif1|msf1/.test(header.slice(8))) return "heif";
  }
  if (
    starts(255, 10) ||
    header.slice(0, 12) === "\x00\x00\x00\x0cJXL \x0d\x0a\x87\x0a"
  )
    return "jxl";
  if (
    starts(255, 79, 255, 81) ||
    header.slice(0, 12) === "\x00\x00\x00\x0cjP  \x0d\x0a\x87\x0a"
  )
    return "jp2";
  if (header.startsWith("8BPS")) return "psd";
  if (header.startsWith("qoif")) return "qoi";
  if (/^P[1-6]\s/.test(header)) {
    return { 1: "pbm", 2: "pgm", 3: "ppm", 4: "pbm", 5: "pgm", 6: "ppm" }[
      Number(header[1])
    ];
  }
  if (bytes[0] === 10 && bytes[2] === 1 && [1, 2, 4, 8].includes(bytes[3]))
    return "pcx";
  if (header.startsWith("DDS ")) return "dds";
  if (/^#\?(RADIANCE|RGBE)/.test(header)) return "hdr";
  if (starts(118, 47, 49, 1)) return "exr";
  if (/<svg(?:\s|>)/i.test(new TextDecoder().decode(bytes.subarray(0, 2048))))
    return "svg";
  return undefined;
}

function inputFormat(file: File, bytes: Uint8Array): ImageConversionFormat {
  const aliases: Record<string, string> = {
    jpg: "jpeg",
    jpe: "jpeg",
    jfif: "jpeg",
    apng: "png",
    dib: "bmp",
    tif: "tiff",
    jpx: "jp2",
    j2k: "jp2",
    j2c: "jp2",
    jpc: "jp2",
    psb: "psd",
    targa: "tga",
    vda: "tga",
    icb: "tga",
    vst: "tga",
    rgbe: "hdr",
    svgz: "svg",
  };
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const id = detectedInput(bytes) ?? aliases[extension] ?? extension;
  const format =
    formats.find((format) => format.canRead && format.id === id) ??
    formats.find((format) => format.canRead && format.mime === file.type);
  if (!format) {
    throw new Error("暂不支持这个输入格式，请选择支持的图片文件。");
  }
  return format;
}

async function convert(
  request: ImageConversionRequest,
): Promise<ImageConversionResult> {
  const target = formats.find(
    ({ id, canWrite }) => id === request.format && canWrite,
  );
  if (!target) throw new Error("当前引擎不支持这个输出格式，请选择其他格式。");
  if (!request.file.size) throw new Error("文件为空，请选择一张图片。");
  if (request.file.size > MAX_CONVERSION_BYTES) {
    throw new Error("单张图片不能超过 20 MB。");
  }

  const bytes = new Uint8Array(await request.file.arrayBuffer());
  const input = inputFormat(request.file, bytes);
  // Explicit selection also handles ICO/TGA files without reliable magic
  // signatures and prevents document/script decoders from being sniffed.
  const settings = new MagickReadSettings({
    frameIndex: 0,
    frameCount: 1,
    format: input.id === "svg" ? MagickFormat.Msvg : magickFormat(input.id),
  });
  const info: IMagickImageInfo = MagickImageInfo.create(bytes, settings);
  checkDimensions(info.width, info.height);
  // GIF's logical screen is stored separately from the first frame's size.
  const originalWidth =
    input.id === "gif" ? bytes[6] | (bytes[7] << 8) : info.width;
  const originalHeight =
    input.id === "gif" ? bytes[8] | (bytes[9] << 8) : info.height;
  checkDimensions(originalWidth, originalHeight);

  const quality = Number.isFinite(request.quality)
    ? Math.min(100, Math.max(1, Math.round(request.quality)))
    : 92;
  const output = ImageMagick.read(bytes, settings, (image) => {
    checkDimensions(image.width, image.height);
    if (input.id === "gif") {
      const { x, y } = image.page;
      const background = image.hasAlpha
        ? MagickColors.Transparent
        : image.backgroundColor;
      image.extent(
        new MagickGeometry(-x, -y, originalWidth, originalHeight),
        background,
      );
      image.resetPage();
    }
    image.autoOrient();
    if (image.getColorProfile()) {
      srgbProfile ??= new ColorProfile(
        Uint8Array.from(atob(srgbProfileBytes), (character) =>
          character.charCodeAt(0),
        ),
      );
      image.transformColorSpace(srgbProfile);
    }
    image.colorSpace = ColorSpace.sRGB;
    image.strip();
    image.quality = quality;
    image.depth = 8;

    if (target.id === "jpeg" || target.id === "bmp") {
      image.backgroundColor = MagickColors.White;
      image.alpha(AlphaAction.Remove);
    }
    if (target.id === "ico") {
      fit(image, 256);
      const side = Math.max(image.width, image.height);
      image.backgroundColor = MagickColors.Transparent;
      image.extent(side, side, Gravity.Center);
    }

    return {
      width: image.width,
      height: image.height,
      blob: image.write(magickFormat(target.id), (data) =>
        copyBlob(data, target.mime),
      ),
    };
  });

  // Decode the finished file, so previews also reflect palette reduction and
  // lossy encoding. The source image has already been disposed at this point.
  const previewBytes = new Uint8Array(await output.blob.arrayBuffer());
  const preview = ImageMagick.read(
    previewBytes,
    new MagickReadSettings({
      frameIndex: 0,
      frameCount: 1,
      format: magickFormat(target.id),
    }),
    (image) => {
      fit(image, 360);
      image.strip();
      return image.write(MagickFormat.Png, (data) =>
        copyBlob(data, "image/png"),
      );
    },
  );
  return {
    ...output,
    preview,
    format: target.id,
    inputFormat: input.label,
    originalWidth,
    originalHeight,
    extension: target.extension,
  };
}

function errorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/^[\u4e00-\u9fff]/.test(message)) return message;
  if (/memory|cache|limit|allocation|resource|list length/i.test(message)) {
    return "图片超过当前设备的处理限制，请缩小图片或选择其他格式。";
  }
  return "图片读取或转换失败，文件可能损坏，或包含当前引擎不支持的内容。";
}

scope.onmessage = async ({ data }) => {
  if (data.type === "init") {
    initialization ??= initialize(data.wasm);
    try {
      await initialization;
    } catch (error) {
      scope.postMessage({ type: "error", message: errorMessage(error) });
    }
    return;
  }
  if (busy) {
    scope.postMessage({
      type: "error",
      id: data.id,
      message: "请等待上一张图片转换完成。",
    });
    return;
  }
  busy = true;
  try {
    if (!initialization) throw new Error("图片转换引擎尚未加载，请重试。");
    await initialization;
    const result = await convert(data);
    scope.postMessage({ type: "result", id: data.id, result });
  } catch (error) {
    scope.postMessage({
      type: "error",
      id: data.id,
      message: errorMessage(error),
    });
  } finally {
    busy = false;
  }
};
