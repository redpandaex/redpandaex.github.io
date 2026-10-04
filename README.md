# Rei 的技术博客

[访问博客](https://redpandaex.github.io) · [GitHub](https://github.com/redpandaex/redpandaex.github.io)

软件工程师 Rei 的创作手记：分享技术思考，也把创意编程融入页面交互。使用 Next.js 静态导出，适用于 GitHub Pages。

## 技术栈

- Next.js 16.3.8 / React 19.3.0 / TypeScript 7.0.2
- Tailwind CSS 4.3.3 / Radix UI / Lucide 1.50
- Three.js 0.186.1 / GSAP 3.15 / Canvas 2D / WebGL
- MDX 内容文件 / Remark & Rehype / highlight.js
- Biome 2.5.15 / Playwright 1.63

## 本地运行

使用 Node.js 24，pnpm 版本由 package.json 的 packageManager 固定。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开 http://localhost:9966。

## 构建与检查

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm preview
```

构建结果位于 out/。dev 和 build 显式使用 Webpack，兼容现有 MDX JavaScript 插件。Next.js 16 默认使用 Turbopack，迁移依据：[官方升级文档](https://nextjs.org/docs/app/guides/upgrading/version-16)。

## 交互

- 首页 Code. Create. 标题由细密粒子组成；指针拨动、点击打散、弹性归位与滚动解构直接融入标题。
- 桌面使用书脊式侧边目录，手机使用底部浮动导航；首页、文章、关于是三个入口。搜索、主题、动效开关与 GitHub 位于快捷工具中。
- 首页小熊猫是整站调色师：点击它随机换色，桌面色票可直接选择四组配色并重置；配色同步到标题、纸张、粒子、轨道与流体，保存在浏览器。
- 首页文章排成错落的创作手稿，带胶带、折角和摘自原文的代码便签；悬停时纸张抬起，手机端改为竖向堆叠。
- 首页「翻开最新手稿」让 Code. Create. 的粒子流向文章标题；手稿、文章库与相关文章链接从对应文章标题开始转场。普通链接导航不被延迟，关闭动效或 WebGL 不可用时直接阅读。
- 全站搜索支持 Ctrl/Cmd + K、方向键、Enter、Escape；原生 dialog 管理焦点。
- 文章、分类、标签统一在 /blog/ 文章库内浏览；分类、标签、关键词可组合筛选，筛选 URL 可分享。
- 文章页提供目录导航、字号调节、代码复制。
- 常规页面切换使用 React / 浏览器原生转场：前进与返回方向不同，侧边导航保持固定；文章粒子转场单独保留。支持该 API 的浏览器会启用动画。
- 筛选与排序时文章纸张平滑重排，分类 / 标签面板轻量切换；搜索输入即时响应。
- 阅读页提供真实的上一篇 / 下一篇，目录书签跟随章节移动，跳转章节时短暂高亮；404 与加载失败页沿用胶带、纸张和折角。
- 引力融入首页按钮和小熊猫贴纸周围；弹性网格成为首页文章区和文章库的轻量底纹。
- 流体色彩跟随首页指针移动，直接出现在页面背景；首次交互后加载，闲置或离开可见区域后停绘。WebGL 初始化失败时自动使用 Canvas 淡彩拖尾。
- /projects/ 与 /test-fluid/ 的旧链接自动回到创意主页，不再提供独立实验展台。
- 深浅色主题同步评论，偏好保存在浏览器。
- 快捷工具的动效开关统一控制文字粒子、轨道、磁性按钮、网格、流体和入场动画；系统减少动态效果时关闭这些动画。装饰 Canvas 不拦截链接或原生滚动。
- 保留现有文章和分类/标签详情 URL；旧分类、标签首页也使用统一文章库。

## 浏览器验收

安装 Google Chrome 后运行：

```bash
pnpm build
pnpm test:e2e
```

测试使用本机 Chrome，覆盖桌面与手机的真实交互、布局、主题、代码复制和动态效果偏好。测试会在 9977 端口启动独立的静态预览，不占用日常开发的 9966 端口。报告位于 playwright-report/；失败保留 trace。

最新的布局、统一文章库、手稿、整站配色、标题粒子与原生页面转场按用户要求交由手动验收，未重新运行测试；现有测试中的旧导航、标题、标签入口和实验页断言需要随最终确认的交互更新。

## 内容管理

文章放在 content/posts/ 下，支持 .md 和 .mdx。首页、列表、标签、分类、搜索和详情统一读取这些文件。

```md
---
title: "文章标题"
excerpt: "一句话摘要"
author: "Rei"
publishedAt: "2026-10-03"
updatedAt: "2026-10-03"
tags: ["React", "Next.js"]
category: "frontend"
featured: true
---

# 文章标题

这里是文章正文。
```

category 应与 content/data/categories.json 中的 slug 对应。关于页在 content/pages/about.mdx，站点和社交配置在 lib/config.ts。

个人介绍使用 Rei / 软件工程师；首页与关于页横幅共享 author.name、author.role 和 author.bio，长介绍在 content/pages/about.mdx 中编辑。

内容正文通过 Markdown 处理器生成 HTML，未执行正文中的 React 组件。next.config.ts 的 MDX 插件也支持将 MDX 直接作为页面导入。

## 部署

现有 GitHub Actions 在 main 分支有新提交时构建并发布 GitHub Pages。构建前执行类型与代码检查，安装使用 frozen lockfile。将 out/ 上传到其他静态托管平台也可使用。

构建和部署固定使用 ubuntu-24.04，Node 版本读取 .node-version，Actions 使用 Node 24 运行时的版本。静态导出和 MDX 插件统一由 next.config.ts 配置，Pages 设置步骤不再自动生成第二份 Next.js 配置。

## 设计

视觉方向、交互约束与审计记录在 [DESIGN.md](./DESIGN.md)。主视觉为生成的小熊猫插画，WebP 资源约 100 KB，通过 Next/font 加载字体。

## 许可证

[MIT](./LICENSE)。
