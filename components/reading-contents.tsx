"use client";

import { useEffect, useRef } from "react";
import { useMotion } from "./motion-provider";

export type ReadingHeading = { id: string; text: string; depth: string };

export function ReadingContents({
  headings,
  activeHeading,
}: {
  headings: ReadingHeading[];
  activeHeading: string;
}) {
  const navRef = useRef<HTMLElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);
  const { active } = useMotion();
  useEffect(() => {
    const nav = navRef.current;
    const marker = markerRef.current;
    if (!nav || !marker) return;
    let animation: Animation | null = null;
    const place = () => {
      const link = nav.querySelector<HTMLElement>('a[aria-current="location"]');
      if (!link || !nav.getBoundingClientRect().width) {
        marker.hidden = true;
        return;
      }
      const navBounds = nav.getBoundingClientRect();
      const linkBounds = link.getBoundingClientRect();
      const next = `translateY(${linkBounds.top - navBounds.top}px)`;
      const before = getComputedStyle(marker);
      const oldTransform = before.transform;
      const oldHeight = before.height;
      const wasHidden = marker.hidden;
      animation?.cancel();
      marker.hidden = false;
      marker.style.transform = next;
      marker.style.height = `${linkBounds.height}px`;
      if (active && !wasHidden)
        animation = marker.animate(
          [
            { transform: oldTransform, height: oldHeight },
            { transform: next, height: `${linkBounds.height}px` },
          ],
          { duration: 380, easing: "cubic-bezier(.22,1,.36,1)" },
        );
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(nav);
    return () => {
      observer.disconnect();
      animation?.cancel();
    };
  }, [activeHeading, headings, active]);
  return (
    <nav ref={navRef} className="article-toc" aria-label="文章目录">
      <span
        ref={markerRef}
        className="toc-bookmark"
        aria-hidden="true"
        hidden
      />
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          data-depth={heading.depth}
          aria-current={activeHeading === heading.id ? "location" : undefined}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}
