"use client";

import {
  BookOpen,
  Braces,
  GitFork,
  MoreHorizontal,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/config";
import type { PostSummary } from "@/lib/types";
import { useMotion } from "./motion-provider";
import { PageLink as Link } from "./page-motion";

const icons = [Braces, BookOpen, User];
const captions = ["STUDIO", "WRITING", "ABOUT"];

export function Navbar({ posts }: { posts: PostSummary[] }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const { active, enabled, reducedMotion, setEnabled } = useMotion();
  // biome-ignore lint/correctness/useExhaustiveDependencies: Route changes close the utility popover.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        moreRef.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("keydown", keyboard);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", keyboard);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  return (
    <>
      <aside ref={rootRef} className="site-navigation">
        <Link
          href="/"
          direction="back"
          className="rail-brand"
          aria-label={siteConfig.name}
        >
          <span>
            {siteConfig.author.name}
            <span>*</span>
          </span>
          <small>made of curiosity</small>
        </Link>
        <nav className="spine-navigation" aria-label="主导航">
          {siteConfig.navigation.map((item, index) => {
            const Icon = icons[index];
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href) ||
                  (item.href === "/blog" &&
                    (pathname.startsWith("/categories") ||
                      pathname.startsWith("/tags")));
            return (
              <Link
                key={item.href}
                href={item.href}
                direction={item.href === "/" ? "back" : "forward"}
                className="spine-link"
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <span className="spine-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <Icon size={20} aria-hidden="true" />
                <span className="spine-label">
                  {item.label}
                  <small aria-hidden="true">{captions[index]}</small>
                </span>
              </Link>
            );
          })}
          <button
            ref={moreRef}
            type="button"
            className="dock-more"
            aria-label={open ? "关闭快捷工具" : "打开快捷工具"}
            aria-expanded={open}
            aria-controls="navigation-tools"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={21} /> : <MoreHorizontal size={21} />}
          </button>
        </nav>
        <div id="navigation-tools" className="nav-utilities" data-open={open}>
          <button
            type="button"
            className="rail-search"
            aria-label="搜索文章"
            onClick={() => {
              window.dispatchEvent(new Event("open-search"));
              setOpen(false);
            }}
          >
            <Search size={19} />
            <span>搜索</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="rail-utility-icons">
            <ThemeToggle />
            <a
              href={siteConfig.social.github}
              target="_blank"
              rel="noreferrer"
              className="icon-button"
              aria-label="GitHub"
            >
              <GitFork size={19} />
            </a>
          </div>
          <button
            type="button"
            className="motion-toggle"
            aria-label={active ? "关闭页面动效" : "开启页面动效"}
            aria-pressed={active}
            disabled={reducedMotion}
            onClick={() => setEnabled(!enabled)}
          >
            <Sparkles size={15} />
            <span>动效{active ? "开" : "关"}</span>
          </button>
        </div>
        <span className="rail-caption" aria-hidden="true">
          SOFTWARE ENGINEER · KEEP MAKING
        </span>
      </aside>
      <CommandPalette posts={posts} />
    </>
  );
}
