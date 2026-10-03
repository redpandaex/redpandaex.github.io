import type { Metadata } from "next";
import { WritingLibrary } from "@/components/writing-library";
export const metadata: Metadata = {
  title: "文章 · 分类",
  description: "在文章库里按技术分类探索内容。",
};
export default function CategoriesPage() {
  return <WritingLibrary initialView="categories" />;
}
