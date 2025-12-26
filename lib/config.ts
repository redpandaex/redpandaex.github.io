import type { SiteConfig } from "./types";

export const siteConfig: SiteConfig = {
  name: "LXW的技术博客",
  description:
    "专注于前端技术、React、Next.js、TypeScript 等现代 Web 开发技术分享",
  url: "https://redpandaex.github.io",
  author: {
    id: "lixiaowei",
    name: "LXW",
    bio: "全栈开发工程师，专注于现代 Web 技术栈，热爱开源和技术分享。",
    avatar: "/images/avatar.jpg",
    email: "lxw.tech.dev@gmail.com",
    social: {
      github: "https://github.com/redpandaex",
      twitter: "https://x.com/lxw_xw",
      website: "https://redpandaex.github.io",
    },
  },
  navigation: [
    {
      label: "首页",
      href: "/",
    },
    {
      label: "博客",
      href: "/blog",
    },
    {
      label: "分类",
      href: "/categories",
    },
    {
      label: "标签",
      href: "/tags",
    },
    {
      label: "关于",
      href: "/about",
    },
    {
      label: "项目",
      href: "/projects",
    },
  ],
  social: {
    github: "https://github.com/redpandaex",
    twitter: "https://x.com/lxw_xw",
  },
};

export const categories = [
  {
    id: "frontend",
    name: "前端开发",
    slug: "frontend",
    description: "React, Vue, JavaScript, TypeScript 等前端技术",
    color: "blue",
  },
  {
    id: "backend",
    name: "后端开发",
    slug: "backend",
    description: "Node.js, Python, Java 等后端技术",
    color: "green",
  },
  {
    id: "devops",
    name: "DevOps",
    slug: "devops",
    description: "Docker, CI/CD, 部署等运维技术",
    color: "purple",
  },
  {
    id: "tools",
    name: "开发工具",
    slug: "tools",
    description: "VSCode, Git, 各种开发工具介绍",
    color: "orange",
  },
  {
    id: "tutorial",
    name: "教程",
    slug: "tutorial",
    description: "技术教程和学习笔记",
    color: "pink",
  },
];
