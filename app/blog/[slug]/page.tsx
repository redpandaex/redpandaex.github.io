import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BlogPostContent } from "@/components/blog-post-content";
import { BlogPostSkeleton } from "@/components/blog-post-skeleton";
import { RouteSurface } from "@/components/page-motion";
import {
  getAllPosts,
  getCategoryBySlug,
  getPostBySlug,
  getPostSlugs,
  getRelatedPosts,
} from "@/lib/mdx";
import { getRenderedPost } from "@/lib/mdx-render";
import { summarizePost } from "@/lib/utils";

export async function generateStaticParams() {
  const slugs = getPostSlugs();
  return slugs.map((slug) => ({
    slug: encodeURIComponent(slug),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "文章未找到",
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  };
}

async function BlogPostPageContent({ slug }: { slug: string }) {
  const renderedPost = await getRenderedPost(slug);

  if (!renderedPost) {
    notFound();
  }

  const category = getCategoryBySlug(renderedPost.category);
  const ordered = getAllPosts();
  const current = ordered.findIndex(
    (post) =>
      decodeURIComponent(post.slug) === decodeURIComponent(renderedPost.slug),
  );
  const older = current >= 0 ? ordered[current + 1] : undefined;
  const newer = current > 0 ? ordered[current - 1] : undefined;
  const relatedPosts = getRelatedPosts(renderedPost, 5)
    .filter((post) => post.slug !== older?.slug && post.slug !== newer?.slug)
    .slice(0, 3);

  return (
    <BlogPostContent
      renderedPost={renderedPost}
      category={category ?? null}
      relatedPosts={relatedPosts}
      previousPost={older ? summarizePost(older) : undefined}
      nextPost={newer ? summarizePost(newer) : undefined}
    />
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <RouteSurface routeKey={`article-${slug}`}>
      <Suspense fallback={<BlogPostSkeleton />}>
        <BlogPostPageContent slug={slug} />
      </Suspense>
    </RouteSurface>
  );
}
