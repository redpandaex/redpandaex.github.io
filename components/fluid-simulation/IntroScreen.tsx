"use client";

/**
 * 欢迎页面组件 - 全屏流体模拟背景
 */

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SimulationConfig } from "./engine/types";
import { FluidSimulation } from "./FluidSimulation";

interface IntroScreenProps {
  title?: string;
  subtitle?: string;
  scrollThreshold?: number; // 滚动多少像素后隐藏（默认为屏幕高度的一半）
  onEnter?: () => void; // 进入博客时的回调
  config?: Partial<SimulationConfig>;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({
  title = "Welcome",
  subtitle = "Scroll down to explore",
  scrollThreshold, // 如果不传，默认使用屏幕高度的一半
  onEnter,
  config,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);
  const [hasEntered, setHasEntered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取实际的滚动阈值（默认为屏幕高度的一半）
  const getScrollThreshold = useCallback(() => {
    return scrollThreshold ?? window.innerHeight * 0.5;
  }, [scrollThreshold]);

  // 处理滚动
  const handleScroll = useCallback(() => {
    if (hasEntered) return;

    const scrollY = window.scrollY;
    const threshold = getScrollThreshold();
    const newOpacity = Math.max(0, 1 - scrollY / threshold);
    setOpacity(newOpacity);

    if (scrollY >= threshold && !hasEntered) {
      setHasEntered(true);
      setIsVisible(false);
      onEnter?.();
    }
  }, [getScrollThreshold, hasEntered, onEnter]);

  // 处理键盘事件（保留向下箭头键进入功能）
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (hasEntered) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        // 滚动到阈值位置以触发进入
        const threshold = getScrollThreshold();
        window.scrollTo({
          top: threshold,
          behavior: "smooth",
        });
      }
    },
    [hasEntered, getScrollThreshold],
  );

  // 监听滚动和键盘
  useEffect(() => {
    // 组件挂载时重置滚动位置，确保每次访问/刷新都能看到欢迎屏幕
    window.scrollTo(0, 0);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleScroll, handleKeyDown]);

  // 检查 URL 参数是否需要跳过 intro
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("skip-intro") === "true") {
      setHasEntered(true);
      setIsVisible(false);
    }
  }, []);

  // 稳定配置对象，避免不必要的重新渲染
  const fluidConfig = useMemo(
    () => ({
      COLORFUL: true,
      TRANSPARENT: false,
      BACK_COLOR: { r: 0, g: 0, b: 0 },
      BLOOM: true,
      BLOOM_INTENSITY: 0.3,
      BLOOM_THRESHOLD: 0.8,
      SUNRAYS: true,
      SUNRAYS_WEIGHT: 0.5,
      SPLAT_RADIUS: 0.4,
      SPLAT_FORCE: 5000,
      ...config,
    }),
    [config],
  );

  if (!isVisible && hasEntered) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{
        opacity,
        pointerEvents: hasEntered ? "none" : "auto",
        transition: hasEntered ? "opacity 0.5s ease-out" : "none",
      }}
    >
      {/* 流体模拟背景 */}
      <FluidSimulation
        config={fluidConfig}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      />

      {/* 内容叠加层 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
        {/* 标题 */}
        <h1
          className="text-4xl md:text-6xl lg:text-8xl font-bold mb-4 text-center px-4"
          style={{
            textShadow:
              "0 0 20px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3)",
          }}
        >
          {title}
        </h1>

        {/* 副标题 */}
        <p
          className="text-lg md:text-xl lg:text-2xl text-white/80 mb-12 text-center px-4"
          style={{
            textShadow: "0 0 10px rgba(255,255,255,0.3)",
          }}
        >
          {subtitle}
        </p>

        {/* 向下滚动提示箭头 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-80"
            aria-hidden="true"
            role="img"
          >
            <title>Scroll down arrow</title>
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </div>

      {/* 底部渐变遮罩 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
        }}
      />
    </div>
  );
};

export default IntroScreen;
