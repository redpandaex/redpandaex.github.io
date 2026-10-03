import { ArrowUpRight, Braces } from "lucide-react";
import Link from "next/link";
import { AnimatedElement } from "@/components/animated-element";
import { ArticleExplorer } from "@/components/article-explorer";
import { AmbientSurface } from "@/components/ambient-surface";
import { Hero } from "@/components/hero";
import { getAllPosts } from "@/lib/mdx";
import { summarizePost } from "@/lib/utils";
import type { ManuscriptSnippet } from "@/components/manuscript-desk";

export default function Home() {
  const originals = getAllPosts().slice(0, 6);
  const posts = originals.map(summarizePost);
  const snippets: Record<string, ManuscriptSnippet> = {};
  for (const post of originals) {
    const block = post.content.match(/```([\w]+)[^\n]*\n([\s\S]*?)```/);
    if (block)
      snippets[post.slug] = {
        language: block[1],
        code: block[2].trim().split("\n").slice(0, 6).join("\n"),
      };
  }
  return (
    <>
      <Hero latestPost={posts[0]} />
      <section id="content">
        <AmbientSurface
          kind="grid"
          className="site-container writing-section studio-writing"
        >
          <div className="section-heading">
            <div>
              <h2>
                我的创作手稿
                <span className="heading-asterisk" aria-hidden="true">
                  *
                </span>
              </h2>
              <p className="desk-description">
                代码、思考，还有写到一半的好奇心。
              </p>
            </div>
            <Link href="/blog" className="text-link">
              进入文章库 <ArrowUpRight size={19} />
            </Link>
          </div>
          <ArticleExplorer posts={posts} compact snippets={snippets} />
        </AmbientSurface>
      </section>
      <AnimatedElement className="site-container about-strip">
        <Braces size={38} />
        <p>
          认真对待每一行代码，
          <br />
          <span>也给意想不到的灵感留一点空间。</span>
        </p>
        <Link href="/about" className="text-link">
          关于 <ArrowUpRight size={19} />
        </Link>
      </AnimatedElement>
    </>
  );
}
