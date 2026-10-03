"use client";

import Link from "next/link";
import { addTransitionType, startTransition, ViewTransition } from "react";
import type { ComponentProps, ReactNode } from "react";
import { useMotion } from "./motion-provider";

const pageClasses = {
  "nav-forward": "page-forward",
  "nav-back": "page-back",
  "page-next": "page-forward",
  "page-previous": "page-back",
  "particle-flight": "none",
  "paper-filter": "none",
  default: "page-neutral",
};
const filterClass = (value: string) => ({
  "paper-filter": value,
  default: "none",
});
const safeName = (value: string) =>
  encodeURIComponent(value).replace(/[^a-zA-Z0-9_-]/g, "_");

export function PageLink({
  direction = "forward",
  transitionTypes,
  ...props
}: ComponentProps<typeof Link> & { direction?: "forward" | "back" }) {
  return (
    <Link
      {...props}
      transitionTypes={
        transitionTypes || [direction === "back" ? "nav-back" : "nav-forward"]
      }
    />
  );
}

// Boundaries live in pages, so their enter/exit follows route lifecycles while
// the book-spine navigation and motion preferences remain mounted.
export function RouteSurface({
  children,
  routeKey,
}: {
  children: ReactNode;
  routeKey: string;
}) {
  const { active } = useMotion();
  return (
    <ViewTransition
      key={routeKey}
      enter={active ? pageClasses : "none"}
      exit={active ? pageClasses : "none"}
      default="none"
      update="none"
    >
      <div className="route-surface">{children}</div>
    </ViewTransition>
  );
}

export function PaperMotion({
  children,
  name,
}: {
  children: ReactNode;
  name: string;
}) {
  const { active } = useMotion();
  return (
    <ViewTransition
      name={`paper-${safeName(name)}`}
      default="none"
      enter={active ? filterClass("paper-enter") : "none"}
      exit={active ? filterClass("paper-exit") : "none"}
      share={active ? filterClass("paper-reflow") : "none"}
      update={active ? filterClass("paper-reflow") : "none"}
    >
      {children}
    </ViewTransition>
  );
}

export function ContentSwap({
  children,
  name,
  swapKey,
}: {
  children: ReactNode;
  name: string;
  swapKey: string;
}) {
  const { active } = useMotion();
  return (
    <ViewTransition
      key={swapKey}
      name={`swap-${safeName(name)}`}
      default="none"
      share={active ? filterClass("content-swap") : "none"}
      enter={active ? filterClass("content-swap") : "none"}
    >
      <div>{children}</div>
    </ViewTransition>
  );
}

export function changeFilter(update: () => void) {
  startTransition(() => {
    addTransitionType("paper-filter");
    update();
  });
}
