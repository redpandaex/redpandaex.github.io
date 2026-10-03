"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUp } from "lucide-react";
import { useEffect, useRef } from "react";

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (bar.current)
          bar.current.style.transform = `scaleX(${self.progress})`;
        if (button.current) button.current.hidden = self.scroll() < 500;
      },
    });
    return () => trigger.kill();
  }, []);
  return (
    <>
      <div ref={bar} className="reading-progress" aria-hidden="true" />
      <button
        ref={button}
        type="button"
        hidden
        className="back-top"
        aria-label="回到顶部"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
          })
        }
      >
        <ArrowUp size={20} />
      </button>
    </>
  );
}
