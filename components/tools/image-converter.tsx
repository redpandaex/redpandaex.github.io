"use client";

import { Download, ImagePlus, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { PageLink } from "@/components/page-motion";
import { imageSizeLabel } from "@/lib/tools/image-compression";
import {
  conversionDownloadName,
  IMAGE_CONVERSION_CATALOG,
  type ImageConversionFormat,
  type ImageConversionResult,
  MAX_CONVERSION_BYTES,
  MAX_CONVERSION_FILES,
} from "@/lib/tools/image-conversion";
import {
  type ConversionClientState,
  ImageConversionClient,
} from "@/lib/tools/image-conversion-client";

type Entry = {
  id: number;
  file: File;
  status: "queued" | "processing" | "ready" | "error" | "cancelled";
  error?: string;
  result?: ImageConversionResult & { url: string; previewUrl: string };
};
const labels: Record<Entry["status"], string> = {
  queued: "等待转换",
  processing: "正在转换",
  ready: "已完成",
  error: "转换失败",
  cancelled: "已取消",
};
const qualityFormats = new Set(["jpeg", "webp", "avif", "jxl", "jp2"]);
const accept = [
  ...IMAGE_CONVERSION_CATALOG.flatMap(({ extension, mime }) => [
    `.${extension}`,
    mime,
  ]),
  ".jpg",
  ".tif",
  ".j2k",
  ".jpx",
  ".targa",
  ".rgbe",
].join(",");

export function ImageConverter() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const entriesRef = useRef<Entry[]>([]);
  const [engine, setEngine] = useState<ConversionClientState>({
    status: "loading",
    formats: [],
    engineBytes: 0,
  });
  const [formats, setFormats] = useState<ImageConversionFormat[]>([]);
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState(92);
  const [running, setRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const clientRef = useRef<ImageConversionClient | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generation = useRef(0);
  const nextId = useRef(0);
  const urlsRef = useRef(new Set<string>());
  const fieldId = useId();

  useEffect(() => {
    let active = true;
    const client = new ImageConversionClient(
      () =>
        new Worker(
          new URL(
            "../../lib/tools/image-conversion.worker.ts",
            import.meta.url,
          ),
        ),
      (state) => {
        if (!active) return;
        setEngine(state);
        if (state.status === "ready") setFormats(state.formats);
      },
    );
    clientRef.current = client;
    const urls = urlsRef.current;
    return () => {
      active = false;
      generation.current++;
      client.destroy();
      clientRef.current = null;
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
    };
  }, []);

  function updateEntries(update: (current: Entry[]) => Entry[]) {
    const next = update(entriesRef.current);
    entriesRef.current = next;
    setEntries(next);
  }
  function release(entry: Entry) {
    if (!entry.result) return;
    for (const url of [entry.result.url, entry.result.previewUrl]) {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(url);
    }
  }
  function invalidate() {
    generation.current++;
    clientRef.current?.cancel();
    setRunning(false);
  }
  function resetResults() {
    invalidate();
    updateEntries((current) =>
      current.map((entry) => {
        release(entry);
        return { id: entry.id, file: entry.file, status: "queued" };
      }),
    );
    setNotice("");
  }
  function addFiles(files: FileList | File[]) {
    if (!files.length) return;
    invalidate();
    const remaining = MAX_CONVERSION_FILES - entriesRef.current.length;
    const selected = Array.from(files).slice(0, remaining);
    const added = selected.map((file): Entry => {
      const error = !file.size
        ? "文件为空，请选择有效图片。"
        : file.size > MAX_CONVERSION_BYTES
          ? "文件超过 20 MB，请选择较小的图片。"
          : undefined;
      return {
        id: ++nextId.current,
        file,
        status: error ? "error" : "queued",
        error,
      };
    });
    updateEntries((current) => [
      ...current.map(
        (entry): Entry =>
          entry.status === "processing"
            ? { ...entry, status: "queued" }
            : entry,
      ),
      ...added,
    ]);
    setNotice(
      files.length > remaining
        ? `最多保留 ${MAX_CONVERSION_FILES} 张图片，本次加入 ${selected.length} 张。`
        : "",
    );
  }
  function clear() {
    invalidate();
    updateEntries((current) => {
      for (const entry of current) release(entry);
      return [];
    });
    setNotice("");
    if (inputRef.current) inputRef.current.value = "";
  }
  function remove(id: number) {
    invalidate();
    updateEntries((current) =>
      current
        .filter((entry) => {
          if (entry.id !== id) return true;
          release(entry);
          return false;
        })
        .map(
          (entry): Entry =>
            entry.status === "processing"
              ? { ...entry, status: "queued" }
              : entry,
        ),
    );
  }
  function cancel() {
    invalidate();
    updateEntries((current) =>
      current.map(
        (entry): Entry =>
          ["queued", "processing"].includes(entry.status)
            ? { ...entry, status: "cancelled" }
            : entry,
      ),
    );
    setNotice("已取消剩余转换，可以调整选项后重新开始。");
  }
  async function start() {
    const client = clientRef.current;
    if (!client || !entriesRef.current.length) return;
    resetResults();
    const job = generation.current;
    const queue = entriesRef.current.map(({ id, file }) => ({ id, file }));
    setRunning(true);
    try {
      for (const entry of queue) {
        if (job !== generation.current) break;
        updateEntries((current) =>
          current.map(
            (item): Entry =>
              item.id === entry.id ? { ...item, status: "processing" } : item,
          ),
        );
        try {
          const result = await client.convert(entry.file, format, quality);
          if (job !== generation.current) break;
          const url = URL.createObjectURL(result.blob);
          const previewUrl = URL.createObjectURL(result.preview);
          urlsRef.current.add(url);
          urlsRef.current.add(previewUrl);
          updateEntries((current) =>
            current.map(
              (item): Entry =>
                item.id === entry.id
                  ? {
                      ...item,
                      status: "ready",
                      result: { ...result, url, previewUrl },
                    }
                  : item,
            ),
          );
        } catch (error) {
          if (job !== generation.current) break;
          updateEntries((current) =>
            current.map(
              (item): Entry =>
                item.id === entry.id
                  ? {
                      ...item,
                      status: "error",
                      error:
                        error instanceof Error
                          ? error.message
                          : "图片转换失败，请尝试其他格式。",
                    }
                  : item,
            ),
          );
        }
      }
    } finally {
      if (job === generation.current) setRunning(false);
    }
  }

  return (
    <div className="tool-workspace">
      <div className="tool-toolbar">
        <div className="tool-field">
          <label htmlFor={`${fieldId}-format`}>目标格式</label>
          <select
            id={`${fieldId}-format`}
            value={format}
            disabled={!formats.length}
            onChange={(event) => {
              resetResults();
              setFormat(event.target.value);
            }}
          >
            {!formats.length && <option value="png">PNG</option>}
            {formats
              .filter(({ canWrite }) => canWrite)
              .map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
          </select>
        </div>
        <div className="tool-field image-quality-field">
          <label htmlFor={`${fieldId}-quality`}>
            输出质量 · {qualityFormats.has(format) ? `${quality}%` : "默认编码"}
          </label>
          <input
            id={`${fieldId}-quality`}
            aria-label="输出质量"
            type="range"
            min={10}
            max={100}
            value={quality}
            disabled={!qualityFormats.has(format)}
            onChange={(event) => {
              resetResults();
              setQuality(Number(event.target.value));
            }}
          />
        </div>
      </div>
      <p className="tool-status" role="status" aria-live="polite">
        {engine.status === "ready"
          ? "本地转换已就绪"
          : engine.status === "error"
            ? "转换引擎加载失败"
            : "正在加载本地转换引擎，首次约 15 MB…"}
      </p>
      {engine.status === "error" && (
        <div className="tool-error" role="alert">
          <p>{engine.message}</p>
          <button
            type="button"
            className="tool-button"
            onClick={() => clientRef.current?.retry()}
          >
            重新加载
          </button>
        </div>
      )}
      <section
        className={`tool-dropzone${dragging ? " tool-dropzone-active" : ""}`}
        aria-label="待转换图片导入区域"
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
          aria-label="选择待转换图片"
          type="file"
          accept={accept}
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <span>默认保留原尺寸 · 最多 20 张 · 每张 20 MB / 2400 万像素</span>
      </section>
      <div className="tool-toolbar">
        <button
          type="button"
          className="tool-button tool-button-primary"
          disabled={!entries.length || running || engine.status !== "ready"}
          onClick={() => void start()}
        >
          开始转换
        </button>
        {running && (
          <button type="button" className="tool-button" onClick={cancel}>
            取消转换
          </button>
        )}
        <button
          type="button"
          className="tool-button"
          disabled={!entries.length}
          onClick={clear}
        >
          <Trash2 size={16} aria-hidden="true" />
          清空图片
        </button>
        {running && (
          <p className="tool-status" role="status">
            已处理{" "}
            {
              entries.filter(
                ({ status }) => status === "ready" || status === "error",
              ).length
            }{" "}
            / {entries.length} 张
          </p>
        )}
      </div>
      <details className="conversion-formats">
        <summary>
          支持的格式
          {formats.length
            ? ` · ${formats.filter(({ canRead }) => canRead).length} 种输入 / ${formats.filter(({ canWrite }) => canWrite).length} 种输出`
            : ""}
        </summary>
        {formats.length ? (
          <>
            <p>
              可导入：
              {formats
                .filter(({ canRead }) => canRead)
                .map(({ label }) => label)
                .join("、")}
              。
            </p>
            <p>
              可导出：
              {formats
                .filter(({ canWrite }) => canWrite)
                .map(({ label }) => label)
                .join("、")}
              。
            </p>
            <p>HEIC、HEIF 和 SVG 仅支持导入；SVG 转换为位图。</p>
          </>
        ) : (
          <p>引擎加载完成后显示当前支持的格式。</p>
        )}
      </details>
      <p className="tool-notice">
        图片在当前浏览器内处理，加载完成后可断网使用。输出为 8
        位静态图片，多帧、多页仅取第一帧，不保留图层和 EXIF 等元数据；HDR / EXR
        不保留原始高动态范围。JPEG / BMP 的透明区域填充白色，ICO 缩至 256 px
        内并补为正方形。转换后的文件可能更大。
      </p>
      <p className="tool-notice">
        需要调整尺寸或减小体积？使用{" "}
        <PageLink
          className="conversion-tool-link"
          href="/tools/image-compress/"
        >
          图片压缩
        </PageLink>
        。
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
                  // biome-ignore lint/performance/noImgElement: Local PNG blob previews also work for formats the browser cannot display directly.
                  <img
                    src={entry.result.previewUrl}
                    alt={`${entry.file.name} 转换预览`}
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
                  {entry.error || labels[entry.status]}
                </p>
                <dl className="image-metrics">
                  <div>
                    <dt>原图</dt>
                    <dd>
                      {imageSizeLabel(entry.file.size)}
                      {entry.result &&
                        ` · ${entry.result.originalWidth} × ${entry.result.originalHeight} · ${entry.result.inputFormat}`}
                    </dd>
                  </div>
                  {entry.result && (
                    <div>
                      <dt>结果</dt>
                      <dd>
                        {imageSizeLabel(entry.result.blob.size)} ·{" "}
                        {entry.result.width} × {entry.result.height} ·{" "}
                        {formats.find(({ id }) => id === entry.result?.format)
                          ?.label || entry.result.format}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
              <div className="image-result-actions">
                {entry.result && (
                  <a
                    className="tool-button"
                    href={entry.result.url}
                    download={conversionDownloadName(
                      entry.file.name,
                      entry.result.extension,
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
                  onClick={() => remove(entry.id)}
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
          还没有图片。选择文件后，点击「开始转换」。
        </div>
      )}
    </div>
  );
}
