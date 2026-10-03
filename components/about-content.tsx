import Image from "next/image";
import { siteConfig } from "@/lib/config";
export function AboutContent({ renderedContent }: { renderedContent: string }) {
  return (
    <div className="site-container inner-page about-page">
      <header className="about-banner">
        <div>
          <h1>
            你好，
            <br />
            <span className="accent-text">我是 {siteConfig.author.name}。</span>
          </h1>
          <p>
            {siteConfig.author.role} / 好奇心常驻。
            <br />
            {siteConfig.author.bio}
          </p>
        </div>
        <Image
          src="/images/redpanda-studio.webp"
          alt={`${siteConfig.author.name} 博客的小熊猫创意编程形象`}
          width={600}
          height={450}
          sizes="(max-width: 767px) 300px, 400px"
        />
      </header>
      <article
        className="prose max-w-none article-prose about-body"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is generated from the trusted local about page.
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    </div>
  );
}
