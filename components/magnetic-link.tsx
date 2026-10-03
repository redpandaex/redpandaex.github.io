"use client";

import { gsap } from "gsap";
import { PageLink as Link } from "./page-motion";
import { useEffect, useRef } from "react";
import { useMotion } from "./motion-provider";
import { ArticleLink } from "./article-transition";

export function MagneticLink({
  href,
  className = "",
  children,
  articleTitle,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  articleTitle?: string;
}) {
  const shellRef = useRef<HTMLSpanElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const { active } = useMotion();
  useEffect(() => {
    const shell = shellRef.current;
    const link = linkRef.current;
    if (
      !active ||
      !shell ||
      !link ||
      !window.matchMedia("(pointer: fine)").matches
    )
      return;
    const context = gsap.context(() => {
      const x = gsap.quickTo(link, "x", { duration: 0.6, ease: "power3.out" });
      const y = gsap.quickTo(link, "y", { duration: 0.6, ease: "power3.out" });
      const move = (event: PointerEvent) => {
        const rect = shell.getBoundingClientRect();
        x((event.clientX - rect.left - rect.width / 2) * 0.16);
        y((event.clientY - rect.top - rect.height / 2) * 0.2);
      };
      const reset = () => {
        x(0);
        y(0);
      };
      shell.addEventListener("pointermove", move);
      shell.addEventListener("pointerleave", reset);
      return () => {
        shell.removeEventListener("pointermove", move);
        shell.removeEventListener("pointerleave", reset);
      };
    });
    return () => context.revert();
  }, [active]);
  return (
    <span ref={shellRef} className="magnetic-shell">
      {articleTitle ? (
        <ArticleLink
          ref={linkRef}
          href={href}
          title={articleTitle}
          className={`${className} magnetic-link`}
        >
          {children}
        </ArticleLink>
      ) : (
        <Link
          ref={linkRef}
          href={href}
          className={`${className} magnetic-link`}
        >
          {children}
        </Link>
      )}
    </span>
  );
}
