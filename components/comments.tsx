"use client";

import Giscus from "@giscus/react";
import { useTheme } from "@/components/theme-provider";
export function Comments({ slug }: { slug: string }) {
  const { resolvedTheme } = useTheme();
  return (
    <section className="mt-14" aria-label="评论区">
      <h2 className="text-2xl font-semibold mb-3">一起聊聊</h2>
      <p className="text-sm text-muted-foreground mb-7">
        通过 GitHub Discussions 留下你的想法。
      </p>
      <Giscus
        id="comments"
        repo="redpandaex/redpandaex.github.io"
        repoId="R_kgDOPlqp9g"
        category="Announcements"
        categoryId="DIC_kwDOPlqp9s4CutCx"
        mapping="pathname"
        term={slug}
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={resolvedTheme}
        lang="zh-CN"
        loading="lazy"
      />
    </section>
  );
}
