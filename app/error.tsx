"use client";
import { RotateCcw } from "lucide-react";
import { PageLink } from "@/components/page-motion";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="site-container error-page error-manuscript">
      <span className="error-code">something went wrong</span>
      <h1>加载遇到了一点问题。</h1>
      <p>请重新尝试，或者刷新页面。</p>
      <button type="button" className="primary-button" onClick={reset}>
        重试 <RotateCcw size={18} />
      </button>
      <PageLink
        href="/"
        direction="back"
        className="text-link error-archive-link"
      >
        回到首页
      </PageLink>
    </div>
  );
}
