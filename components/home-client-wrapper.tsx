"use client";

/**
 * 首页内容包装器 - 包含流体模拟欢迎屏幕
 */

import type React from "react";
import { useState } from "react";
import { IntroScreen } from "@/components/fluid-simulation";

interface HomeClientWrapperProps {
  children: React.ReactNode;
}

export const HomeClientWrapper: React.FC<HomeClientWrapperProps> = ({
  children,
}) => {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <>
      {/* 流体模拟欢迎屏幕 */}
      {showIntro && (
        <IntroScreen
          title="RedPanda's Blog"
          subtitle="向下滚动进入"
          onEnter={() => setShowIntro(false)}
          config={{
            COLORFUL: true,
            BLOOM: true,
            SUNRAYS: true,
            SPLAT_RADIUS: 0.5,
            SPLAT_FORCE: 6000,
            CURL: 30,
          }}
        />
      )}

      {/* 占位符 - 当 intro 显示时占据整个视口高度 */}
      {showIntro && <div style={{ height: "100vh" }} />}

      {/* 实际内容 */}
      {children}
    </>
  );
};

export default HomeClientWrapper;
