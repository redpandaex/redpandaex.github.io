"use client";

import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

interface LoadingAnimationProps {
  onComplete?: () => void;
  duration?: number;
  showProgress?: boolean;
}

export function LoadingAnimation({
  onComplete,
  duration = 3,
  showProgress = true,
}: LoadingAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const progressBar = progressRef.current;
    const text = textRef.current;

    if (!container) return;

    const tl = gsap.timeline();

    // 进度条动画
    if (progressBar && showProgress) {
      tl.to(progressBar, {
        width: "100%",
        duration: duration * 0.8,
        ease: "power2.out",
        onUpdate() {
          const progressValue = Math.round((this.progress() || 0) * 100);
          setProgress(progressValue);
        },
      });
    }

    // 文字动画
    if (text) {
      tl.to(
        text,
        {
          opacity: 0,
          y: -20,
          duration: 0.5,
          ease: "power2.inOut",
        },
        "-=0.5",
      );
    }

    // 容器淡出
    tl.to(container, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
      onComplete: () => {
        onComplete?.();
      },
    });

    return () => {
      tl.kill();
    };
  }, [duration, showProgress, onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center"
    >
      <div className="text-center space-y-8">
        {/* Logo 或标题 */}
        <div ref={textRef} className="space-y-4">
          <div className="w-16 h-16 mx-auto">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-primary to-secondary animate-spin">
              <div className="w-full h-full rounded-full border-4 border-t-transparent border-primary"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {siteConfig.name}
          </h1>
          <p className="text-muted-foreground">正在加载精彩内容...</p>
        </div>

        {/* 进度条 */}
        {showProgress && (
          <div className="w-64 mx-auto space-y-2">
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                ref={progressRef}
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full w-0 transition-all"
              />
            </div>
            <div className="text-sm text-muted-foreground text-center">
              {progress}%
            </div>
          </div>
        )}

        {/* 装饰元素 */}
        <div className="flex justify-center space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={cn("w-2 h-2 rounded-full bg-primary animate-pulse")}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 简单的 Skeleton 加载组件
interface SkeletonProps {
  className?: string;
  animation?: boolean;
}

export function Skeleton({ className, animation = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-muted rounded-md",
        animation && "animate-pulse",
        className,
      )}
    />
  );
}

// 卡片骨架屏
export function BlogCardSkeleton() {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

// 页面加载组件
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}
