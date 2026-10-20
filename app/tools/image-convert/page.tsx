import type { Metadata } from "next";
import { RouteSurface } from "@/components/page-motion";
import { ImageConverter } from "@/components/tools/image-converter";
import { ToolHeader } from "@/components/tools/tool-header";
import "../tools.css";

export const metadata: Metadata = {
  title: "图片格式转换",
  description:
    "在浏览器本地批量转换 PNG、JPEG、WebP、AVIF、HEIC、TIFF 等图片格式，无需上传。",
  alternates: { canonical: "/tools/image-convert/" },
};

export default function ImageConvertPage() {
  return (
    <RouteSurface routeKey="image-convert">
      <div className="site-container inner-page tools-page">
        <ToolHeader
          title="图片格式转换"
          description="换个格式，保留原尺寸。常见图片和扩展格式都可以试试。"
        />
        <ImageConverter />
      </div>
    </RouteSurface>
  );
}
