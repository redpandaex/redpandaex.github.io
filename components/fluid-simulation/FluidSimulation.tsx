"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { scaleByPixelRatio } from "./engine/pointers";
import type { SimulationConfig } from "./engine/types";
import { FluidSimulator } from "./FluidSimulator";

interface FluidSimulationProps {
  className?: string;
  config?: Partial<SimulationConfig>;
  style?: React.CSSProperties;
}
export function FluidSimulation({
  className = "",
  config,
  style,
}: FluidSimulationProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const simulator = useRef<FluidSimulator | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let visible = true;
    let instance: FluidSimulator | null = null;
    const sync = () => {
      if (visible && !document.hidden) instance?.start();
      else instance?.stop();
    };
    const initialize = () => {
      if (instance || !element.clientWidth || !element.clientHeight) return;
      element.width = scaleByPixelRatio(element.clientWidth);
      element.height = scaleByPixelRatio(element.clientHeight);
      try {
        instance = new FluidSimulator(element, config);
        simulator.current = instance;
        sync();
      } catch {
        setError(true);
      }
    };
    const resize = new ResizeObserver(initialize);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.01 },
    );
    initialize();
    resize.observe(element);
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    return () => {
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      instance?.destroy();
      simulator.current = null;
    };
  }, [config]);
  const position = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      return {
        x: scaleByPixelRatio(event.clientX - rect.left),
        y: scaleByPixelRatio(event.clientY - rect.top),
      };
    },
    [],
  );
  if (error)
    return (
      <div className="fluid-placeholder" role="status">
        <p>当前设备无法初始化流体模拟。</p>
        <p>请开启浏览器硬件加速，或体验项目页的 Canvas 实验。</p>
      </div>
    );
  return (
    <canvas
      ref={canvas}
      className={className}
      aria-label="交互式 WebGL 流体画布"
      style={{ width: "100%", height: "100%", touchAction: "none", ...style }}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        const { x, y } = position(event);
        simulator.current?.handlePointerDown(event.pointerId, x, y);
      }}
      onPointerMove={(event) => {
        const { x, y } = position(event);
        simulator.current?.handlePointerMove(event.pointerId, x, y);
      }}
      onPointerUp={(event) =>
        simulator.current?.handlePointerUp(event.pointerId)
      }
      onPointerCancel={(event) =>
        simulator.current?.handlePointerUp(event.pointerId)
      }
    />
  );
}
export default FluidSimulation;
