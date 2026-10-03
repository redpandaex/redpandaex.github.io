import Image from "next/image";
export function AboutContent({ renderedContent }: { renderedContent: string }) {
  return (
    <div className="site-container inner-page about-page">
      <header className="about-banner">
        <div>
          <h1>
            你好，
            <br />
            <span className="accent-text">我是 LXW。</span>
          </h1>
          <p>
            前端工程师，开源爱好者，也是一个始终保持好奇的人。
            <br />
            喜欢把复杂问题拆开，把有趣的想法做出来。
          </p>
        </div>
        <Image
          src="/images/redpanda-studio.webp"
          alt="LXW 博客的小熊猫创意编程形象"
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
