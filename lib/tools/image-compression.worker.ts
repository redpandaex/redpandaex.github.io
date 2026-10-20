import {
  type CompressionWorkerRequest,
  type CompressionWorkerResponse,
  compressImageLocally,
  imageWorkerErrorNeedsFallback,
} from "./image-compression";

const scope = globalThis as unknown as {
  postMessage: (message: CompressionWorkerResponse) => void;
  onmessage: ((event: MessageEvent<CompressionWorkerRequest>) => void) | null;
};

const jobs = new Map<number, AbortController>();

scope.onmessage = async (event) => {
  const message = event.data;
  if (message.type === "cancel") {
    jobs.get(message.id)?.abort();
    return;
  }
  const controller = new AbortController();
  jobs.set(message.id, controller);
  try {
    const result = await compressImageLocally(
      message.file,
      message.options,
      "worker",
      controller.signal,
    );
    scope.postMessage({ type: "result", id: message.id, result });
  } catch (error) {
    scope.postMessage({
      type: "error",
      id: message.id,
      message:
        error instanceof Error
          ? error.message
          : "图片处理失败，请尝试其他文件。",
      fallback: imageWorkerErrorNeedsFallback(error),
    });
  } finally {
    jobs.delete(message.id);
  }
};

let supported = false;
try {
  supported =
    typeof OffscreenCanvas !== "undefined" &&
    typeof createImageBitmap === "function" &&
    !!new OffscreenCanvas(1, 1).getContext("2d");
} catch {
  /* Main-thread canvas remains available if the worker lacks a 2D context. */
}
scope.postMessage({ type: "ready", supported });
