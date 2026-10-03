import { ArrowUpRight } from "lucide-react";
import { PageLink as Link, RouteSurface } from "@/components/page-motion";
import { AmbientSurface } from "@/components/ambient-surface";
export default function NotFound() {
  return (
    <RouteSurface routeKey="not-found">
      <AmbientSurface
        kind="grid"
        className="site-container error-page error-manuscript"
      >
        <span className="error-code">404 / idea not found</span>
        <h1>
          这个灵感，
          <br />
          <span className="accent-text">暂时迷路了。</span>
        </h1>
        <p>页面可能已移动，或者链接输入有误。回到首页，继续探索。</p>
        <Link href="/" direction="back" className="primary-button">
          首页 <ArrowUpRight size={19} />
        </Link>
        <Link href="/blog" className="text-link error-archive-link">
          翻翻文章库 <ArrowUpRight size={16} />
        </Link>
      </AmbientSurface>
    </RouteSurface>
  );
}
