export type ImageConversionFormat = {
  id: string;
  label: string;
  extension: string;
  mime: string;
  canRead: boolean;
  canWrite: boolean;
};

export type ImageConversionResult = {
  blob: Blob;
  preview: Blob;
  format: string;
  inputFormat: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  extension: string;
};

export type ImageConversionRequest = {
  type: "convert";
  id: number;
  file: File;
  format: string;
  quality: number;
};

export type ImageConversionInitRequest = {
  type: "init";
  wasm?: ArrayBuffer;
};

export type ImageConversionResponse =
  | {
      type: "ready";
      formats: ImageConversionFormat[];
      engineBytes: number;
      sourceUrl: string;
      dependencyUrls?: string[];
      wasmBytes?: ArrayBuffer;
      wasmUrl?: string;
    }
  | { type: "result"; id: number; result: ImageConversionResult }
  | { type: "error"; id?: number; message: string };

export const MAX_CONVERSION_FILES = 20;
export const MAX_CONVERSION_BYTES = 20 * 1024 * 1024;
export const MAX_CONVERSION_PIXELS = 24_000_000;

// Candidates only: the worker intersects these with the compiled engine's
// reading/writing capabilities. SVG is an input format, never a vector output.
export const IMAGE_CONVERSION_CATALOG: ReadonlyArray<
  Omit<ImageConversionFormat, "canRead" | "canWrite">
> = [
  { id: "png", label: "PNG", extension: "png", mime: "image/png" },
  { id: "jpeg", label: "JPEG", extension: "jpg", mime: "image/jpeg" },
  { id: "webp", label: "WebP", extension: "webp", mime: "image/webp" },
  { id: "avif", label: "AVIF", extension: "avif", mime: "image/avif" },
  { id: "gif", label: "GIF", extension: "gif", mime: "image/gif" },
  { id: "bmp", label: "BMP", extension: "bmp", mime: "image/bmp" },
  { id: "ico", label: "ICO", extension: "ico", mime: "image/x-icon" },
  { id: "tiff", label: "TIFF", extension: "tiff", mime: "image/tiff" },
  { id: "heic", label: "HEIC", extension: "heic", mime: "image/heic" },
  { id: "heif", label: "HEIF", extension: "heif", mime: "image/heif" },
  { id: "jxl", label: "JPEG XL", extension: "jxl", mime: "image/jxl" },
  { id: "jp2", label: "JPEG 2000", extension: "jp2", mime: "image/jp2" },
  {
    id: "psd",
    label: "PSD",
    extension: "psd",
    mime: "image/vnd.adobe.photoshop",
  },
  { id: "tga", label: "TGA", extension: "tga", mime: "image/x-tga" },
  { id: "qoi", label: "QOI", extension: "qoi", mime: "image/qoi" },
  {
    id: "ppm",
    label: "PPM",
    extension: "ppm",
    mime: "image/x-portable-pixmap",
  },
  {
    id: "pgm",
    label: "PGM",
    extension: "pgm",
    mime: "image/x-portable-graymap",
  },
  {
    id: "pbm",
    label: "PBM",
    extension: "pbm",
    mime: "image/x-portable-bitmap",
  },
  { id: "pcx", label: "PCX", extension: "pcx", mime: "image/x-pcx" },
  { id: "dds", label: "DDS", extension: "dds", mime: "image/vnd.ms-dds" },
  { id: "hdr", label: "HDR", extension: "hdr", mime: "image/vnd.radiance" },
  { id: "exr", label: "EXR", extension: "exr", mime: "image/x-exr" },
  { id: "svg", label: "SVG", extension: "svg", mime: "image/svg+xml" },
];

export function conversionDownloadName(
  name: string,
  extension: string,
): string {
  const basename = name.replace(/^.*[\\/]/, "").replace(/\.[^.]*$/, "");
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `${basename || "image"}-converted.${safeExtension || "png"}`;
}
