"use client";

import { useEffect, useRef } from "react";
import type { AmbientEngine, AmbientKind } from "@/lib/ambient-types";
import { useMotion } from "./motion-provider";
import { usePalette } from "./palette-provider";

export function AmbientSurface({
  kind,
  children,
  className = "",
  id,
}: {
  kind: AmbientKind;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLCanvasElement>(null);
  const { active } = useMotion();
  const { palette } = usePalette();
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const fallback = fallbackRef.current;
    if (!active || !root || !canvas || (kind === "ink" && !fallback)) return;
    let alive = true;
    let visible = false;
    let loading = false;
    let engine: AmbientEngine | null = null;
    let pointer: { x: number; y: number } | null = null;
    const sync = () => engine?.setActive(visible && !document.hidden);
    const load = async () => {
      if (loading || engine) return;
      loading = true;
      try {
        if (kind === "ink") {
          const module = await import("@/lib/ambient-ink");
          if (!alive || !fallback) return;
          engine = module.createAmbientInk(canvas, fallback, palette.colors);
        } else {
          const module = await import("@/lib/ambient-dots");
          if (!alive) return;
          engine = module.createAmbientDots(canvas, kind, palette.colors);
        }
        sync();
        if (pointer) engine.move(pointer.x, pointer.y);
      } catch {
        /* Decoration can disappear without blocking the content. */
      }
    };
    const move = (event: PointerEvent) => {
      if (!visible || document.hidden) return;
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (engine) engine.move(pointer.x, pointer.y);
      else void load();
    };
    const leave = () => {
      pointer = null;
      engine?.leave();
    };
    const release = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") leave();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) leave();
      if (visible && kind !== "ink") void load();
      sync();
    });
    observer.observe(root);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerdown", move);
    root.addEventListener("pointerup", release);
    root.addEventListener("pointerleave", leave);
    root.addEventListener("pointercancel", leave);
    document.addEventListener("visibilitychange", sync);
    return () => {
      alive = false;
      observer.disconnect();
      engine?.dispose();
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerdown", move);
      root.removeEventListener("pointerup", release);
      root.removeEventListener("pointerleave", leave);
      root.removeEventListener("pointercancel", leave);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [kind, active, palette]);
  return (
    <div
      ref={rootRef}
      id={id}
      className={`ambient-surface ambient-${kind} ${className}`}
      data-motion={active ? "on" : "off"}
    >
      <canvas
        key={`${palette.id}-${active}`}
        ref={canvasRef}
        className="ambient-layer"
        aria-hidden="true"
        tabIndex={-1}
      />
      {kind === "ink" && (
        <canvas
          key={`fallback-${palette.id}-${active}`}
          ref={fallbackRef}
          className="ambient-layer ambient-fallback"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
      {children}
    </div>
  );
}
