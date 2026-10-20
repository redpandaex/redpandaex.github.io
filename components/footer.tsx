import { GitFork } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { PageLink as Link } from "./page-motion";

export function Footer() {
  return (
    <footer className="site-container site-footer">
      <div className="footer-top">
        <p>
          保持好奇，
          <br />
          <span>继续创造。</span>
        </p>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {siteConfig.author.name} · Made with
          curiosity.
        </span>
        <div>
          <Link href="/about">关于</Link>
          <a href={siteConfig.social.github} target="_blank" rel="noreferrer">
            <GitFork size={16} /> GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
