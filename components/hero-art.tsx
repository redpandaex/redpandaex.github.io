"use client";

import { gsap } from "gsap";
import { MoveUpRight, RotateCcw, Shuffle } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function HeroArt() {
  const artwork = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [palette, setPalette] = useState(0);
  useEffect(() => {
    const element = artwork.current;
    const container = stage.current;
    if (!element || !container) return;
    const media = gsap.matchMedia();
    media.add(
      "(prefers-reduced-motion: no-preference) and (pointer: fine)",
      () => {
        const rotateX = gsap.quickTo(element, "rotationX", {
          duration: 0.7,
          ease: "power3.out",
        });
        const rotateY = gsap.quickTo(element, "rotationY", {
          duration: 0.7,
          ease: "power3.out",
        });
        const move = (event: PointerEvent) => {
          const rect = container.getBoundingClientRect();
          rotateX(
            (-(event.clientY - rect.top - rect.height / 2) / rect.height) * 13,
          );
          rotateY(
            ((event.clientX - rect.left - rect.width / 2) / rect.width) * 13,
          );
        };
        const reset = () => {
          rotateX(0);
          rotateY(0);
        };
        container.addEventListener("pointermove", move);
        container.addEventListener("pointerleave", reset);
        return () => {
          container.removeEventListener("pointermove", move);
          container.removeEventListener("pointerleave", reset);
        };
      },
    );
    return () => media.revert();
  }, []);
  return (
    <div ref={stage} className={`hero-stage palette-${palette}`}>
      <div ref={artwork} className="hero-artwork">
        <Image
          src="/images/redpanda-studio.webp"
          alt="戴蓝色眼镜的小熊猫，漂浮在珊瑚色、蓝色、紫色的几何玩具之间"
          width={1448}
          height={1086}
          priority
          sizes="(max-width: 767px) 100vw, 55vw"
          className="panda-image"
        />
      </div>
      <div className="art-corner" aria-hidden="true">
        <MoveUpRight size={25} />
      </div>
      <div className="art-toolbar">
        <span className="art-hint">一点代码，一点好奇心。</span>
        <div>
          <button
            type="button"
            className="art-control"
            aria-label="切换画布配色"
            onClick={() => setPalette((value) => (value + 1) % 3)}
          >
            <Shuffle size={17} />
            <span>换个配色</span>
          </button>
          <button
            type="button"
            className="art-control"
            aria-label="重置画布配色"
            onClick={() => setPalette(0)}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        画布配色：{["蓝色", "桃色", "紫色"][palette]}
      </span>
    </div>
  );
}
