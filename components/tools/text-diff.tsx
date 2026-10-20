"use client";

import {
  ArrowLeftRight,
  Download,
  FileUp,
  GitCompareArrows,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DIFF_PREVIEW_LINES,
  MAX_TEXT_BYTES,
  normalizeText,
  type TextDiffResponse,
  type TextDiffResult,
  validateText,
} from "@/lib/tools/text-diff";

export function TextDiff() {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [onlyChanges, setOnlyChanges] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TextDiffResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const workerRef = useRef<Worker | null>(null);
  const workerSource = useRef("");
  const sourceRequest = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const running = useRef(false);
  const imports = useRef({ before: 0, after: 0 });

  const createWorker = useCallback(() => {
    setReady(false);
    try {
      const worker = workerSource.current
        ? new Worker(workerSource.current)
        : new Worker(
            new URL("../../lib/tools/text-diff.worker.ts", import.meta.url),
          );
      workerRef.current = worker;
      const failWorker = () => {
        if (workerRef.current !== worker) return;
        generation.current++;
        worker.terminate();
        workerRef.current = null;
        running.current = false;
        setBusy(false);
        setReady(false);
        setResult(null);
        setError("本地对比引擎加载失败，请联网刷新页面后重试。");
      };
      worker.onmessage = async ({ data }: MessageEvent<TextDiffResponse>) => {
        if (workerRef.current !== worker) return;
        if (data.type === "ready") {
          try {
            if (!workerSource.current) {
              const url = new URL(data.sourceUrl);
              if (url.origin !== window.location.origin)
                throw new Error("Unexpected worker origin");
              const controller = new AbortController();
              sourceRequest.current = controller;
              const response = await fetch(url, { signal: controller.signal });
              if (!response.ok) throw new Error("Worker source unavailable");
              const source = await response.text();
              if (workerRef.current !== worker) return;
              // Keep the compiled, standalone script locally so cancellation can
              // terminate and restart a worker without a network request.
              workerSource.current = URL.createObjectURL(
                new Blob([source], { type: "application/javascript" }),
              );
              sourceRequest.current = null;
            }
            if (workerRef.current === worker) setReady(true);
          } catch {
            failWorker();
          }
          return;
        }
        if (data.id !== generation.current) return;
        running.current = false;
        setBusy(false);
        if (data.type === "result") setResult(data.result);
        else setError(data.message);
      };
      worker.onerror = (event) => {
        event.preventDefault();
        failWorker();
      };
      worker.onmessageerror = failWorker;
    } catch {
      setError("当前浏览器无法启动本地计算线程，请使用新版浏览器。");
    }
  }, []);

  useEffect(() => {
    createWorker();
    return () => {
      generation.current++;
      imports.current.before++;
      imports.current.after++;
      workerRef.current?.terminate();
      workerRef.current = null;
      sourceRequest.current?.abort();
      if (workerSource.current) URL.revokeObjectURL(workerSource.current);
      workerSource.current = "";
    };
  }, [createWorker]);

  useEffect(() => {
    if (!result) {
      setDownloadUrl("");
      return;
    }
    const url = URL.createObjectURL(
      new Blob([result.download], { type: "text/plain;charset=utf-8" }),
    );
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  const invalidate = () => {
    generation.current++;
    setResult(null);
    setError("");
    if (running.current) {
      workerRef.current?.terminate();
      running.current = false;
      setBusy(false);
      createWorker();
    }
  };

  const importFile = async (side: "before" | "after", file?: File) => {
    if (!file) return;
    invalidate();
    const id = ++imports.current[side];
    try {
      if (file.size > MAX_TEXT_BYTES)
        throw new Error("单侧文本最多 2 MiB，请分段对比。");
      const text = normalizeText(
        new TextDecoder("utf-8", { fatal: true }).decode(
          await file.arrayBuffer(),
        ),
      );
      validateText(text);
      if (id !== imports.current[side]) return;
      invalidate();
      (side === "before" ? setBefore : setAfter)(text);
    } catch (cause) {
      if (id === imports.current[side]) {
        setError(
          cause instanceof TypeError
            ? "请选择 UTF-8 编码的文本文件。"
            : cause instanceof Error
              ? cause.message
              : "文件读取失败。",
        );
      }
    }
  };

  const compare = () => {
    invalidate();
    try {
      if (!before && !after) throw new Error("请先输入或导入文本。");
      validateText(normalizeText(before));
      validateText(normalizeText(after));
      if (!workerRef.current || !ready)
        throw new Error("本地引擎正在准备，请稍后重试。");
      running.current = true;
      setBusy(true);
      workerRef.current.postMessage({
        id: generation.current,
        before,
        after,
        ignoreWhitespace,
      });
    } catch (cause) {
      running.current = false;
      setBusy(false);
      setError(cause instanceof Error ? cause.message : "对比未完成。");
    }
  };

  const visibleRows =
    result?.rows.filter((row) => !onlyChanges || row.kind !== "unchanged") ||
    [];
  return (
    <div className="tool-workspace">
      <div className="tool-toolbar">
        <span className="tool-status" role="status">
          {ready ? "本地引擎已就绪" : "正在加载本地引擎…"}
        </span>
        <button
          type="button"
          className="tool-button"
          onClick={() => {
            imports.current.before++;
            imports.current.after++;
            invalidate();
            setBefore(after);
            setAfter(before);
          }}
        >
          <ArrowLeftRight size={16} />
          交换文本
        </button>
        <button
          type="button"
          className="tool-button"
          onClick={() => {
            imports.current.before++;
            imports.current.after++;
            invalidate();
            setBefore("");
            setAfter("");
          }}
        >
          <Trash2 size={16} />
          清空文本
        </button>
      </div>
      <div className="diff-inputs">
        {(["before", "after"] as const).map((side) => {
          const label = side === "before" ? "原始文本" : "修改后文本";
          const value = side === "before" ? before : after;
          return (
            <div className="diff-editor" key={side}>
              <div className="diff-editor-heading">
                <label htmlFor={`diff-${side}`}>{label}</label>
                <label className="tool-file-label">
                  <FileUp size={15} />
                  导入文件
                  <input
                    className="sr-only"
                    type="file"
                    aria-label={`导入${label}`}
                    accept="text/*,.json,.js,.ts,.tsx,.jsx,.css,.html,.xml,.yaml,.yml,.csv,.log,.md,.mdx"
                    onChange={(event) => {
                      void importFile(side, event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
              <textarea
                id={`diff-${side}`}
                value={value}
                spellCheck={false}
                wrap="off"
                placeholder={
                  side === "before"
                    ? "粘贴原始文本，或导入 UTF-8 文件"
                    : "粘贴修改后的文本"
                }
                onChange={(event) => {
                  imports.current[side]++;
                  invalidate();
                  try {
                    validateText(normalizeText(event.target.value));
                    (side === "before" ? setBefore : setAfter)(
                      event.target.value,
                    );
                  } catch (cause) {
                    setError(
                      cause instanceof Error ? cause.message : "文本超过限制。",
                    );
                  }
                }}
                onPaste={(event) => {
                  const input = event.currentTarget;
                  const incoming = event.clipboardData.getData("text");
                  const next =
                    value.slice(0, input.selectionStart) +
                    incoming +
                    value.slice(input.selectionEnd);
                  try {
                    validateText(normalizeText(next));
                  } catch (cause) {
                    event.preventDefault();
                    invalidate();
                    setError(
                      cause instanceof Error ? cause.message : "文本超过限制。",
                    );
                  }
                }}
              />
              <span className="diff-editor-count">
                {value.length.toLocaleString()} 字符
              </span>
            </div>
          );
        })}
      </div>
      <div className="tool-toolbar diff-actions">
        <label className="tool-check">
          <input
            type="checkbox"
            checked={ignoreWhitespace}
            onChange={(event) => {
              invalidate();
              setIgnoreWhitespace(event.target.checked);
            }}
          />
          忽略首尾空格
        </label>
        <button
          type="button"
          className="tool-button tool-button-primary"
          disabled={!ready || busy}
          onClick={compare}
        >
          <GitCompareArrows size={17} />
          {busy ? "正在对比…" : "开始对比"}
        </button>
        {busy && (
          <button type="button" className="tool-button" onClick={invalidate}>
            取消对比
          </button>
        )}
      </div>
      {error && (
        <p className="tool-error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <section className="diff-result" aria-label="对比结果">
          <div className="tool-toolbar diff-result-heading">
            <p role="status">
              {result.added || result.removed ? (
                <>
                  <span className="diff-add-count">+ {result.added} 行</span>
                  <span className="diff-remove-count">
                    − {result.removed} 行
                  </span>
                </>
              ) : (
                "两段文本一致"
              )}
            </p>
            <label className="tool-check">
              <input
                type="checkbox"
                checked={onlyChanges}
                onChange={(event) => setOnlyChanges(event.target.checked)}
              />
              只看差异
            </label>
            {downloadUrl && (
              <a
                className="tool-button"
                href={downloadUrl}
                download="text-diff.txt"
              >
                <Download size={16} />
                下载差异
              </a>
            )}
          </div>
          {(result.added > 0 || result.removed > 0) && (
            // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users must be able to scroll long differences.
            <section className="diff-lines" tabIndex={0} aria-label="逐行差异">
              {visibleRows.slice(0, DIFF_PREVIEW_LINES).map((row, index) => (
                <div
                  className="diff-line"
                  data-diff={row.kind}
                  key={`${row.before}-${row.after}-${index}`}
                >
                  <span>{row.before}</span>
                  <span>{row.after}</span>
                  <code>
                    <b aria-hidden="true">
                      {row.kind === "added"
                        ? "+"
                        : row.kind === "removed"
                          ? "−"
                          : " "}
                    </b>
                    {row.text || " "}
                  </code>
                </div>
              ))}
            </section>
          )}
          {visibleRows.length > DIFF_PREVIEW_LINES && (
            <p className="tool-notice">
              预览前 {DIFF_PREVIEW_LINES} 行，共{" "}
              {visibleRows.length.toLocaleString()} 行。下载可查看完整结果。
            </p>
          )}
        </section>
      )}
      {!result && !busy && !error && (
        <div className="tool-empty">
          <GitCompareArrows size={28} />
          <p>把两段文本放进来，看看改了哪里。</p>
        </div>
      )}
      <p className="tool-notice">
        按行对比，自动统一换行符。单侧最多 2 MiB / 30,000
        行；计算在后台进行，超过 2 秒或差异过多会停止。
      </p>
    </div>
  );
}
