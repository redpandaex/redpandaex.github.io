import type { Metadata } from "next";
import { RouteSurface } from "@/components/page-motion";
import { ImageCompressor } from "@/components/tools/image-compressor";
import { ToolHeader } from "@/components/tools/tool-header";
import "../tools.css";

export const metadata: Metadata = {
  title: "图片压缩",
  description:
    "浏览器本地批量压缩 JPEG、PNG、WebP 图片，调整尺寸与质量，无需上传。",
  alternates: { canonical: "/tools/image-compress/" },
};

export default function ImageCompressPage() {
  return (
    <RouteSurface routeKey="image-compress">
      <div className="site-container inner-page tools-page">
        <ToolHeader
          title="图片压缩"
          description="让图片轻一点，尺寸和质量自己选。"
        />
        <ImageCompressor />
      </div>
    </RouteSurface>
  );
}
