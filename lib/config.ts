import type { SiteConfig } from "./types";

export const siteConfig: SiteConfig = {
  name: "Rei 的技术博客",
  description: "软件工程师 Rei 的创作手记：代码、实践，还有值得折腾的想法。",
  url: "https://redpandaex.github.io",
  author: {
    id: "lixiaowei",
    name: "Rei",
    role: "软件工程师",
    bio: "写软件，也给好奇心留接口。",
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
      label: "文章",
      href: "/blog",
    },
    {
      label: "关于",
      href: "/about",
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
