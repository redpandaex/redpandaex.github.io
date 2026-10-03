import { ArrowUpRight, Clock } from "lucide-react";
import Link from "next/link";
import { AnimatedElement } from "@/components/animated-element";
import type { PostSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BlogCard({
  post,
  featured = false,
  className,
}: {
  post: PostSummary;
  featured?: boolean;
  className?: string;
}) {
  const isMicro = post.slug.includes("qiankun");
  return (
    <AnimatedElement className={cn("post-card", className)} as="article">
      <Link
        href={`/blog/${post.slug}/`}
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
      </Link>
      <div className="post-meta">
        <span>
          {isMicro ? "架构 / 微前端" : post.tags.slice(0, 2).join(" / ")}
        </span>
        {(featured || post.featured) && (
          <span className="featured-label">精选</span>
        )}
      </div>
      <h3>
        <Link href={`/blog/${post.slug}/`}>{post.title}</Link>
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
}: {
  posts: PostSummary[];
  featuredPosts?: PostSummary[];
  className?: string;
}) {
  return (
    <div className={cn("post-grid", className)}>
      {posts.map((post) => (
        <BlogCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
