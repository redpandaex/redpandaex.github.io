"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Minus,
  Plus,
} from "lucide-react";
import { PageLink as Link } from "./page-motion";
import { useEffect, useRef, useState } from "react";
import { BlogCardGrid } from "@/components/blog-card";
import { Comments } from "@/components/comments";
import { trackEvent, trackPageView } from "@/components/google-analytics";
import { ViewCounter } from "@/components/view-counter";
import type { BlogPost, Category, PostSummary } from "@/lib/types";
import { ReadingContents, type ReadingHeading } from "./reading-contents";

export function BlogPostContent({
  renderedPost,
  category,
  relatedPosts,
  previousPost,
  nextPost,
}: {
  renderedPost: BlogPost & { renderedContent: string };
  category: Category | null;
  relatedPosts: BlogPost[];
  previousPost?: PostSummary;
  nextPost?: PostSummary;
}) {
  const leadingTitle = renderedPost.renderedContent.match(
    /^<h1 id="([^"]+)"[^>]*>[\s\S]*?<\/h1>\s*/,
  );
  const titleMatches =
    leadingTitle?.[0].replace(/<[^>]+>/g, "").trim() === renderedPost.title;
  const titleId = titleMatches ? leadingTitle?.[1] : undefined;
  const bodyContent = titleMatches
    ? renderedPost.renderedContent.slice(leadingTitle?.[0].length)
    : renderedPost.renderedContent;
  const article = useRef<HTMLElement>(null);
  const [headings, setHeadings] = useState<ReadingHeading[]>([]);
  const [activeHeading, setActiveHeading] = useState("");
  const [fontSize, setFontSize] = useState(1);
  useEffect(() => {
    trackPageView(window.location.href, renderedPost.title);
    trackEvent("article_view", "blog", renderedPost.slug);
  }, [renderedPost.title, renderedPost.slug]);
  useEffect(() => {
    const element = article.current;
    if (!element) return;
    const headingElements = Array.from(
      element.querySelectorAll<HTMLHeadingElement>("h2[id], h3[id]"),
    );
    setActiveHeading("");
    setHeadings(
      headingElements.map((heading) => ({
        id: heading.id,
        text: heading.textContent || "",
        depth: heading.tagName.slice(1),
      })),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActiveHeading(entry.target.id);
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0 },
    );
    headingElements.forEach((heading) => observer.observe(heading));
    const blocks = Array.from(element.querySelectorAll("pre")).map((pre) => {
      const wrapper = document.createElement("div");
      wrapper.className = "code-block";
      const toolbar = document.createElement("div");
      toolbar.className = "code-toolbar";
      const label = document.createElement("span");
      label.textContent =
        pre.querySelector("code")?.className.match(/language-([\w-]+)/)?.[1] ||
        "code";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "code-copy";
      button.setAttribute("aria-label", "复制代码");
      button.setAttribute("aria-live", "polite");
      button.textContent = "复制";
      const timers: ReturnType<typeof setTimeout>[] = [];
      let disposed = false;
      const copy = async () => {
        try {
          await navigator.clipboard.writeText(
            (
              pre.querySelector("code")?.textContent ||
              pre.textContent ||
              ""
            ).replace(/\n$/, ""),
          );
          if (disposed) return;
          button.textContent = "已复制";
          trackEvent("code_copy", "blog", renderedPost.slug);
        } catch {
          if (!disposed) button.textContent = "复制失败，请手动选择";
        }
        if (!disposed)
          timers.push(
            setTimeout(() => {
              button.textContent = "复制";
            }, 2000),
          );
      };
      button.addEventListener("click", copy);
      toolbar.append(label, button);
      pre.before(wrapper);
      wrapper.append(toolbar, pre);
      return () => {
        disposed = true;
        button.removeEventListener("click", copy);
        timers.forEach(clearTimeout);
        wrapper.before(pre);
        wrapper.remove();
      };
    });
    return () => {
      observer.disconnect();
      blocks.forEach((cleanup) => cleanup());
    };
  }, [renderedPost.slug]);
  return (
    <div className="site-container article-page">
      <div className="article-layout">
        <div className="article-main">
          <Link href="/blog" direction="back" className="back-link">
            <ArrowLeft size={15} /> 返回博客
          </Link>
          <header className="article-header">
            {category && (
              <Link
                href={`/blog/?category=${encodeURIComponent(category.slug)}&view=categories`}
                direction="back"
                className="article-category"
              >
                {category.name}
              </Link>
            )}
            <h1 id={titleId} data-article-title={renderedPost.slug}>
              {renderedPost.title}
            </h1>
            <p>{renderedPost.excerpt}</p>
            <div className="article-info">
              <span>{renderedPost.author}</span>
              <time dateTime={renderedPost.publishedAt}>
                {renderedPost.publishedAt.replaceAll("-", ".")}
              </time>
              <span>
                <Clock size={13} /> {renderedPost.readingTime} 分钟阅读
              </span>
              <ViewCounter slug={renderedPost.slug} />
            </div>
            <div className="article-tags">
              {renderedPost.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/?tag=${encodeURIComponent(tag)}&view=tags`}
                  direction="back"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </header>
          <article
            ref={article}
            className={`prose max-w-none article-prose ${["reading-small", "", "reading-large"][fontSize]}`}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is generated at build time from trusted local article files.
            dangerouslySetInnerHTML={{ __html: bodyContent }}
          />
          <nav className="article-page-turns" aria-label="相邻文章">
            {previousPost && (
              <Link
                href={`/blog/${previousPost.slug}/`}
                transitionTypes={["page-previous"]}
                className="page-turn-link page-turn-previous"
              >
                <span className="page-turn-caption">
                  <ArrowLeft size={17} /> 上一篇
                </span>
                <strong>{previousPost.title}</strong>
                <span className="page-turn-fold" aria-hidden="true" />
              </Link>
            )}
            {nextPost && (
              <Link
                href={`/blog/${nextPost.slug}/`}
                transitionTypes={["page-next"]}
                className="page-turn-link page-turn-next"
              >
                <span className="page-turn-caption">
                  下一篇 <ArrowRight size={17} />
                </span>
                <strong>{nextPost.title}</strong>
                <span className="page-turn-fold" aria-hidden="true" />
              </Link>
            )}
            {(!previousPost || !nextPost) && (
              <Link
                href="/blog"
                direction="back"
                className="page-turn-link page-turn-archive"
              >
                <span className="page-turn-caption">
                  <BookOpen size={17} /> 回到文章库
                </span>
                <strong>还有一些思考，留在下一页。</strong>
              </Link>
            )}
          </nav>
          <Comments slug={renderedPost.slug} />
          {relatedPosts.length > 0 && (
            <section className="related-section">
              <h2>继续探索</h2>
              <BlogCardGrid posts={relatedPosts} />
            </section>
          )}
        </div>
        <aside className="article-sidebar" aria-label="文章阅读工具">
          <p>这篇文章里</p>
          <ReadingContents headings={headings} activeHeading={activeHeading} />
          <div className="reading-settings">
            <span>阅读字号</span>
            <div>
              <button
                type="button"
                className="icon-button"
                aria-label="缩小字号"
                disabled={fontSize === 0}
                onClick={() => setFontSize((value) => value - 1)}
              >
                <Minus size={15} />
              </button>
              <span aria-live="polite">{["小", "中", "大"][fontSize]}</span>
              <button
                type="button"
                className="icon-button"
                aria-label="放大字号"
                disabled={fontSize === 2}
                onClick={() => setFontSize((value) => value + 1)}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
