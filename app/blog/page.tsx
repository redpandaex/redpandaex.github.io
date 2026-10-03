import type { Metadata } from "next";
import { WritingLibrary } from "@/components/writing-library";
export const metadata: Metadata = {
  title: "文章",
  description:
    "在同一个内容库里浏览文章，按分类与技术标签筛选前端实践和创意编程思考。",
};
export default function BlogPage() {
  return <WritingLibrary />;
}
