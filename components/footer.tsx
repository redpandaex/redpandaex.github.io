import { ArrowUpRight, GitFork, Mail } from "lucide-react";
import Link from "next/link";
import { siteConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer className="site-container site-footer">
      <div className="footer-top">
        <p>
          保持好奇，
          <br />
          <span>继续创造。</span>
        </p>
        <div className="footer-contact">
          <span>有个有趣的想法？</span>
          <a href={`mailto:${siteConfig.author.email}`}>
            聊一聊 <ArrowUpRight size={23} />
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} LXW · Made with curiosity.</span>
        <div>
          <Link href="/about">关于</Link>
          <a href={siteConfig.social.github} target="_blank" rel="noreferrer">
            <GitFork size={16} /> GitHub
          </a>
          <a href={`mailto:${siteConfig.author.email}`}>
            <Mail size={16} /> Email
          </a>
        </div>
      </div>
    </footer>
  );
}
