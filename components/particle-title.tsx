"use client";

import { Pause, Play, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { createTitleParticles } from "@/lib/title-particles";
import { useTheme } from "./theme-provider";

export function ParticleTitle() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createTitleParticles> | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    let alive = true;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    Promise.all([import("@/lib/title-particles"), document.fonts.ready])
      .then(([module]) => {
        const host = hostRef.current;
        const canvas = canvasRef.current;
        if (!alive || !host || !canvas) return;
        try {
          engineRef.current = module.createTitleParticles(canvas, host, () =>
            setReady(false),
          );
          setReady(true);
        } catch {
          setReady(false);
        }
      })
      .catch(() => {
        if (alive) setReady(false);
      });
    return () => {
      alive = false;
      media.removeEventListener("change", sync);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);
  useEffect(() => {
    engineRef.current?.setMotion({ paused, reducedMotion });
  }, [paused, reducedMotion]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Re-sample the heading's computed colors after a theme change.
  useEffect(() => {
    engineRef.current?.refresh();
  }, [resolvedTheme]);
  return (
    <>
      <div ref={hostRef} className="particle-title">
        <h1 className="particle-title-heading" aria-label="Code. Create.">
          <span data-particle-line>Code.</span>
          <span data-particle-line>Create.</span>
        </h1>
        <canvas
          ref={canvasRef}
          className="particle-title-canvas"
          aria-hidden="true"
        />
      </div>
      <div className="particle-title-tools">
        <span>
          {ready ? "移动鼠标，拨开一点灵感。" : "一点代码，一点好奇心。"}
        </span>
        <div>
          <button
            type="button"
            aria-label="打散标题粒子"
            disabled={!ready || paused || reducedMotion}
            onClick={() => engineRef.current?.burst()}
          >
            <Sparkles size={14} />
            <span>打散一下</span>
          </button>
          <button
            type="button"
            aria-label={
              paused || reducedMotion ? "播放文字动画" : "暂停文字动画"
            }
            disabled={!ready || reducedMotion}
            onClick={() => setPaused((value) => !value)}
          >
            {paused || reducedMotion ? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>
      </div>
    </>
  );
}
