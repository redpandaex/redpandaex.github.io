import { ArrowUpRight, Braces, MoveUpRight, WandSparkles } from "lucide-react";
import Link from "next/link";
import { AnimatedElement } from "@/components/animated-element";
import { ArticleExplorer } from "@/components/article-explorer";
import { Hero } from "@/components/hero";
import { getAllPosts } from "@/lib/mdx";
import { summarizePost } from "@/lib/utils";

export default function Home() {
  const posts = getAllPosts().map(summarizePost);
  return (
    <>
      <Hero />
      <section
        id="content"
        className="site-container writing-section studio-writing"
      >
        <div className="section-heading">
          <div>
            <span className="mono-label section-index">
              02 / NOTES FROM THE DESK
            </span>
            <h2>
              最近写下的
              <span className="heading-asterisk" aria-hidden="true">
                *
              </span>
            </h2>
          </div>
          <Link href="/blog" className="text-link">
            进入文章库 <ArrowUpRight size={19} />
          </Link>
        </div>
        <ArticleExplorer posts={posts.slice(0, 6)} compact />
      </section>
      <section className="site-container side-quests">
        <div className="quests-intro">
          <span className="mono-label section-index">03 / SIDE QUESTS</span>
          <h2>顺手，做点好玩的。</h2>
          <p>想法落地的另一个出口。</p>
        </div>
        <Link href="/projects" className="quest-link">
          <Braces size={28} />
          <span>
            引力与网格<small>让点阵跟着你的手指呼吸。</small>
          </span>
          <MoveUpRight size={21} />
        </Link>
        <Link href="/test-fluid" className="quest-link">
          <WandSparkles size={28} />
          <span>
            色彩流动实验<small>随手画一场，属于你的涡流。</small>
          </span>
          <MoveUpRight size={21} />
        </Link>
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
