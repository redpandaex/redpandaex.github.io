import { ArrowUpRight, Braces, GitFork, WandSparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreativePlayground } from "@/components/creative-playground";
import { siteConfig } from "@/lib/config";
export const metadata: Metadata = {
  title: "项目",
  description:
    "创意编程与交互实验：文字粒子、粒子引力、弹性网格与 WebGL 流体画布",
};
export default function ProjectsPage() {
  return (
    <div className="site-container inner-page">
      <header className="page-heading">
        <h1>
          把想法，
          <br />
          <span className="accent-text">变成可以玩的东西。</span>
        </h1>
        <p>这里是我的代码游乐场。动动鼠标，调调参数，看看会发生什么。</p>
      </header>
      <div id="canvas-lab" className="projects-canvas-lab">
        <CreativePlayground />
      </div>
      <div className="project-notes">
        <div>
          <Braces size={24} />
          <h2>粒子引力 & 弹性网格</h2>
          <p>
            Canvas 2D
            实时绘制，指针影响轨道与点阵。调整互动强度，观察不同的运动反馈。
          </p>
          <span className="mono-label">
            Canvas 2D · requestAnimationFrame · Pointer Events
          </span>
        </div>
        <Link href="/test-fluid" className="project-fluid-link">
          <WandSparkles size={28} />
          <h2>WebGL 流体画布</h2>
          <p>让颜色跟着指尖流动，体验实时流体模拟的涡流、扩散和光晕。</p>
          <span className="text-link">
            打开实验 <ArrowUpRight size={20} />
          </span>
        </Link>
      </div>
      <a
        href={`${siteConfig.social.github}/redpandaex.github.io`}
        className="source-link"
        target="_blank"
        rel="noreferrer"
      >
        <GitFork size={19} /> 在 GitHub 查看这个博客的源码{" "}
        <ArrowUpRight size={18} />
      </a>
    </div>
  );
}
