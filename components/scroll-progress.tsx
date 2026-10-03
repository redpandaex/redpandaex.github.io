"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useMotion } from "./motion-provider";

export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { active } = useMotion();
  // biome-ignore lint/correctness/useExhaustiveDependencies: Route changes recreate scroll bounds for the new page.
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
    let frame = 0;
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => trigger.refresh());
    };
    // Article content and comments can change height after navigation.
    const observer = new ResizeObserver(refresh);
    const main = document.getElementById("main-content");
    if (main) observer.observe(main);
    refresh();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      trigger.kill();
    };
  }, [pathname]);
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
            behavior: active ? "smooth" : "instant",
          })
        }
      >
        <ArrowUp size={20} />
      </button>
    </>
  );
}
