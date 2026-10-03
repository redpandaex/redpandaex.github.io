import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
export default function NotFound() {
  return (
    <div className="site-container error-page">
      <span className="error-code">404 / idea not found</span>
      <h1>
        这个灵感，
        <br />
        <span className="accent-text">暂时迷路了。</span>
      </h1>
      <p>页面可能已移动，或者链接输入有误。回到首页，继续探索。</p>
      <Link href="/" className="primary-button">
        首页 <ArrowUpRight size={19} />
      </Link>
    </div>
  );
}
