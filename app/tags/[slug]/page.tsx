import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { PageLink as Link, RouteSurface } from "@/components/page-motion";
import { notFound } from "next/navigation";
import { ArticleExplorer } from "@/components/article-explorer";
import { getAllTags, getPostsByTag } from "@/lib/mdx";
import { summarizePost } from "@/lib/utils";
export function generateStaticParams() {
  return getAllTags().map((tag) => ({ slug: tag.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = getAllTags().find((tag) => tag.slug === decodeURIComponent(slug));
  return {
    title: tag ? `#${tag.name}` : "标签未找到",
    description: tag ? `探索 ${tag.name} 相关的技术文章` : undefined,
  };
}
export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = getAllTags().find((tag) => tag.slug === decodeURIComponent(slug));
  if (!tag) notFound();
  return (
    <RouteSurface routeKey={`tag-${slug}`}>
      <div className="site-container inner-page">
        <Link href="/tags" direction="back" className="back-link">
          <ArrowLeft size={15} /> 返回标签
        </Link>
        <header className="page-heading">
          <h1>
            <span className="accent-text">#</span>
            {tag.name}
          </h1>
          <p>
            关于 {tag.name} 的 {tag.count} 篇文章。
          </p>
        </header>
        <ArticleExplorer posts={getPostsByTag(tag.name).map(summarizePost)} />
      </div>
    </RouteSurface>
  );
}
