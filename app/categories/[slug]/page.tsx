import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { PageLink as Link, RouteSurface } from "@/components/page-motion";
import { notFound } from "next/navigation";
import { ArticleExplorer } from "@/components/article-explorer";
import {
  getCategories,
  getCategoryBySlug,
  getPostsByCategory,
} from "@/lib/mdx";
import { summarizePost } from "@/lib/utils";
export function generateStaticParams() {
  return getCategories().map((category) => ({ slug: category.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  return {
    title: category?.name || "分类未找到",
    description: category?.description,
  };
}
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();
  return (
    <RouteSurface routeKey={`category-${slug}`}>
      <div className="site-container inner-page">
        <Link href="/categories" direction="back" className="back-link">
          <ArrowLeft size={15} /> 返回分类
        </Link>
        <header className="page-heading">
          <h1>
            {category.name}
            <span className="accent-text">.</span>
          </h1>
          <p>{category.description}</p>
        </header>
        <ArticleExplorer posts={getPostsByCategory(slug).map(summarizePost)} />
      </div>
    </RouteSurface>
  );
}
