import type {
  ImageConversionFormat,
  ImageConversionResponse,
  ImageConversionResult,
} from "./image-conversion";

export type ConversionClientState = {
  status: "loading" | "ready" | "error";
  formats: ImageConversionFormat[];
  engineBytes: number;
  message?: string;
};

type PendingConversion = {
  id: number;
  resolve: (result: ImageConversionResult) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

/** Own the worker and reusable engine bytes for offline restarts. */
export class ImageConversionClient {
  private worker: Worker | null = null;
  private workerSource = "";
  private dependencySources: string[] = [];
  private wasm: ArrayBuffer | undefined;
  private request: AbortController | null = null;
  private pending: PendingConversion | null = null;
  private nextId = 0;
  private generation = 0;
  private destroyed = false;
  private bootTimer: ReturnType<typeof setTimeout> | undefined;
  private ready: Promise<void> = Promise.resolve();
  private resolveReady: (() => void) | undefined;
  private rejectReady: ((error: Error) => void) | undefined;

  constructor(
    private readonly createWorker: () => Worker,
    private readonly onState: (state: ConversionClientState) => void,
  ) {
    this.start();
  }

  private stop(error: Error) {
    this.generation++;
    clearTimeout(this.bootTimer);
    this.worker?.terminate();
    this.worker = null;
    this.request?.abort();
    this.request = null;
    if (this.pending) {
      clearTimeout(this.pending.timer);
      this.pending.reject(error);
      this.pending = null;
    }
    this.rejectReady?.(error);
    this.resolveReady = undefined;
    this.rejectReady = undefined;
  }

  private fail(worker: Worker, message: string) {
    if (this.worker !== worker || this.destroyed) return;
    this.stop(new Error(message));
    this.onState({ status: "error", formats: [], engineBytes: 0, message });
  }

  private start() {
    if (this.destroyed) return;
    this.onState({ status: "loading", formats: [], engineBytes: 0 });
    this.ready = new Promise<void>((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
    // A failed preload can happen before the user starts a conversion.
    void this.ready.catch(() => undefined);
    try {
      const worker = this.workerSource
        ? new Worker(this.workerSource)
        : this.createWorker();
      this.worker = worker;
      this.bootTimer = setTimeout(
        () => this.fail(worker, "转换引擎加载超时，请检查网络后重试。"),
        45_000,
      );
      worker.onmessage = async ({
        data,
      }: MessageEvent<ImageConversionResponse>) => {
        if (this.worker !== worker || this.destroyed) return;
        if (data.type === "ready") {
          try {
            if (!this.workerSource) {
              const sourceUrl = new URL(data.sourceUrl);
              if (sourceUrl.origin !== location.origin)
                throw new Error("Unexpected worker origin");
              const controller = new AbortController();
              this.request = controller;
              const dependencies = [...new Set(data.dependencyUrls || [])].map(
                (url) => new URL(url, sourceUrl),
              );
              if (dependencies.some((url) => url.origin !== location.origin))
                throw new Error("Unexpected worker dependency origin");
              const sources = await Promise.all(
                [sourceUrl, ...dependencies].map(async (url) => {
                  const response = await fetch(url, {
                    signal: controller.signal,
                  });
                  if (!response.ok)
                    throw new Error("Worker source unavailable");
                  return response.text();
                }),
              );
              if (this.worker !== worker || this.destroyed) return;
              const cachedScripts: Record<string, string> = {};
              for (const [index, dependency] of dependencies.entries()) {
                const url = URL.createObjectURL(
                  new Blob([sources[index + 1]], {
                    type: "application/javascript",
                  }),
                );
                this.dependencySources.push(url);
                cachedScripts[dependency.href] = url;
              }
              // Webpack can split the codec into importScripts dependencies.
              // Resolve those against the original URL, then load cached blobs.
              const bootstrap = `{
                const scripts = ${JSON.stringify(cachedScripts)};
                const base = ${JSON.stringify(sourceUrl.href)};
                const load = self.importScripts.bind(self);
                self.importScripts = (...urls) => load(...urls.map(url => {
                  const cached = scripts[new URL(url, base).href];
                  if (!cached) throw new Error("Uncached worker dependency");
                  return cached;
                }));
              }\n`;
              this.workerSource = URL.createObjectURL(
                new Blob([bootstrap, sources[0]], {
                  type: "application/javascript",
                }),
              );
              this.request = null;
            }
            this.wasm = data.wasmBytes || this.wasm;
            if (!this.wasm) throw new Error("Engine cache unavailable");
            clearTimeout(this.bootTimer);
            this.resolveReady?.();
            this.resolveReady = undefined;
            this.rejectReady = undefined;
            this.onState({
              status: "ready",
              formats: data.formats,
              engineBytes: data.engineBytes,
            });
          } catch {
            this.fail(worker, "本地转换引擎未能完整加载，请联网重试。");
          }
          return;
        }
        if (data.type === "error" && data.id === undefined) {
          this.fail(worker, data.message);
          return;
        }
        const pending = this.pending;
        if (!pending || pending.id !== data.id) return;
        clearTimeout(pending.timer);
        this.pending = null;
        if (data.type === "result") pending.resolve(data.result);
        else pending.reject(new Error(data.message));
      };
      worker.onerror = (event) => {
        event.preventDefault();
        this.fail(worker, "转换引擎发生错误，请重试或减少图片尺寸。");
      };
      worker.onmessageerror = () =>
        this.fail(worker, "转换结果读取失败，请重新处理。");
      worker.postMessage({ type: "init", wasm: this.wasm });
    } catch {
      const error = new Error(
        "当前浏览器无法加载转换引擎，请使用新版浏览器后重试。",
      );
      this.stop(error);
      this.onState({
        status: "error",
        formats: [],
        engineBytes: 0,
        message: error.message,
      });
    }
  }

  async convert(file: File, format: string, quality: number) {
    const generation = this.generation;
    await this.ready;
    const worker = this.worker;
    if (!worker || this.destroyed || generation !== this.generation)
      throw new DOMException("转换已取消", "AbortError");
    if (this.pending) throw new Error("上一张图片尚未处理完成。");
    const id = ++this.nextId;
    return new Promise<ImageConversionResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending?.id !== id) return;
        this.stop(
          new Error("这张图片转换超过 60 秒，已停止处理。可尝试其他格式。"),
        );
        this.start();
      }, 60_000);
      this.pending = { id, resolve, reject, timer };
      try {
        worker.postMessage({ type: "convert", id, file, format, quality });
      } catch {
        clearTimeout(timer);
        this.pending = null;
        reject(new Error("无法读取这张图片，请重新选择文件。"));
      }
    });
  }

  cancel() {
    this.generation++;
    if (!this.pending || this.destroyed) return;
    this.stop(new DOMException("转换已取消", "AbortError"));
    this.start();
  }

  retry() {
    this.stop(new DOMException("正在重新加载转换引擎", "AbortError"));
    this.start();
  }

  destroy() {
    this.destroyed = true;
    this.stop(new DOMException("工具已关闭", "AbortError"));
    if (this.workerSource) URL.revokeObjectURL(this.workerSource);
    for (const url of this.dependencySources) URL.revokeObjectURL(url);
    this.dependencySources = [];
    this.workerSource = "";
    this.wasm = undefined;
  }
}
