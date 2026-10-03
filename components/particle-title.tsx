"use client";

import { useEffect, useRef, useState } from "react";
import type { createTitleParticles } from "@/lib/title-particles";
import { useTheme } from "./theme-provider";
import { useMotion } from "./motion-provider";
import { usePalette } from "./palette-provider";

export function ParticleTitle() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ReturnType<typeof createTitleParticles> | null>(
    null,
  );
  const [ready, setReady] = useState(false);
  const { active, reducedMotion } = useMotion();
  const motionRef = useRef({ paused: !active, reducedMotion });
  const { resolvedTheme } = useTheme();
  const { palette } = usePalette();
  useEffect(() => {
    if (!active) {
      setReady(false);
      return;
    }
    let alive = true;
    Promise.all([import("@/lib/title-particles"), document.fonts.ready])
      .then(([module]) => {
        const host = hostRef.current;
        const canvas = canvasRef.current;
        if (!alive || !host || !canvas) return;
        try {
          engineRef.current = module.createTitleParticles(canvas, host, () =>
            setReady(false),
          );
          engineRef.current.setMotion(motionRef.current);
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
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [active]);
  useEffect(() => {
    motionRef.current = { paused: !active, reducedMotion };
    engineRef.current?.setMotion(motionRef.current);
  }, [reducedMotion, active]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: Re-sample the heading's computed colors after a theme change.
  useEffect(() => {
    engineRef.current?.refresh();
  }, [resolvedTheme, palette.id]);
  return (
    <>
      <div ref={hostRef} className="particle-title">
        <h1 className="particle-title-heading" aria-label="Code. Create.">
          <span data-particle-line>Code.</span>
          <span data-particle-line>Create.</span>
        </h1>
        <canvas
          key={active ? "motion" : "still"}
          ref={canvasRef}
          className="particle-title-canvas"
          aria-hidden="true"
        />
      </div>
      <p className="particle-title-hint">
        {ready ? "移动鼠标，拨开一点灵感。" : "一点代码，一点好奇心。"}
      </p>
    </>
  );
}
