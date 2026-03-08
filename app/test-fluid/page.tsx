"use client";

import { FluidSimulation } from "@/components/fluid-simulation";

export default function TestFluidPage() {
  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <FluidSimulation
        config={{
          COLORFUL: true,
          BLOOM: true,
          BLOOM_INTENSITY: 0.3,
          BLOOM_THRESHOLD: 0.8,
          SUNRAYS: true,
          SUNRAYS_WEIGHT: 0.5,
          SPLAT_RADIUS: 0.4,
          SPLAT_FORCE: 5000,
          CURL: 30,
          TRANSPARENT: false,
          BACK_COLOR: { r: 0, g: 0, b: 0 },
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "white",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            textShadow: "0 0 20px rgba(255,255,255,0.5)",
          }}
        >
          流体模拟测试
        </h1>
        <p style={{ fontSize: "1.2rem", opacity: 0.8 }}>
          用鼠标或手指在屏幕上滑动
        </p>
      </div>
    </div>
  );
}
