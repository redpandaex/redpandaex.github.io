"use client";

/**
 * 流体模拟 React 组件
 */

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

export const FluidSimulation: React.FC<FluidSimulationProps> = ({
  className = "",
  config,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simulatorRef = useRef<FluidSimulator | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 等待 Canvas 准备好（有有效尺寸）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 检查 Canvas 是否有有效尺寸
    const checkCanvasReady = () => {
      if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
        // 设置 canvas 的实际像素尺寸
        canvas.width = scaleByPixelRatio(canvas.clientWidth);
        canvas.height = scaleByPixelRatio(canvas.clientHeight);
        setIsReady(true);
        return true;
      }
      return false;
    };

    // 首次检查
    if (checkCanvasReady()) return;

    // 如果首次检查失败，使用 ResizeObserver 监听尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      if (checkCanvasReady()) {
        resizeObserver.disconnect();
      }
    });
    resizeObserver.observe(canvas);

    // 备用方案：使用 requestAnimationFrame 轮询
    let frameId: number;
    const pollReady = () => {
      if (!checkCanvasReady()) {
        frameId = requestAnimationFrame(pollReady);
      }
    };
    frameId = requestAnimationFrame(pollReady);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, []);

  // 初始化模拟器（在 Canvas 准备好之后）
  useEffect(() => {
    if (!isReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      simulatorRef.current = new FluidSimulator(canvas, config);
      simulatorRef.current.start();
    } catch (error) {
      console.error("Failed to initialize fluid simulation:", error);
    }

    return () => {
      simulatorRef.current?.destroy();
      simulatorRef.current = null;
    };
  }, [isReady, config]);

  // 鼠标事件处理
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !simulatorRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const posX = scaleByPixelRatio(e.clientX - rect.left);
      const posY = scaleByPixelRatio(e.clientY - rect.top);
      simulatorRef.current.handlePointerDown(-1, posX, posY);
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !simulatorRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const posX = scaleByPixelRatio(e.clientX - rect.left);
      const posY = scaleByPixelRatio(e.clientY - rect.top);
      simulatorRef.current.handlePointerMove(-1, posX, posY);
    },
    [],
  );

  const handleMouseUp = useCallback(() => {
    simulatorRef.current?.handlePointerUp(-1);
  }, []);

  // 触摸事件处理
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !simulatorRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const touches = e.changedTouches;

      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const posX = scaleByPixelRatio(touch.clientX - rect.left);
        const posY = scaleByPixelRatio(touch.clientY - rect.top);
        simulatorRef.current.handlePointerDown(touch.identifier, posX, posY);
      }
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas || !simulatorRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const touches = e.changedTouches;

      for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        const posX = scaleByPixelRatio(touch.clientX - rect.left);
        const posY = scaleByPixelRatio(touch.clientY - rect.top);
        simulatorRef.current.handlePointerMove(touch.identifier, posX, posY);
      }
    },
    [],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const touches = e.changedTouches;
      for (let i = 0; i < touches.length; i++) {
        simulatorRef.current?.handlePointerUp(touches[i].identifier);
      }
    },
    [],
  );

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        touchAction: "none",
        ...style,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};

export default FluidSimulation;
