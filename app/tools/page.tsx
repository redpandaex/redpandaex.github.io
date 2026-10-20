import {
  ArrowUpRight,
  GitCompareArrows,
  ImageDown,
  Images,
  LockKeyhole,
} from "lucide-react";
import type { Metadata } from "next";
import { PageLink, RouteSurface } from "@/components/page-motion";
import "./tools.css";

export const metadata: Metadata = {
  title: "工具",
  description:
    "浏览器本地文本对比、图片压缩与图片格式转换，无需上传文本或图片。",
  alternates: { canonical: "/tools/" },
};

export default function ToolsPage() {
  return (
    <RouteSurface routeKey="tools">
      <div className="site-container inner-page tools-page">
        <header className="tool-page-heading tools-index-heading">
          <h1>
            工具
            <span className="library-star" aria-hidden="true">
              *
            </span>
          </h1>
          <p>文本对比、图片压缩、格式转换，都在本地完成。</p>
        </header>
        <div className="tool-directory">
          <PageLink
            href="/tools/text-diff/"
            className="tool-directory-item tool-directory-diff"
          >
            <GitCompareArrows size={38} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <h2>文本对比</h2>
              <p>
                粘贴两段文本，或导入文件。
                <br />
                逐行查看新增、删除和保留的内容。
              </p>
            </div>
            <span className="tool-directory-meta">
              UTF-8 · 按行比较 · 差异下载
            </span>
            <span className="tool-directory-action">
              开始对比
              <ArrowUpRight size={20} />
            </span>
          </PageLink>
          <PageLink
            href="/tools/image-compress/"
            className="tool-directory-item tool-directory-image"
          >
            <ImageDown size={38} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <h2>图片压缩</h2>
              <p>
                调尺寸、换格式、减小体积。
                <br />
                批量处理后，逐张查看和下载。
              </p>
            </div>
            <span className="tool-directory-meta">JPEG · PNG · WebP</span>
            <span className="tool-directory-action">
              选择图片
              <ArrowUpRight size={20} />
            </span>
          </PageLink>
          <PageLink
            href="/tools/image-convert/"
            className="tool-directory-item tool-directory-convert"
          >
            <Images size={38} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <h2>图片格式转换</h2>
              <p>
                HEIC 转 JPEG、PNG 转 ICO，或换成其他格式。
                <br />
                保留原尺寸，批量转换后逐张下载。
              </p>
            </div>
            <span className="tool-directory-meta">
              HEIC · AVIF · TIFF · JPEG XL · 更多格式
            </span>
            <span className="tool-directory-action">
              开始转换
              <ArrowUpRight size={20} />
            </span>
          </PageLink>
        </div>
        <p className="tools-local-note">
          <LockKeyhole size={18} aria-hidden="true" />
          <span>
            文本和图片留在当前浏览器。
            <br />
            打开工具并加载完成后，可以断网继续使用。
          </span>
        </p>
      </div>
    </RouteSurface>
  );
}
