"use client";

import { Maximize2, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";

type Mode = "orbit" | "grid";
const colors = ["#4468ff", "#ff794e", "#a98af8", "#c2e661"];

export function CreativePlayground({ compact = false }: { compact?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<Mode>("orbit");
  const [strength, setStrength] = useState(70);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) {
      setUnavailable(true);
      return;
    }
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let phase = 0;
    let lastTime = 0;
    const pointer = { x: -1000, y: -1000 };
    const draw = (time: number) => {
      if (lastTime) phase += Math.min(time - lastTime, 32) * 0.00025;
      lastTime = time;
      context.clearRect(0, 0, width, height);
      const scale = Math.min(width, height);
      if (mode === "orbit") {
        for (let index = 0; index < 42; index++) {
          const ring = 1 + (index % 3);
          const angle = index * 2.399 + phase * (ring % 2 ? 1 : -1);
          let x = width / 2 + Math.cos(angle) * scale * (0.22 + ring * 0.06);
          let y = height / 2 + Math.sin(angle) * scale * (0.2 + ring * 0.06);
          const distance = Math.hypot(pointer.x - x, pointer.y - y);
          if (distance < 180) {
            const influence = ((1 - distance / 180) * strength) / 250;
            x += (pointer.x - x) * influence;
            y += (pointer.y - y) * influence;
          }
          const radius =
            index % 9 === 0 ? scale * 0.062 : 4 + (index % 5) * 2.5;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fillStyle = colors[index % colors.length];
          if (index % 7 === 0) {
            context.lineWidth = 3;
            context.strokeStyle = colors[index % colors.length];
            context.stroke();
          } else context.fill();
        }
        context.font = `600 ${Math.max(scale * 0.105, 24)}px monospace`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = resolvedTheme === "dark" ? "#e8ecff" : "#26315d";
        context.fillText("<play />", width / 2, height / 2);
      } else {
        const step = width < 500 ? 26 : 32;
        for (let y = 24; y < height; y += step) {
          for (let x = 24; x < width; x += step) {
            const distance = Math.hypot(pointer.x - x, pointer.y - y);
            const influence = Math.max(0, 1 - distance / 170);
            const wave =
              Math.sin(x * 0.018 + y * 0.014 + phase * 5) * (reduced ? 0 : 3);
            const dx =
              ((x - pointer.x) / Math.max(distance, 1)) *
              influence *
              strength *
              0.65;
            const dy =
              ((y - pointer.y) / Math.max(distance, 1)) *
              influence *
              strength *
              0.65;
            context.beginPath();
            context.arc(
              x + dx,
              y + dy + wave,
              influence > 0.2 ? 3.5 : 2.2,
              0,
              Math.PI * 2,
            );
            context.fillStyle =
              influence > 0.15
                ? colors[Math.floor(x / step) % colors.length]
                : resolvedTheme === "dark"
                  ? "#8991af"
                  : "#7984b0";
            context.fill();
          }
        }
      }
      if (visible && !document.hidden && !paused && !reduced)
        frame = requestAnimationFrame(draw);
      else frame = 0;
    };
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      lastTime = 0;
      frame = 0;
      if (!document.hidden) draw(0);
    };
    const resize = new ResizeObserver(() => {
      const rect = element.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.round(width * ratio);
      element.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      schedule();
    });
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        schedule();
      },
      { threshold: 0.01 },
    );
    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      if (paused || reduced) schedule();
    };
    const leave = () => {
      pointer.x = -1000;
      pointer.y = -1000;
      if (paused || reduced) schedule();
    };
    resize.observe(element);
    observer.observe(element);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [mode, strength, paused, reduced, resolvedTheme]);
  return (
    <div className={`creative-playground ${compact ? "is-compact" : ""}`}>
      <div className="playground-top">
        <fieldset className="segmented-control" aria-label="选择实验">
          <button
            type="button"
            aria-pressed={mode === "orbit"}
            onClick={() => setMode("orbit")}
          >
            粒子引力
          </button>
          <button
            type="button"
            aria-pressed={mode === "grid"}
            onClick={() => setMode("grid")}
          >
            弹性网格
          </button>
        </fieldset>
        <Maximize2 size={18} aria-hidden="true" />
      </div>
      {unavailable ? (
        <div className="canvas-fallback">
          <p>当前浏览器无法显示画布。</p>
          <p>请使用支持 Canvas 的浏览器体验这个实验。</p>
        </div>
      ) : (
        <canvas
          ref={canvas}
          className="experiment-canvas"
          aria-label={
            mode === "orbit"
              ? "响应鼠标和触摸的彩色粒子轨道"
              : "响应鼠标和触摸的弹性点阵"
          }
        />
      )}
      <div className="playground-controls">
        <label className="range-control">
          互动强度{" "}
          <input
            type="range"
            min="0"
            max="100"
            value={strength}
            onChange={(event) => setStrength(Number(event.target.value))}
          />
          <output>{strength}%</output>
        </label>
        <div>
          <button
            type="button"
            className="icon-button"
            aria-label={paused || reduced ? "播放实验" : "暂停实验"}
            aria-pressed={paused || reduced}
            disabled={reduced}
            onClick={() => setPaused(!paused)}
          >
            {paused || reduced ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="重置实验参数"
            onClick={() => {
              setStrength(70);
              setMode("orbit");
              setPaused(false);
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <p className="playground-caption">
        {reduced
          ? "已按系统偏好关闭自动动画，仍可移动指针或调节参数。"
          : "移动鼠标或手指，让画布回应你。"}
      </p>
    </div>
  );
}
