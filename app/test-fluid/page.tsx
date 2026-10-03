"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

const FluidSimulation = dynamic(
  () =>
    import("@/components/fluid-simulation/FluidSimulation").then(
      (module) => module.FluidSimulation,
    ),
  {
    ssr: false,
    loading: () => <div className="fluid-placeholder">正在准备流体画布…</div>,
  },
);
export default function FluidPage() {
  const [started, setStarted] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    const test = document.createElement("canvas");
    const context = test.getContext("webgl2") || test.getContext("webgl");
    setSupported(Boolean(context));
    context?.getExtension("WEBGL_lose_context")?.loseContext();
  }, []);
  return (
    <div className="site-container fluid-page">
      <Link href="/projects" className="back-link">
        <ArrowLeft size={15} /> 返回项目
      </Link>
      <header className="fluid-page-heading">
        <div>
          <h1>给色彩一点自由。</h1>
          <p>按住鼠标或手指，画出你的流动轨迹。</p>
        </div>
        <span className="mono-label text-xs text-muted-foreground">
          WebGL canvas
        </span>
      </header>
      <div className="fluid-stage">
        {!supported ? (
          <div className="fluid-placeholder">
            <p>当前浏览器未开启 WebGL。</p>
            <p>请启用硬件加速后重新打开这个实验。</p>
          </div>
        ) : started ? (
          <FluidSimulation
            key={generation}
            config={{
              COLORFUL: true,
              BLOOM: true,
              BLOOM_INTENSITY: 0.3,
              SUNRAYS: true,
              SPLAT_RADIUS: 0.4,
              SPLAT_FORCE: 5000,
              CURL: 30,
              BACK_COLOR: { r: 0.05, g: 0.05, b: 0.08 },
            }}
            className="absolute inset-0"
          />
        ) : (
          <div className="fluid-placeholder">
            <p>一块空白画布，等你添上颜色。</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => setStarted(true)}
            >
              开始创作
            </button>
          </div>
        )}
      </div>
      {started && (
        <div className="fluid-controls">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setGeneration((value) => value + 1)}
          >
            <RotateCcw size={15} /> 清空画布
          </button>
          <button
            type="button"
            className="text-link"
            onClick={() => setStarted(false)}
          >
            暂停并退出画布
          </button>
        </div>
      )}
    </div>
  );
}
