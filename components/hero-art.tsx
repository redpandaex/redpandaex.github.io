"use client";

import { gsap } from "gsap";
import { Palette, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { studioPalettes } from "@/lib/studio-palettes";
import { useMotion } from "./motion-provider";
import { usePalette } from "./palette-provider";

export function HeroArt() {
  const artwork = useRef<HTMLButtonElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const { palette, choose, shuffle } = usePalette();
  const { active } = useMotion();
  useEffect(() => {
    const element = artwork.current;
    const container = stage.current;
    if (!element || !container || !active) return;
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
  }, [active]);
  return (
    <div ref={stage} className="hero-stage panda-palette-stage">
      <button
        type="button"
        ref={artwork}
        className="hero-artwork panda-palette-button"
        aria-label="让小熊猫为整个网站换一组配色"
        onClick={shuffle}
      >
        <Image
          src="/images/redpanda-studio.webp"
          alt="戴蓝色眼镜的小熊猫，漂浮在珊瑚色、蓝色、紫色的几何玩具之间"
          width={1448}
          height={1086}
          priority
          sizes="(max-width: 600px) 120px, 300px"
          className="panda-image"
        />
        <span className="panda-palette-invite">
          <Palette size={14} /> 点我，换个心情
        </span>
      </button>
      <div className="art-corner" aria-hidden="true">
        <Palette size={21} />
      </div>
      <div className="art-toolbar">
        <fieldset className="palette-swatches" aria-label="网站配色">
          {studioPalettes.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`palette-swatch swatch-${item.id}`}
              aria-label={`使用${item.name}配色`}
              aria-pressed={item.id === palette.id}
              title={item.name}
              onClick={() => choose(item.id)}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </fieldset>
        <button
          type="button"
          className="art-control"
          aria-label="重置网站配色"
          onClick={() => choose("electric")}
        >
          <RotateCcw size={16} />
        </button>
      </div>
      <span className="palette-name" aria-live="polite">
        {palette.name}
      </span>
    </div>
  );
}
