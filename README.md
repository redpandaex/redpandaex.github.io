# 李小伟的技术博客

[![Website](https://img.shields.io/website?url=https%3A%2F%2Flixiaowei11111.github.io&up_message=online&down_message=offline&style=for-the-badge&logo=vercel)](https://redpandaex.github.io)

🌐 **在线访问**: [https://redpandaex.github.io](https://redpandaex.github.io)

![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC)
![License](https://img.shields.io/badge/License-MIT-green)

一个基于 Next.js 15 和 React 19 构建的现代化技术博客，专注于前端技术分享和现代 Web 开发技术栈。

## ✨ 特性

- 🚀 **现代技术栈**: 基于 Next.js 15 + React 19 + TypeScript
- 🎨 **精美设计**: 使用 TailwindCSS 4 打造现代化 UI
- 📝 **MDX 支持**: 强大的 MDX 内容管理，支持 React 组件
- 🌟 **动画效果**: 集成 GSAP 和自定义动画效果
- 📱 **响应式设计**: 完美适配各种设备屏幕
- ⚡ **性能优化**: 静态生成，快速加载
- 🔍 **SEO 友好**: 完整的 SEO 优化和 OpenGraph 支持
- 🎯 **分类标签**: 完善的博客分类和标签系统
- 🎊 **交互特效**: 丰富的页面交互和视觉特效

## 🛠️ 技术栈

### 核心框架
- **Next.js 15** - React 全栈框架
- **React 19** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript

### 样式和 UI
- **TailwindCSS 4** - 原子化 CSS 框架
- **Radix UI** - 无障碍 UI 组件库
- **Lucide React** - 现代图标库
- **GSAP** - 高性能动画库

### 内容管理
- **MDX** - Markdown + React 组件
- **Gray Matter** - Frontmatter 解析
- **Remark & Rehype** - Markdown 处理器
- **Reading Time** - 阅读时间估算

### 开发工具
- **Biome** - 快速的代码格式化和检查工具
- **PNPM** - 高效的包管理器
- **TypeScript** - 静态类型检查

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- PNPM (推荐) 或 npm/yarn

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/redpandaex/redpandaex.github.io.git
cd redpandaex.github.io

# 安装依赖
pnpm install
```

### 开发环境

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:9966
```

### 构建部署

```bash
# 构建项目
pnpm build

# 预览构建结果
pnpm preview
```

## 📁 项目结构

```
├── app/                    # Next.js App Router 页面
│   ├── blog/              # 博客相关页面
│   ├── categories/        # 分类页面
│   ├── tags/              # 标签页面
│   ├── about/             # 关于页面
│   └── projects/          # 项目展示页面
│
├── components/            # React 组件
│   ├── ui/               # UI 组件库
│   ├── blog-card.tsx     # 博客卡片组件
│   ├── navbar.tsx        # 导航栏组件
│   ├── footer.tsx        # 页脚组件
│   └── ...               # 其他组件
├── content/              # 内容文件
│   ├── posts/            # 博客文章 (MDX)
│   ├── pages/            # 页面内容 (MDX)
│   └── data/             # 数据文件
├── lib/                  # 工具库
│   ├── config.ts         # 站点配置
│   ├── mdx.ts           # MDX 处理
│   ├── posts.ts         # 文章处理
│   └── utils.ts         # 工具函数
├── public/               # 静态资源
└── types/                # TypeScript 类型定义
```

## 📝 内容管理

### 添加新文章

1. 在 `content/posts/` 目录下创建新的 `.mdx` 文件
2. 添加 frontmatter 元数据：

```mdx
---
title: "文章标题"
description: "文章描述"
date: "2024-01-01"
tags: ["React", "Next.js"]
category: "frontend"
---

# 文章内容

这里是文章正文...
```

### 支持的 Frontmatter 字段

- `title`: 文章标题
- `description`: 文章描述
- `date`: 发布日期
- `tags`: 标签数组
- `category`: 分类
- `featured`: 是否为精选文章
- `draft`: 是否为草稿

## 🎨 自定义配置

在 `lib/config.ts` 中可以配置：

- 站点基本信息
- 作者信息
- 社交链接
- 导航菜单
- 分类设置

## 🌟 特效演示

项目包含多种精美的交互特效：

- 粒子背景动画
- 磁性按钮效果
- 页面滚动进度
- 点击特效
- 加载动画
- 文本动画效果


## 📊 性能优化

- ⚡ 静态生成 (SSG)
- 🖼️ 图片优化
- 📦 代码分割
- 🗜️ 资源压缩
- 🚀 预加载关键资源

## 🔧 开发脚本

```bash
# 开发环境
pnpm dev

# 构建项目
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 📱 部署

### GitHub Pages

项目已配置为自动部署到 GitHub Pages。推送到主分支时会自动触发部署。

### 其他平台

- **Vercel**: 一键部署
- **Netlify**: 支持自动部署
- **自托管**: 使用 `pnpm build` 构建后部署 `out` 目录

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👨‍💻 作者

**LXW**

- GitHub: [@redpandaex](https://github.com/redpandaex)
- 网站: [https://redpandaex.github.io](https://redpandaex.github.io)

## 🙏 致谢

- [Next.js](https://nextjs.org/) - 强大的 React 框架
- [TailwindCSS](https://tailwindcss.com/) - 实用的 CSS 框架
- [Radix UI](https://www.radix-ui.com/) - 高质量的 UI 组件
- [GSAP](https://greensock.com/gsap/) - 专业的动画库

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！