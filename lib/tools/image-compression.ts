export const MAX_IMAGE_FILES = 20;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 24_000_000;

export type ImageOutputMime = "image/webp" | "image/jpeg" | "image/png";
export type CompressionMode = "worker" | "canvas";

export interface ImageCompressionOptions {
  format: ImageOutputMime;
  quality: number;
  /** Zero keeps the original dimensions. Images are never enlarged. */
  maxEdge: number;
}

export interface ImageCompressionResult {
  blob: Blob;
  mime: string;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
}

export type CompressionWorkerRequest =
  | {
      type: "compress";
      id: number;
      file: File;
      options: ImageCompressionOptions;
    }
  | { type: "cancel"; id: number };

export type CompressionWorkerResponse =
  | { type: "ready"; supported: boolean }
  | { type: "result"; id: number; result: ImageCompressionResult }
  | { type: "error"; id: number; message: string; fallback: boolean };

class InvalidImageError extends Error {}
export class CanvasUnavailableError extends Error {}

export function throwIfImageAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("已取消处理", "AbortError");
}

export function imageSizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function imageDownloadName(name: string, mime: string) {
  const extension =
    mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
  return `${name.replace(/\.[^.]*$/, "") || "image"}-compressed.${extension}`;
}

export function imageOutputDimensions(
  width: number,
  height: number,
  maxEdge: number,
) {
  const scale =
    maxEdge > 0 ? Math.min(1, maxEdge / Math.max(width, height)) : 1;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function checkDimensions(width: number, height: number) {
  if (!width || !height || !Number.isFinite(width * height)) {
    throw new InvalidImageError("无法读取图片尺寸，请检查文件是否完整。");
  }
  if (width * height > MAX_IMAGE_PIXELS) {
    throw new InvalidImageError("图片超过 2400 万像素，请先缩小图片。");
  }
}

/** Read dimensions before decoding, so oversized images do not allocate a full bitmap. */
export async function validateImageFile(file: File) {
  if (!file.size) throw new InvalidImageError("文件为空，请选择有效图片。");
  if (file.size > MAX_IMAGE_BYTES) {
    throw new InvalidImageError("文件超过 20 MB，请选择较小的图片。");
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  let width = 0;
  let height = 0;
  let mime: ImageOutputMime;
  const is = (offset: number, values: number[]) =>
    values.every((value, index) => bytes[offset + index] === value);

  if (is(0, [137, 80, 78, 71, 13, 10, 26, 10]) && bytes.length >= 24) {
    mime = "image/png";
    width = view.getUint32(16);
    height = view.getUint32(20);
  } else if (is(0, [255, 216])) {
    mime = "image/jpeg";
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset++] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if (marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker)) {
        if (length >= 7) {
          height = view.getUint16(offset + 3);
          width = view.getUint16(offset + 5);
        }
        break;
      }
      offset += length;
    }
  } else if (is(0, [82, 73, 70, 70]) && is(8, [87, 69, 66, 80])) {
    mime = "image/webp";
    let offset = 12;
    while (offset + 8 <= bytes.length) {
      const length = view.getUint32(offset + 4, true);
      const data = offset + 8;
      if (length > bytes.length - data) break;
      if (is(offset, [86, 80, 56, 88]) && length >= 10) {
        width =
          1 +
          bytes[data + 4] +
          (bytes[data + 5] << 8) +
          (bytes[data + 6] << 16);
        height =
          1 +
          bytes[data + 7] +
          (bytes[data + 8] << 8) +
          (bytes[data + 9] << 16);
        break;
      }
      if (is(offset, [86, 80, 56, 76]) && length >= 5 && bytes[data] === 47) {
        const dimensions = view.getUint32(data + 1, true);
        width = 1 + (dimensions & 0x3fff);
        height = 1 + ((dimensions >>> 14) & 0x3fff);
        break;
      }
      if (
        is(offset, [86, 80, 56, 32]) &&
        length >= 10 &&
        is(data + 3, [157, 1, 42])
      ) {
        width = view.getUint16(data + 6, true) & 0x3fff;
        height = view.getUint16(data + 8, true) & 0x3fff;
        break;
      }
      offset = data + length + (length % 2);
    }
  } else {
    throw new InvalidImageError(
      "仅支持 JPEG、PNG、WebP，请检查文件的实际格式。",
    );
  }
  checkDimensions(width, height);
  return { mime, width, height };
}

