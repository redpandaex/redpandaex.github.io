"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type StudioPalette, studioPalettes } from "@/lib/studio-palettes";

const PaletteContext = createContext<{
  palette: StudioPalette;
  choose: (id: StudioPalette["id"]) => void;
  shuffle: () => void;
} | null>(null);

export function PaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPalette] = useState<StudioPalette>(studioPalettes[0]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("studio-palette");
      const saved = studioPalettes.find((item) => item.id === stored);
      if (saved) {
        document.documentElement.dataset.palette = saved.id;
        setPalette(saved);
      }
    } catch {
      /* The palette also works when browser storage is unavailable. */
    }
  }, []);
  const choose = (id: StudioPalette["id"]) => {
    const next = studioPalettes.find((item) => item.id === id);
    if (!next) return;
    document.documentElement.dataset.palette = next.id;
    setPalette(next);
    try {
      localStorage.setItem("studio-palette", next.id);
    } catch {
      /* Persistence is optional. */
    }
  };
  const shuffle = () => {
    const options = studioPalettes.filter((item) => item.id !== palette.id);
    choose(options[Math.floor(Math.random() * options.length)].id);
  };
  return (
    <PaletteContext value={{ palette, choose, shuffle }}>
      {children}
    </PaletteContext>
  );
}

export function usePalette() {
  const context = useContext(PaletteContext);
  if (!context)
    throw new Error("usePalette must be used within PaletteProvider");
  return context;
}
