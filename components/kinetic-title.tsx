"use client";

import { CornerDownLeft, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useMotion } from "@/components/motion-provider";
import { usePalette } from "@/components/palette-provider";
import { useTheme } from "@/components/theme-provider";
import {
  createTextPlayground,
  type PlaygroundPhase,
  type PlaygroundRenderer,
} from "@/lib/type-playground/controller";
import styles from "./kinetic-title.module.css";

const lines = ["Code.", "Create."];
const hints: Record<PlaygroundPhase, string> = {
  ready: "移动鼠标拨动文字，点一下，让字母掉下来。",
  loading: "马上就好，字母正在松动。",
  falling: "拖住一个字母，试着甩一下。",
  returning: "正在重新排好，马上回来。",
};

export function KineticTitle({
  variant = "playground",
}: {
  variant?: "home" | "playground";
}) {
  const hintId = useId();
  const Heading = variant === "home" ? "h1" : "h2";
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const keyboardRef = useRef(false);
  const engineRef = useRef<ReturnType<typeof createTextPlayground> | null>(
    null,
  );
  const [phase, setPhase] = useState<PlaygroundPhase>("ready");
  const [renderer, setRenderer] = useState<PlaygroundRenderer>("loading");
  const [error, setError] = useState("");
  const { reducedMotion } = useMotion();
  const { palette } = usePalette();
  const { resolvedTheme } = useTheme();
  const appearance = `${resolvedTheme}:${palette.id}`;

  useEffect(() => {
    const stage = stageRef.current;
    const title = titleRef.current;
    const layer = layerRef.current;
    const canvas = canvasRef.current;
    if (!stage || !title || !layer || !canvas) return;
    setPhase("ready");
    if (
      reducedMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setRenderer("static");
      return;
    }
    const engine = createTextPlayground({
      stage,
      title,
      layer,
      canvas,
      onPhase: setPhase,
      onRenderer: setRenderer,
      onError: setError,
    });
    engineRef.current = engine;
    let visible = false;
    const sync = () => engine.setPaused(!visible || document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 },
    );
    observer.observe(stage);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      engine.dispose();
      engineRef.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (appearance) engineRef.current?.refresh();
  }, [appearance]);

  useEffect(() => {
    if (
      keyboardRef.current &&
      (phase === "ready" || (phase === "falling" && variant === "playground"))
    ) {
      keyboardRef.current = false;
      const control = variant === "home" ? triggerRef : actionRef;
      control.current?.focus({ preventScroll: true });
    }
  }, [phase, variant]);

  const scatter = (keyboard = false) => {
    if (reducedMotion) return;
    keyboardRef.current = keyboard;
    setError("");
    void engineRef.current?.scatter();
  };
  const busy = phase === "loading" || phase === "returning";
  const hint = reducedMotion
    ? "已按系统设置减少动态效果，保留静态文字。"
    : renderer === "static" && phase === "ready"
      ? "点一下，让字母掉下来。"
      : hints[phase];

  return (
    <div className={variant === "home" ? styles.home : undefined}>
      <div
        ref={stageRef}
        className={styles.stage}
        data-phase={phase}
        data-renderer={renderer}
        data-testid="text-stage"
      >
        <Heading
          ref={titleRef}
          className={styles.title}
          aria-label="Code. Create."
        >
          {lines.map((line, index) => (
            <span
              key={line}
              className={styles.line}
              data-accent={index === 1 ? "" : undefined}
              aria-hidden="true"
            >
              {Array.from(line).map((letter, position) => (
                <span key={`${line}-${position}`} data-glyph="">
                  {letter}
                </span>
              ))}
              <span data-baseline="" className={styles.baseline} />
            </span>
          ))}
        </Heading>
        <canvas
          ref={canvasRef}
          className={styles.lens}
          aria-hidden="true"
          tabIndex={-1}
        />
        <div ref={layerRef} className={styles.pieces} aria-hidden="true" />
        <button
          ref={triggerRef}
          type="button"
          className={styles.trigger}
          onClick={(event) => scatter(event.detail === 0)}
          aria-label="点击标题，让字母掉下来"
          aria-describedby={variant === "playground" ? hintId : undefined}
          disabled={phase !== "ready" || reducedMotion}
          tabIndex={phase === "ready" && !reducedMotion ? 0 : -1}
        />
        <div className={styles.floor} aria-hidden="true" />
      </div>

      {variant === "playground" && (
        <div className={styles.controls}>
          <p id={hintId} className={styles.hint} aria-live="polite">
            {error || hint}
          </p>
          <button
            ref={actionRef}
            type="button"
            className={styles.action}
            disabled={busy || reducedMotion}
            onClick={(event) => {
              if (phase === "falling") {
                keyboardRef.current = event.detail === 0;
                void engineRef.current?.restore();
              } else scatter(event.detail === 0);
            }}
          >
            {phase === "ready" ? (
              <>
                <span>碰一下</span>
                <CornerDownLeft size={17} />
              </>
            ) : (
              <>
                <RotateCcw size={17} />
                <span>
                  {busy
                    ? phase === "loading"
                      ? "准备中"
                      : "正在归位"
                    : "重新排好"}
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