async function decodeOnMainThread(file: File, signal?: AbortSignal) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      if (signal?.aborted) {
        bitmap.close();
        throwIfImageAborted(signal);
      }
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch (error) {
      throwIfImageAborted(signal);
      if (error instanceof DOMException && error.name === "AbortError")
        throw error;
      // Some browsers decode formats through <img> that createImageBitmap cannot handle.
    }
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      const clean = () => {
        image.onload = null;
        image.onerror = null;
        signal?.removeEventListener("abort", abort);
      };
      const abort = () => {
        clean();
        image.src = "";
        reject(new DOMException("已取消处理", "AbortError"));
      };
      image.onload = () => {
        clean();
        resolve();
      };
      image.onerror = () => {
        clean();
        reject(new InvalidImageError("图片解码失败，文件可能已损坏。"));
      };
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) abort();
      else image.src = url;
    });
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => {
        image.src = "";
      },
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressImageLocally(
  file: File,
  options: ImageCompressionOptions,
  mode: CompressionMode = "canvas",
  signal?: AbortSignal,
): Promise<ImageCompressionResult> {
  throwIfImageAborted(signal);
  await validateImageFile(file);
  throwIfImageAborted(signal);
  if (
    mode === "worker" &&
    (typeof OffscreenCanvas === "undefined" ||
      typeof createImageBitmap !== "function")
  ) {
    throw new CanvasUnavailableError("此浏览器不支持后台图片处理。");
  }
  const decoded =
    mode === "worker"
      ? await createImageBitmap(file).then((bitmap) => ({
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          close: () => bitmap.close(),
        }))
      : await decodeOnMainThread(file, signal);
  let canvas: OffscreenCanvas | HTMLCanvasElement | undefined;
  try {
    throwIfImageAborted(signal);
    checkDimensions(decoded.width, decoded.height);
    const { width, height } = imageOutputDimensions(
      decoded.width,
      decoded.height,
      options.maxEdge,
    );
    canvas =
      mode === "worker"
        ? new OffscreenCanvas(width, height)
        : document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!context)
      throw new CanvasUnavailableError(
        "浏览器无法创建画布，请尝试其他浏览器。",
      );
    if (options.format === "image/jpeg") {
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(decoded.source, 0, 0, width, height);
    throwIfImageAborted(signal);
    const quality = Math.min(1, Math.max(0.1, options.quality));
    const blob =
      mode === "worker"
        ? await (canvas as OffscreenCanvas).convertToBlob({
            type: options.format,
            quality,
          })
        : await new Promise<Blob>((resolve, reject) => {
            (canvas as HTMLCanvasElement).toBlob(
              (value) =>
                value
                  ? resolve(value)
                  : reject(
                      new Error("图片编码失败，请尝试其他格式或较小尺寸。"),
                    ),
              options.format,
              quality,
            );
          });
    throwIfImageAborted(signal);
    if (!blob.size) throw new Error("浏览器生成了空文件，请尝试其他格式。");
    if (!["image/png", "image/jpeg", "image/webp"].includes(blob.type)) {
      throw new Error("浏览器返回了不支持的图片格式。");
    }
    return {
      blob,
      mime: blob.type,
      width,
      height,
      originalWidth: decoded.width,
      originalHeight: decoded.height,
    };
  } finally {
    decoded.close();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

export function imageWorkerErrorNeedsFallback(error: unknown) {
  return (
    !(error instanceof InvalidImageError) &&
    !(error instanceof DOMException && error.name === "AbortError")
  );
}

interface PendingWorkerJob {
  resolve: (result: ImageCompressionResult) => void;
  reject: (error: Error) => void;
}

/** One shared queue also serializes work when an aborted job is still releasing its bitmap. */
export class ImageCompressionEngine {
  private worker?: Worker;
  private pending = new Map<number, PendingWorkerJob>();
  private nextId = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private ready: Promise<CompressionMode>;
  private destroyed = false;
  private currentMode: CompressionMode = "canvas";
  private finishInitialization?: () => void;

  constructor(
    private onModeChange?: (mode: CompressionMode) => void,
    private createWorker?: () => Worker,
  ) {
    this.ready = this.initialize();
  }

  whenReady() {
    return this.ready;
  }

  private initialize(): Promise<CompressionMode> {
    const createWorker = this.createWorker;
    if (typeof Worker === "undefined" || !createWorker)
      return Promise.resolve("canvas");
    return new Promise((resolve) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout>;
      const finish = (mode: CompressionMode) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.currentMode = mode;
        resolve(mode);
      };
      this.finishInitialization = () => finish("canvas");
      try {
        const worker = createWorker();
        this.worker = worker;
        timer = setTimeout(() => {
          this.fallbackToCanvas();
          finish("canvas");
        }, 8000);
        worker.onmessage = (event: MessageEvent<CompressionWorkerResponse>) => {
          const message = event.data;
          if (message.type === "ready") {
            if (!message.supported) this.fallbackToCanvas();
            finish(message.supported ? "worker" : "canvas");
            return;
          }
          const job = this.pending.get(message.id);
          if (!job) return;
          this.pending.delete(message.id);
          if (message.type === "result") job.resolve(message.result);
          else
            job.reject(
              message.fallback
                ? new CanvasUnavailableError(message.message)
                : new Error(message.message),
            );
        };
        worker.onerror = (event) => {
          event.preventDefault();
          this.fallbackToCanvas();
          finish("canvas");
        };
        worker.onmessageerror = () => {
          this.fallbackToCanvas();
          finish("canvas");
        };
      } catch {
        this.fallbackToCanvas();
        finish("canvas");
      }
    });
  }

  private fallbackToCanvas() {
    this.worker?.terminate();
    this.worker = undefined;
    this.currentMode = "canvas";
    for (const job of this.pending.values())
      job.reject(
        new CanvasUnavailableError("后台处理不可用，正在使用本地画布。"),
      );
    this.pending.clear();
    if (!this.destroyed) this.onModeChange?.("canvas");
  }

  compress(
    file: File,
    options: ImageCompressionOptions,
    signal: AbortSignal,
  ): Promise<ImageCompressionResult> {
    const job = this.queue
      .catch(() => undefined)
      .then(async () => {
        await this.ready;
        throwIfImageAborted(signal);
        if (this.destroyed) throw new DOMException("工具已关闭", "AbortError");
        if (this.currentMode === "worker" && this.worker) {
          try {
            const id = ++this.nextId;
            const abort = () =>
              this.worker?.postMessage({
                type: "cancel",
                id,
              } satisfies CompressionWorkerRequest);
            signal.addEventListener("abort", abort, { once: true });
            try {
              const result = await new Promise<ImageCompressionResult>(
                (resolve, reject) => {
                  this.pending.set(id, { resolve, reject });
                  this.worker?.postMessage({
                    type: "compress",
                    id,
                    file,
                    options,
                  } satisfies CompressionWorkerRequest);
                },
              );
              throwIfImageAborted(signal);
              return result;
            } finally {
              signal.removeEventListener("abort", abort);
              this.pending.delete(id);
            }
          } catch (error) {
            throwIfImageAborted(signal);
            if (!(error instanceof CanvasUnavailableError)) throw error;
            this.fallbackToCanvas();
          }
        }
        if (this.destroyed) throw new DOMException("工具已关闭", "AbortError");
        return compressImageLocally(file, options, "canvas", signal);
      });
    this.queue = job;
    return job;
  }

  destroy() {
    this.destroyed = true;
    this.fallbackToCanvas();
    this.finishInitialization?.();
  }
}
