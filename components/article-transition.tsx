"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useRef,
} from "react";
import type { ComponentProps } from "react";
import { captureTextCloud } from "@/lib/text-cloud";
import type { createArticleParticles } from "@/lib/article-particles";
import { useMotion } from "./motion-provider";

const TransitionContext = createContext<{
  start: (href: string, title: string, link: HTMLAnchorElement) => void;
  warm: () => void;
} | null>(null);
let modulePromise: Promise<typeof import("@/lib/article-particles")> | null =
  null;
const loadParticles = () => {
  if (!modulePromise)
    modulePromise = import("@/lib/article-particles").catch((error) => {
      modulePromise = null;
      throw error;
    });
  return modulePromise;
};
type Flight = {
  path: string;
  originPath: string;
  gather: () => void;
  cleanup: () => void;
};
const normalizePath = (path: string) =>
  decodeURIComponent(path).replace(/\/$/, "") || "/";

export function ArticleTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const flightRef = useRef<Flight | null>(null);
  const { active } = useMotion();
  const pathname = usePathname();
  useEffect(() => {
    if (!active) flightRef.current?.cleanup();
  }, [active]);
  useEffect(() => {
    const flight = flightRef.current;
    if (!flight) return;
    const current = normalizePath(pathname);
    if (current === flight.path) flight.gather();
    else if (current !== flight.originPath) flight.cleanup();
  }, [pathname]);
  useEffect(() => () => flightRef.current?.cleanup(), []);

  const warm = () => {
    if (active) void loadParticles().catch(() => {});
  };
  const start = (href: string, title: string, link: HTMLAnchorElement) => {
    flightRef.current?.cleanup();
    const overlay = overlayRef.current;
    if (
      !active ||
      !overlay ||
      document.hidden ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const hero = document.querySelector<HTMLElement>(".particle-title-heading");
    const heroRect = hero?.getBoundingClientRect();
    let source =
      hero &&
      heroRect &&
      heroRect.top >= 0 &&
      heroRect.bottom <= window.innerHeight
        ? hero
        : link
            .closest("article")
            ?.querySelector<HTMLElement>("[data-article-link-title]") || link;
    let cloud: ReturnType<typeof captureTextCloud>;
    try {
      cloud = captureTextCloud(source);
    } catch {
      // A cover can be visible while its heading sits below the viewport.
      try {
        source = link;
        cloud = captureTextCloud(source);
      } catch {
        return;
      }
    }
    // Each flight owns a fresh context; disposed contexts cannot be reused.
    const canvas = document.createElement("canvas");
    canvas.className = "article-flight-canvas";
    overlay.append(canvas);
    const path = normalizePath(new URL(href, window.location.href).pathname);
    let alive = true;
    let engine: ReturnType<typeof createArticleParticles> | null = null;
    let target: HTMLElement | null = null;
    let targetFrame = 0;
    let gathering = false;
    const hiddenSource =
      source.closest<HTMLElement>(".particle-title") || source;
    const reveal = () => {
      target?.removeAttribute("data-flight-hidden");
    };
    const cleanup = () => {
      if (!alive) return;
      alive = false;
      clearTimeout(timeout);
      cancelAnimationFrame(targetFrame);
      observer.disconnect();
      hiddenSource.removeAttribute("data-flight-hidden");
      reveal();
      engine?.dispose();
      canvas.remove();
      if (flightRef.current === flight) flightRef.current = null;
    };
    const gather = () => {
      if (
        !alive ||
        !engine ||
        gathering ||
        normalizePath(window.location.pathname) !== path
      )
        return;
      const heading = document.querySelector<HTMLElement>(
        "[data-article-title]",
      );
      if (
        !heading ||
        heading.textContent?.trim() !== title ||
        heading.getBoundingClientRect().width === 0
      )
        return;
      gathering = true;
      // Let Next finish its normal scroll-to-top and the heading's layout.
      targetFrame = requestAnimationFrame(() => {
        targetFrame = requestAnimationFrame(() => {
          if (!alive || !engine || !heading.isConnected) {
            cleanup();
            return;
          }
          try {
            const destination = captureTextCloud(heading);
            target = heading;
            target.dataset.flightHidden = "true";
            engine.gather(destination);
          } catch {
            cleanup();
          }
        });
      });
    };
    const observer = new MutationObserver(gather);
    observer.observe(document.getElementById("main-content") || document.body, {
      childList: true,
      subtree: true,
    });
    const timeout = setTimeout(cleanup, 4300);
    const flight: Flight = {
      path,
      originPath: normalizePath(window.location.pathname),
      gather,
      cleanup,
    };
    flightRef.current = flight;
    void loadParticles()
      .then((module) => {
        if (!alive) return;
        try {
          engine = module.createArticleParticles(
            canvas,
            cloud,
            cleanup,
            reveal,
          );
          canvas.dataset.active = "true";
          hiddenSource.dataset.flightHidden = "true";
          gather();
        } catch {
          cleanup();
        }
      })
      .catch(cleanup);
  };
  return (
    <TransitionContext value={{ start, warm }}>
      {children}
      <div ref={overlayRef} aria-hidden="true" />
    </TransitionContext>
  );
}

type ArticleLinkProps = Omit<
  ComponentProps<typeof Link>,
  "href" | "onNavigate" | "ref"
> & {
  href: string;
  title: string;
};

export const ArticleLink = forwardRef<HTMLAnchorElement, ArticleLinkProps>(
  function ArticleLink(
    { href, title, onPointerEnter, onFocus, children, ...props },
    forwardedRef,
  ) {
    const linkRef = useRef<HTMLAnchorElement | null>(null);
    const transition = useContext(TransitionContext);
    return (
      <Link
        {...props}
        href={href}
        transitionTypes={["particle-flight"]}
        ref={(element) => {
          linkRef.current = element;
          if (typeof forwardedRef === "function") forwardedRef(element);
          else if (forwardedRef) forwardedRef.current = element;
        }}
        onPointerEnter={(event) => {
          transition?.warm();
          onPointerEnter?.(event);
        }}
        onFocus={(event) => {
          transition?.warm();
          onFocus?.(event);
        }}
        onNavigate={() => {
          // Navigation remains native to Next; the decorative overlay never delays it.
          if (linkRef.current) transition?.start(href, title, linkRef.current);
        }}
      >
        {children}
      </Link>
    );
  },
);
