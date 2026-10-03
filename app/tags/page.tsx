import type { Metadata } from "next";
import { WritingLibrary } from "@/components/writing-library";
export const metadata: Metadata = {
  title: "文章 · 标签",
  description: "在文章库里按技术标签探索内容。",
};
export default function TagsPage() {
  return <WritingLibrary initialView="tags" />;
}
