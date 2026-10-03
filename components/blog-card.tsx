import { ArrowUpRight, Clock } from "lucide-react";
import { ArticleLink } from "./article-transition";
import { AnimatedElement } from "@/components/animated-element";
import type { PostSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PaperMotion } from "./page-motion";

export function BlogCard({
  post,
  featured = false,
  className,
  reveal = true,
}: {
  post: PostSummary;
  featured?: boolean;
  className?: string;
  reveal?: boolean;
}) {
  const isMicro = post.slug.includes("qiankun");
  return (
    <AnimatedElement
      className={cn("post-card", className)}
      as="article"
      reveal={reveal}
    >
      <ArticleLink
        href={`/blog/${post.slug}/`}
        title={post.title}
        className="post-cover-link"
        aria-label={`阅读：${post.title}`}
      >
        <div
          className={`post-art ${isMicro ? "post-art-micro" : "post-art-react"}`}
          aria-hidden="true"
        >
          <span className="post-art-code">{isMicro ? "{ }" : "</>"}</span>
          <span className="post-art-word">
            {isMicro ? "Small apps.\nBig ideas." : "What's\nnext?"}
          </span>
          <span className="post-art-orbit" />
          <span className="post-art-dot" />
        </div>
        <span className="post-cover-arrow">
          <ArrowUpRight size={22} />
        </span>
      </ArticleLink>
      <div className="post-meta">
        <span>
          {isMicro ? "架构 / 微前端" : post.tags.slice(0, 2).join(" / ")}
        </span>
        {(featured || post.featured) && (
          <span className="featured-label">精选</span>
        )}
      </div>
      <h3 data-article-link-title>
        <ArticleLink href={`/blog/${post.slug}/`} title={post.title}>
          {post.title}
        </ArticleLink>
      </h3>
      <p className="post-excerpt">{post.excerpt}</p>
      <div className="post-bottom">
        <time dateTime={post.publishedAt}>
          {post.publishedAt.replaceAll("-", ".")}
        </time>
        <span>
          <Clock size={14} /> {post.readingTime} 分钟阅读
        </span>
      </div>
    </AnimatedElement>
  );
}

export function BlogCardGrid({
  posts,
  className,
  motionScope,
}: {
  posts: PostSummary[];
  featuredPosts?: PostSummary[];
  className?: string;
  motionScope?: string;
}) {
  return (
    <div className={cn("post-grid", className)}>
      {posts.map((post) =>
        motionScope ? (
          <PaperMotion key={post.slug} name={`${motionScope}-${post.slug}`}>
            <BlogCard post={post} reveal={false} />
          </PaperMotion>
        ) : (
          <BlogCard key={post.slug} post={post} />
        ),
      )}
    </div>
  );
}
