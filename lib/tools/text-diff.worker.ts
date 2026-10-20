import {
  compareText,
  type TextDiffRequest,
  type TextDiffResponse,
} from "./text-diff";

const worker = self as unknown as {
  onmessage: ((event: MessageEvent<TextDiffRequest>) => void) | null;
  postMessage: (message: TextDiffResponse) => void;
};

worker.onmessage = ({ data }) => {
  try {
    worker.postMessage({
      type: "result",
      id: data.id,
      result: compareText(data),
    });
  } catch (error) {
    worker.postMessage({
      type: "error",
      id: data.id,
      message: error instanceof Error ? error.message : "对比未完成，请重试。",
    });
  }
};
worker.postMessage({ type: "ready", sourceUrl: self.location.href });
