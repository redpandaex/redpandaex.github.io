"use client";

import { createContext, useContext, useEffect, useState } from "react";

const MotionContext = createContext<{
  reducedMotion: boolean;
  active: boolean;
} | null>(null);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? "off" : "on";
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [reducedMotion]);
  return (
    <MotionContext
      value={{
        reducedMotion,
        active: !reducedMotion,
      }}
    >
      {children}
    </MotionContext>
  );
}

export function useMotion() {
  const context = useContext(MotionContext);
  if (!context) throw new Error("useMotion must be used within MotionProvider");
  return context;
}
