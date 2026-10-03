"use client";

import { ArrowUpRight, FileText, Search, X } from "lucide-react";
import { PageLink as Link } from "./page-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { PostSummary } from "@/lib/types";

export function CommandPalette({ posts }: { posts: PostSummary[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const results = posts.filter((post) =>
    `${post.title} ${post.excerpt} ${post.tags.join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  useEffect(() => {
    const open = () => {
      setQuery("");
      setActive(0);
      dialog.current?.showModal();
      input.current?.focus();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dialog.current?.open) {
        event.preventDefault();
        dialog.current.close();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog.current?.open) dialog.current.close();
        else open();
      }
    };
    window.addEventListener("open-search", open);
    window.addEventListener("keydown", keyboard);
    return () => {
      window.removeEventListener("open-search", open);
      window.removeEventListener("keydown", keyboard);
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="command-dialog"
      aria-labelledby="search-title"
    >
      <form method="dialog" className="command-header">
        <Search size={21} aria-hidden="true" />
        <label id="search-title" className="sr-only" htmlFor="command-search">
          搜索文章
        </label>
        <input
          ref={input}
          id="command-search"
          type="search"
          placeholder="找一篇文章，或者一个灵感…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          autoComplete="off"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((value) => Math.min(value + 1, results.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((value) => Math.max(value - 1, 0));
            }
            if (event.key === "Enter") {
              event.preventDefault();
              const post = results[Math.max(active, 0)];
              if (post) {
                dialog.current?.close();
                router.push(`/blog/${post.slug}/`, {
                  transitionTypes: ["nav-forward"],
                });
              }
            }
          }}
        />
        <button type="submit" className="icon-button" aria-label="关闭搜索">
          <X size={19} />
        </button>
      </form>
      <div className="command-results" aria-live="polite">
        <p className="command-label">
          {query ? `找到 ${results.length} 篇文章` : "从这里开始探索"}
        </p>
        {results.length ? (
          results.map((post, index) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}/`}
              className={`command-result ${active === index ? "is-selected" : ""}`}
              onFocus={() => setActive(index)}
              onMouseEnter={() => setActive(index)}
              onClick={() => dialog.current?.close()}
            >
              <FileText size={19} />
              <span>
                <strong>{post.title}</strong>
                <small>{post.tags.slice(0, 3).join(" / ")}</small>
              </span>
              <ArrowUpRight size={17} />
            </Link>
          ))
        ) : (
          <div className="empty-state">
            <Search size={30} />
            <h3>还没有这个主题的文章</h3>
            <p>试试 React、Next.js 或微前端。</p>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setQuery("");
                input.current?.focus();
              }}
            >
              清空搜索
            </button>
          </div>
        )}
      </div>
      <div className="command-footer">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> 选择 <kbd>↵</kbd> 打开
        </span>
        <span>
          <kbd>esc</kbd> 关闭
        </span>
      </div>
    </dialog>
  );
}
