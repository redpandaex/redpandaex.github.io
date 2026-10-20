import type { Metadata } from "next";
import { RouteSurface } from "@/components/page-motion";
import { TextDiff } from "@/components/tools/text-diff";
import { ToolHeader } from "@/components/tools/tool-header";
import "../tools.css";

export const metadata: Metadata = {
  title: "文本对比",
  description: "本地比较两段文本或 UTF-8 文件，逐行显示差异，支持差异下载。",
  alternates: { canonical: "/tools/text-diff/" },
};

export default function TextDiffPage() {
  return (
    <RouteSurface routeKey="text-diff">
      <div className="site-container inner-page tools-page">
        <ToolHeader
          title="文本对比"
          description="放进两段文本，看看哪里不一样。"
        />
        <TextDiff />
      </div>
    </RouteSurface>
  );
}
