"use client";

import Giscus from "@giscus/react";
import { useEffect, useState } from "react";

interface CommentsProps {
  slug: string;
}

export function Comments({ slug }: CommentsProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // 检测系统主题
    const checkTheme = () => {
      if (typeof window !== "undefined") {
        const isDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        setTheme(isDark ? "dark" : "light");
      }
    };

    checkTheme();

    // 监听主题变化
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkTheme);

    return () => mediaQuery.removeEventListener("change", checkTheme);
  }, []);

  return (
    <div className="mt-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">评论区</h2>
        <p className="text-muted-foreground mt-2">
          基于 GitHub Discussions 的评论系统，需要 GitHub 账号登录
        </p>
      </div>

      {/* 参照教程开通, https://giscus.app/zh-CN */}
      <Giscus
        id="comments"
        repo="redpandaex/redpandaex.github.io" // 替换为你的仓库
        repoId="R_kgDOPlqp9g" // 需要从https://giscus.app/zh-CN/GitHub获取
        category="Announcements" // 或者你创建的其他分类
        categoryId="DIC_kwDOPlqp9s4CutCx" // 需要从https://giscus.app/zh-CN/GitHub获取
        mapping="pathname"
        term={slug}
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme}
        lang="zh-CN"
        loading="lazy"
      />
    </div>
  );
}
