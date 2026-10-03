"use client";

import { createElement, type JSX, useEffect, useRef } from "react";
import { useMotion } from "./motion-provider";

interface AnimatedElementProps {
  children: React.ReactNode;
  animation?:
    | "fadeInUp"
    | "fadeInLeft"
    | "fadeInRight"
    | "scaleIn"
    | "slideInUp"
    | "slideInLeft";
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  reveal?: boolean;
}
export function AnimatedElement({
  children,
  animation = "fadeInUp",
  delay = 0,
  className = "",
  as = "div",
  reveal = true,
}: AnimatedElementProps) {
  const ref = useRef<HTMLElement>(null);
  const { active } = useMotion();
  useEffect(() => {
    const element = ref.current;
    if (!element || !active || !reveal) return;
    const effects: Animation[] = [];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const offset = animation.includes("Left")
          ? "translateX(-18px)"
          : animation.includes("Right")
            ? "translateX(18px)"
            : animation === "scaleIn"
              ? "scale(.96)"
              : "translateY(20px)";
        effects.push(
          element.animate(
            [
              { opacity: 0, transform: offset },
              { opacity: 1, transform: "none" },
            ],
            {
              duration: 650,
              delay: Math.min(delay * 1000, 300),
              easing: "cubic-bezier(.16,1,.3,1)",
              fill: "backwards",
            },
          ),
        );
        observer.unobserve(element);
      },
      { threshold: 0.08 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      effects.forEach((effect) => effect.cancel());
    };
  }, [animation, delay, active, reveal]);
  return createElement(as, { ref, className }, children);
}
