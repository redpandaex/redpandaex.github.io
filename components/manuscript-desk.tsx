import { ArrowUpRight, Clock } from "lucide-react";
import type { PostSummary } from "@/lib/types";
import { ArticleLink } from "./article-transition";

export type ManuscriptSnippet = { language: string; code: string };

export function ManuscriptDesk({
  posts,
  snippets = {},
}: {
  posts: PostSummary[];
  snippets?: Record<string, ManuscriptSnippet>;
}) {
  return (
    <div className="manuscript-desk">
      {posts.map((post, index) => {
        const snippet = snippets[post.slug];
        return (
          <article
            key={post.slug}
            className={`manuscript manuscript-${index % 4}`}
          >
            <ArticleLink
              href={`/blog/${post.slug}/`}
              title={post.title}
              className="manuscript-paper"
            >
              <span className="manuscript-tape" aria-hidden="true" />
              <span className="manuscript-topline">
                <span>{post.tags.slice(0, 2).join(" / ")}</span>
                <ArrowUpRight size={21} />
              </span>
              <h3 data-article-link-title>{post.title}</h3>
              <p className="manuscript-excerpt">{post.excerpt}</p>
              <div className="manuscript-tags" aria-hidden="true">
                {post.tags.slice(2, 5).map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
              {snippet && (
                <div className="manuscript-code-note">
                  <span className="manuscript-code-label">
                    <span>摘自这篇文章</span>
                    <span>{snippet.language}</span>
                  </span>
                  <pre>
                    <code>{snippet.code}</code>
                  </pre>
                </div>
              )}
              <span className="manuscript-footer">
                <time dateTime={post.publishedAt}>
                  {post.publishedAt.replaceAll("-", ".")}
                </time>
                <span>
                  <Clock size={13} /> {post.readingTime} 分钟
                </span>
                <span className="manuscript-read">
                  翻开这页 <ArrowUpRight size={14} />
                </span>
              </span>
              <span className="manuscript-fold" aria-hidden="true" />
            </ArticleLink>
          </article>
        );
      })}
    </div>
  );
}
