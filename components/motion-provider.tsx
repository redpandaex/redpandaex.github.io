"use client";

import { createContext, useContext, useEffect, useState } from "react";

const MotionContext = createContext<{
  enabled: boolean;
  reducedMotion: boolean;
  active: boolean;
  setEnabled: (value: boolean) => void;
} | null>(null);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [enabled, updateEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    try {
      updateEnabled(localStorage.getItem("ui-motion") !== "off");
    } catch {
      /* Motion preferences work without storage. */
    }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion =
      enabled && !reducedMotion ? "on" : "off";
    return () => {
      delete document.documentElement.dataset.motion;
    };
  }, [enabled, reducedMotion]);
  const setEnabled = (value: boolean) => {
    updateEnabled(value);
    try {
      localStorage.setItem("ui-motion", value ? "on" : "off");
    } catch {
      /* Storage is optional. */
    }
  };
  return (
    <MotionContext
      value={{
        enabled,
        reducedMotion,
        active: enabled && !reducedMotion,
        setEnabled,
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
