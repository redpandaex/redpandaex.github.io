"use client";

import {
  ArrowDownWideNarrow,
  BookOpen,
  Folder,
  Hash,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { BlogCardGrid } from "@/components/blog-card";
import { categories as knownCategories } from "@/lib/config";
import type { PostSummary } from "@/lib/types";
import { AmbientSurface } from "./ambient-surface";
import { ManuscriptDesk, type ManuscriptSnippet } from "./manuscript-desk";
import { ContentSwap, changeFilter } from "./page-motion";

export type LibraryView = "articles" | "categories" | "tags";
const views = [
  { value: "articles", label: "全部文章", icon: BookOpen },
  { value: "categories", label: "按分类", icon: Folder },
  { value: "tags", label: "按标签", icon: Hash },
] as const;

export function ArticleExplorer({
  posts,
  compact = false,
  initialView = "articles",
  snippets,
}: {
  posts: PostSummary[];
  compact?: boolean;
  initialView?: LibraryView;
  snippets?: Record<string, ManuscriptSnippet>;
}) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tag, setTag] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState<LibraryView>(initialView);
  const tags = Array.from(new Set(posts.flatMap((post) => post.tags)));
  const categoryNames = Array.from(new Set(posts.map((post) => post.category)));
  const categoryName = (slug: string) =>
    knownCategories.find((item) => item.slug === slug)?.name || slug;
  useEffect(() => {
    if (compact) return;
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      setTag(params.get("tag") || "");
      setCategory(params.get("category") || "");
      setQuery(params.get("q") || "");
      setSearchQuery(params.get("q") || "");
      const nextView = params.get("view");
      if (
        nextView === "categories" ||
        nextView === "tags" ||
        nextView === "articles"
      )
        setView(nextView);
      else if (params.has("tag")) setView("tags");
      else if (params.has("category")) setView("categories");
      else setView(initialView);
    };
    restore();
    const onPop = () => changeFilter(restore);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [compact, initialView]);
  const syncLocation = (next: {
    tag?: string;
    category?: string;
    query?: string;
    view?: LibraryView;
  }) => {
    if (compact) return;
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries({
      tag,
      category,
      q: query,
      view,
      ...next,
      ...(next.query !== undefined ? { q: next.query } : {}),
    })) {
      if (key === "query") continue;
      if (value && !(key === "view" && value === "articles"))
        params.set(key, value);
      else params.delete(key);
    }
    window.history.replaceState(
      null,
      "",
      params.size ? `?${params}` : window.location.pathname,
    );
  };
  const chooseTag = (value: string) => {
    const next = tag === value ? "" : value;
    changeFilter(() => setTag(next));
    syncLocation({ tag: next });
  };
  const chooseCategory = (value: string) => {
    const next = category === value ? "" : value;
    changeFilter(() => setCategory(next));
    syncLocation({ category: next });
  };
  const reset = () => {
    changeFilter(() => {
      setQuery("");
      setSearchQuery("");
      setTag("");
      setCategory("");
    });
    syncLocation({ query: "", tag: "", category: "" });
  };
  const filtered = posts
    .filter(
      (post) =>
        (!tag || post.tags.includes(tag)) &&
        (!category || post.category === category) &&
        `${post.title} ${post.excerpt} ${post.tags.join(" ")}`
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase()),
    )
    .toSorted((a, b) =>
      sort === "reading"
        ? a.readingTime - b.readingTime
        : (b.updatedAt || b.publishedAt).localeCompare(
            a.updatedAt || a.publishedAt,
          ),
    );

  const results = (
    <>
      {!compact && (
        <div className="article-results-heading">
          <span aria-live="polite">{filtered.length} 篇文章</span>
          <label className="sort-control">
            <ArrowDownWideNarrow size={16} />
            <span className="sr-only">文章排序</span>
            <select
              aria-label="文章排序"
              value={sort}
              onChange={(event) =>
                changeFilter(() => setSort(event.target.value))
              }
            >
              <option value="recent">最近更新</option>
              <option value="reading">短文优先</option>
            </select>
          </label>
        </div>
      )}
      {!compact && (tag || category || searchQuery) && (
        <div className="active-filters">
          {category && (
            <button
              type="button"
              onClick={() => {
                changeFilter(() => setCategory(""));
                syncLocation({ category: "" });
              }}
            >
              分类：{categoryName(category)} <X size={12} />
            </button>
          )}
          {tag && (
            <button
              type="button"
              onClick={() => {
                changeFilter(() => setTag(""));
                syncLocation({ tag: "" });
              }}
            >
              #{tag} <X size={12} />
            </button>
          )}
          <button type="button" className="clear-filters" onClick={reset}>
            重置筛选
          </button>
        </div>
      )}
      {filtered.length ? (
        compact ? (
          <ManuscriptDesk
            posts={filtered}
            snippets={snippets}
            motionScope={inputId}
          />
        ) : (
          <BlogCardGrid posts={filtered} motionScope={inputId} />
        )
      ) : (
        <div className="empty-state">
          <SlidersHorizontal size={32} />
          <h3>这个组合还没有文章</h3>
          <p>换个关键词，或者回到全部文章。</p>
          <button type="button" className="secondary-button" onClick={reset}>
            重置筛选
          </button>
        </div>
      )}
    </>
  );

  if (compact)
    return (
      <div className="article-explorer">
        <div className="article-toolbar">
          <fieldset className="filter-tabs" aria-label="文章标签筛选">
            {["", ...tags.slice(0, 7)].map((value) => (
              <button
                key={value || "all"}
                type="button"
                aria-pressed={tag === value}
                onClick={() => changeFilter(() => setTag(value))}
              >
                {value || "全部"}
              </button>
            ))}
          </fieldset>
        </div>
        {results}
      </div>
    );

  return (
    <div className="article-explorer content-library">
      <aside className="library-index">
        <span className="mono-label library-index-label">
          EXPLORE THE ARCHIVE
        </span>
        <fieldset className="library-views" aria-label="内容浏览方式">
          {views.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={view === item.value}
              onClick={() => {
                changeFilter(() => setView(item.value));
                syncLocation({ view: item.value });
              }}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
              <small>
                {item.value === "articles"
                  ? posts.length
                  : item.value === "categories"
                    ? categoryNames.length
                    : tags.length}
              </small>
            </button>
          ))}
        </fieldset>
        <ContentSwap name={`facets-${inputId}`} swapKey={view}>
          <div className="library-facets">
            {view === "articles" && (
              <>
                <p>从一篇文章开始。</p>
                <span>也可以切换分类或标签，找到你感兴趣的方向。</span>
              </>
            )}
            {view === "categories" && (
              <fieldset aria-label="文章分类筛选">
                {categoryNames.map((slug) => (
                  <button
                    type="button"
                    key={slug}
                    aria-pressed={category === slug}
                    onClick={() => chooseCategory(slug)}
                  >
                    <Folder size={15} />
                    {categoryName(slug)}
                    <small>
                      {posts.filter((post) => post.category === slug).length}
                    </small>
                  </button>
                ))}
              </fieldset>
            )}
            {view === "tags" && (
              <fieldset className="library-tags" aria-label="文章标签筛选">
                {tags.map((name) => (
                  <button
                    type="button"
                    key={name}
                    aria-pressed={tag === name}
                    onClick={() => chooseTag(name)}
                  >
                    #{name}
                    <small>
                      {posts.filter((post) => post.tags.includes(name)).length}
                    </small>
                  </button>
                ))}
              </fieldset>
            )}
          </div>
        </ContentSwap>
        <span className="library-index-note">
          A SMALL COLLECTION
          <br />
          OF THINGS I LEARNED.
        </span>
      </aside>
      <AmbientSurface kind="grid" className="library-content">
        <div className="article-search">
          <Search size={17} />
          <label className="sr-only" htmlFor={inputId}>
            搜索文章列表
          </label>
          <input
            id={inputId}
            type="search"
            placeholder="找一个关键词…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              changeFilter(() => setSearchQuery(event.target.value));
              syncLocation({ query: event.target.value });
            }}
          />
        </div>
        {results}
      </AmbientSurface>
    </div>
  );
}
