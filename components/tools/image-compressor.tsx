"use client";

import { Download, ImagePlus, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  type CompressionMode,
  ImageCompressionEngine,
  type ImageCompressionOptions,
  type ImageCompressionResult,
  type ImageOutputMime,
  imageDownloadName,
  imageSizeLabel,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_FILES,
} from "@/lib/tools/image-compression";

type ImageStatus = "queued" | "processing" | "ready" | "error" | "cancelled";
interface ImageEntry {
  id: number;
  file: File;
  status: ImageStatus;
  error?: string;
  result?: ImageCompressionResult & { url: string };
}

const statusText: Record<ImageStatus, string> = {
  queued: "等待处理",
  processing: "正在处理",
  ready: "已完成",
  error: "处理失败",
  cancelled: "已取消",
};

function sizeChangeLabel(original: number, result: number) {
  if (original === result) return "大小相同";
  const percent = (Math.abs(original - result) / original) * 100;
  return `${result < original ? "减少" : "增大"} ${percent.toFixed(1)}%`;
}

function outputFormatLabel(mime: string) {
  return mime === "image/jpeg"
    ? "JPEG"
    : mime === "image/webp"
      ? "WebP"
      : "PNG";
}

export function ImageCompressor() {
  const [entries, setEntries] = useState<ImageEntry[]>([]);
  const entriesRef = useRef<ImageEntry[]>([]);
  const [options, setOptions] = useState<ImageCompressionOptions>({
    format: "image/webp",
    quality: 0.8,
    maxEdge: 1920,
  });
  const [mode, setMode] = useState<CompressionMode | "initializing">(
    "initializing",
  );
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const engineRef = useRef<ImageCompressionEngine | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const idRef = useRef(0);
  const urlsRef = useRef(new Set<string>());
  const fieldId = useId();

  useEffect(() => {
    let active = true;
    const engine = new ImageCompressionEngine(
      (nextMode) => {
        if (active) setMode(nextMode);
      },
      () =>
        new Worker(
          new URL(
            "../../lib/tools/image-compression.worker.ts",
            import.meta.url,
          ),
          { type: "module" },
        ),
    );
    engineRef.current = engine;
    void engine.whenReady().then((nextMode) => {
      if (active) setMode(nextMode);
    });
    const urls = urlsRef.current;
    return () => {
      active = false;
      generationRef.current++;
      controllerRef.current?.abort();
      engine.destroy();
      engineRef.current = null;
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  function updateEntries(update: (current: ImageEntry[]) => ImageEntry[]) {
    const next = update(entriesRef.current);
    entriesRef.current = next;
    setEntries(next);
  }

  function revokeResult(entry: ImageEntry) {
    if (!entry.result) return;
    URL.revokeObjectURL(entry.result.url);
    urlsRef.current.delete(entry.result.url);
  }

  function invalidateJob() {
    generationRef.current++;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setRunning(false);
  }

  function changeOptions(update: Partial<ImageCompressionOptions>) {
    invalidateJob();
    setOptions((current) => ({ ...current, ...update }));
    updateEntries((current) =>
      current.map((entry) => {
        revokeResult(entry);
        return { id: entry.id, file: entry.file, status: "queued" };
      }),
    );
    setNotice("");
  }

  function addFiles(files: FileList | File[]) {
    if (!files.length) return;
    invalidateJob();
    const remaining = MAX_IMAGE_FILES - entriesRef.current.length;
    const selected = Array.from(files).slice(0, remaining);
    const next = selected.map((file): ImageEntry => {
      const error =
        file.size === 0
          ? "文件为空，请选择有效图片。"
          : file.size > MAX_IMAGE_BYTES
            ? "文件超过 20 MB，请选择较小的图片。"
            : undefined;
      return {
        id: ++idRef.current,
        file,
        status: error ? "error" : "queued",
        error,
      };
    });
    updateEntries((current) => [
      ...current.map(
        (entry): ImageEntry =>
          entry.status === "processing"
            ? { ...entry, status: "queued" }
            : entry,
      ),
      ...next,
    ]);
    setNotice(
      files.length > remaining
        ? `最多保留 ${MAX_IMAGE_FILES} 张图片，本次加入 ${selected.length} 张；其余图片未加入。`
        : "",
    );
  }

  function clearImages() {
    invalidateJob();
    updateEntries((current) => {
      for (const entry of current) revokeResult(entry);
      return [];
    });
    setNotice("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(id: number) {
    invalidateJob();
    updateEntries((current) =>
      current
        .filter((entry) => {
          if (entry.id === id) {
            revokeResult(entry);
            return false;
          }
          return true;
        })
        .map(
          (entry): ImageEntry =>
            entry.status === "processing"
              ? { ...entry, status: "queued" }
              : entry,
        ),
    );
  }

  function cancelProcessing() {
    invalidateJob();
    updateEntries((current) =>
      current.map(
        (entry): ImageEntry =>
          entry.status === "queued" || entry.status === "processing"
            ? { ...entry, status: "cancelled" }
            : entry,
      ),
    );
    setNotice("已取消剩余处理，可以调整选项后重新开始。");
  }

  async function startCompression() {
    const engine = engineRef.current;
    if (!engine || !entriesRef.current.length) return;
    invalidateJob();
    const generation = generationRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    const snapshot = { ...options };
    const queue = entriesRef.current.map((entry) => ({
      id: entry.id,
      file: entry.file,
    }));
    updateEntries((current) =>
      current.map((entry) => {
        revokeResult(entry);
        return { id: entry.id, file: entry.file, status: "queued" };
      }),
    );
    setNotice("");
    setRunning(true);
    try {
      for (const entry of queue) {
        if (generation !== generationRef.current || controller.signal.aborted)
          break;
        updateEntries((current) =>
          current.map(
            (item): ImageEntry =>
              item.id === entry.id ? { ...item, status: "processing" } : item,
          ),
        );
        try {
          const result = await engine.compress(
            entry.file,
            snapshot,
            controller.signal,
          );
          if (generation !== generationRef.current || controller.signal.aborted)
            break;
          const url = URL.createObjectURL(result.blob);
          urlsRef.current.add(url);
          updateEntries((current) =>
            current.map(
              (item): ImageEntry =>
                item.id === entry.id
                  ? { ...item, status: "ready", result: { ...result, url } }
                  : item,
            ),
          );
        } catch (error) {
          if (generation !== generationRef.current || controller.signal.aborted)
            break;
          updateEntries((current) =>
            current.map(
              (item): ImageEntry =>
                item.id === entry.id
                  ? {
                      ...item,
                      status: "error",
                      error:
                        error instanceof Error
                          ? error.message
                          : "图片处理失败，请尝试其他文件。",
                    }
                  : item,
            ),
          );
        }
      }
    } finally {
      if (generation === generationRef.current) {
        controllerRef.current = null;
        setRunning(false);
      }
    }
  }

  const completed = entries.filter(
    (entry) => entry.status === "ready" || entry.status === "error",
  ).length;

  return (
    <div className="tool-workspace">
      <div className="tool-toolbar">
        <div className="tool-field">
          <label htmlFor={`${fieldId}-format`}>输出格式</label>
          <select
            id={`${fieldId}-format`}
            value={options.format}
            onChange={(event) =>
              changeOptions({ format: event.target.value as ImageOutputMime })
            }
          >
            <option value="image/webp">WebP</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
          </select>
        </div>
        <div className="tool-field">
          <label htmlFor={`${fieldId}-size`}>最大边长</label>
          <select
            id={`${fieldId}-size`}
            value={options.maxEdge}
            onChange={(event) =>
              changeOptions({ maxEdge: Number(event.target.value) })
            }
          >
            <option value={0}>保持原尺寸</option>
            <option value={1280}>1280 px</option>
            <option value={1920}>1920 px</option>
            <option value={2560}>2560 px</option>
            <option value={3840}>3840 px</option>
          </select>
        </div>
        <div className="tool-field image-quality-field">
          <label htmlFor={`${fieldId}-quality`}>
            压缩质量{" "}
            <span>
              {options.format === "image/png"
                ? "PNG 无损"
                : `${Math.round(options.quality * 100)}%`}
            </span>
          </label>
          <input
            id={`${fieldId}-quality`}
            aria-label="压缩质量"
            type="range"
            min={10}
            max={100}
            step={1}
            value={Math.round(options.quality * 100)}
            disabled={options.format === "image/png"}
            onChange={(event) =>
              changeOptions({ quality: Number(event.target.value) / 100 })
            }
          />
        </div>
      </div>

      <section
        className={`tool-dropzone${dragging ? " tool-dropzone-active" : ""}`}
        aria-label="图片导入区域"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          )
            setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <ImagePlus size={30} aria-hidden="true" />
        <p>拖入图片，或从本机选择</p>
        <button
          type="button"
          className="tool-button"
          onClick={() => inputRef.current?.click()}
        >
          选择图片
        </button>
        <input
          ref={inputRef}
          aria-label="选择图片"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <span>JPEG / PNG / WebP · 最多 20 张 · 每张 20 MB / 2400 万像素</span>
      </section>

      <div className="tool-toolbar">
        <button
          type="button"
          className="tool-button tool-button-primary"
          disabled={!entries.length || running || mode === "initializing"}
          onClick={() => void startCompression()}
        >
          开始压缩
        </button>
        {running && (
          <button
            type="button"
            className="tool-button"
            onClick={cancelProcessing}
          >
            取消处理
          </button>
        )}
        <button
          type="button"
          className="tool-button"
          disabled={!entries.length}
          onClick={clearImages}
        >
          <Trash2 size={16} aria-hidden="true" />
          清空图片
        </button>
        <p className="tool-status" role="status" aria-live="polite">
          {mode === "initializing"
            ? "正在准备本地处理…"
            : running
              ? `已处理 ${completed} / ${entries.length} 张`
              : `本地处理已就绪${mode === "canvas" ? " · 兼容画布模式" : ""}`}
        </p>
      </div>

      <p className="tool-notice">
        图片只在当前浏览器内处理。只缩小、不放大；JPEG
        的透明区域填充白色。输出为静态图片，不保留 EXIF
        等元数据，结果可能比原图更大。
      </p>
      {notice && (
        <p className="tool-notice" role="status">
          {notice}
        </p>
      )}

      {entries.length ? (
        <div className="image-results">
          {entries.map((entry) => (
            <article
              key={entry.id}
              className="image-result"
              aria-label={entry.file.name}
            >
              <div className="image-preview">
                {entry.result ? (
                  // biome-ignore lint/performance/noImgElement: Local blob previews must not use the remote image optimizer.
                  <img
                    src={entry.result.url}
                    alt={`${entry.file.name} 压缩预览`}
                    loading="lazy"
                  />
                ) : (
                  <ImagePlus size={32} aria-hidden="true" />
                )}
              </div>
              <div className="image-result-info">
                <h3>{entry.file.name}</h3>
                <p
                  className={
                    entry.status === "error" ? "tool-error" : "tool-status"
                  }
                >
                  {entry.error || statusText[entry.status]}
                </p>
                <dl className="image-metrics">
                  <div>
                    <dt>原图</dt>
                    <dd>
                      {imageSizeLabel(entry.file.size)}
                      {entry.result &&
                        ` · ${entry.result.originalWidth} × ${entry.result.originalHeight}`}
                    </dd>
                  </div>
                  {entry.result && (
                    <>
                      <div>
                        <dt>结果</dt>
                        <dd>
                          {imageSizeLabel(entry.result.blob.size)} ·{" "}
                          {entry.result.width} × {entry.result.height} ·{" "}
                          {outputFormatLabel(entry.result.mime)}
                        </dd>
                      </div>
                      <div>
                        <dt>体积变化</dt>
                        <dd>
                          {sizeChangeLabel(
                            entry.file.size,
                            entry.result.blob.size,
                          )}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
                {entry.result && entry.result.mime !== options.format && (
                  <p className="tool-notice">
                    浏览器不支持所选编码，实际输出为{" "}
                    {outputFormatLabel(entry.result.mime)}。
                  </p>
                )}
              </div>
              <div className="image-result-actions">
                {entry.result && (
                  <a
                    className="tool-button"
                    href={entry.result.url}
                    download={imageDownloadName(
                      entry.file.name,
                      entry.result.mime,
                    )}
                    aria-label={`下载 ${entry.file.name}`}
                  >
                    <Download size={16} aria-hidden="true" />
                    下载图片
                  </a>
                )}
                <button
                  type="button"
                  className="tool-button"
                  aria-label={`移除 ${entry.file.name}`}
                  onClick={() => removeImage(entry.id)}
                >
                  <X size={16} aria-hidden="true" />
                  移除
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="tool-empty">
          还没有图片。选择文件后，点击「开始压缩」。
        </div>
      )}
    </div>
  );
}
