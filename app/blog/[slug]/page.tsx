import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BlogPostContent } from "@/components/blog-post-content";
import { BlogPostSkeleton } from "@/components/blog-post-skeleton";
import {
  getCategoryBySlug,
  getPostBySlug,
  getPostSlugs,
  getRelatedPosts,
} from "@/lib/mdx";
import { getRenderedPost } from "@/lib/mdx-render";

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
  const relatedPosts = getRelatedPosts(renderedPost, 3);

  return (
    <BlogPostContent
      renderedPost={renderedPost}
      category={category ?? null}
      relatedPosts={relatedPosts}
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
    <Suspense fallback={<BlogPostSkeleton />}>
      <BlogPostPageContent slug={slug} />
    </Suspense>
  );
}
