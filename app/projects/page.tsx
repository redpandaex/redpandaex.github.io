import { Calendar, ExternalLink, GitFork, Github, Star } from "lucide-react";
import type { Metadata } from "next";
import { AnimatedElement } from "@/components/animated-element";
import { ClickEffects } from "@/components/click-effects";
import { ParticleBackground } from "@/components/particle-background";
import { ScrollProgress } from "@/components/scroll-progress";
import { AnimatedHeading, GradientText } from "@/components/text-effects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "我的项目",
  description: "查看我开发的开源项目和技术作品",
};

// 项目数据
const projects = [
  {
    id: 1,
    name: "Next.js 博客系统",
    description:
      "基于 Next.js 15 和 React 19 构建的现代化博客系统，支持 MDX、分类标签、搜索等功能。",
    longDescription:
      "这是一个功能完整的现代化博客系统，采用最新的 Next.js 15 和 React 19 技术栈。支持 MDX 文章编写、动态分类和标签系统、全文搜索、响应式设计等特性。包含丰富的动画效果和用户交互体验。",
    image: "/images/projects/blog-system.jpg",
    technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "MDX"],
    category: "Web App",
    featured: true,
    status: "完成",
    github: "https://github.com/redpandaex/blog-system",
    demo: "https://blog-demo.example.com",
    stars: 128,
    forks: 24,
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "React 组件库",
    description:
      "基于 TypeScript 开发的现代化 React 组件库，包含常用 UI 组件和工具函数。",
    longDescription:
      "一个高质量的 React 组件库，提供了丰富的 UI 组件和实用工具。所有组件都经过精心设计，支持主题定制、暗黑模式、响应式设计等特性。包含完整的文档和 Storybook 演示。",
    image: "/images/projects/component-library.jpg",
    technologies: ["React", "TypeScript", "Storybook", "Rollup", "CSS-in-JS"],
    category: "Library",
    featured: true,
    status: "进行中",
    github: "https://github.com/redpandaex/react-ui-lib",
    demo: "https://ui-lib-demo.example.com",
    stars: 89,
    forks: 16,
    createdAt: "2023-11-20",
  },
  {
    id: 3,
    name: "Vue 3 管理后台",
    description: "基于 Vue 3 和 TypeScript 的企业级后台管理系统模板。",
    longDescription:
      "一个功能完整的企业级后台管理系统模板，采用 Vue 3 Composition API 和 TypeScript。包含用户权限管理、动态路由、图表展示、表格操作等常见功能模块。",
    image: "/images/projects/vue-admin.jpg",
    technologies: ["Vue 3", "TypeScript", "Element Plus", "Pinia", "Vite"],
    category: "Web App",
    featured: false,
    status: "完成",
    github: "https://github.com/redpandaex/vue-admin",
    demo: "https://vue-admin-demo.example.com",
    stars: 156,
    forks: 32,
    createdAt: "2023-09-10",
  },
  {
    id: 4,
    name: "Node.js API 框架",
    description:
      "轻量级的 Node.js API 框架，支持 TypeScript、JWT 认证、数据验证等功能。",
    longDescription:
      "一个专为快速开发 RESTful API 而设计的 Node.js 框架。内置 JWT 认证、请求验证、错误处理、日志记录等功能。支持 TypeScript，提供良好的开发体验。",
    image: "/images/projects/nodejs-api.jpg",
    technologies: ["Node.js", "Express", "TypeScript", "JWT", "MongoDB"],
    category: "Backend",
    featured: false,
    status: "完成",
    github: "https://github.com/redpandaex/nodejs-api-framework",
    demo: null,
    stars: 67,
    forks: 12,
    createdAt: "2023-07-05",
  },
  {
    id: 5,
    name: "微前端解决方案",
    description: "基于模块联邦的微前端架构实践，支持多应用集成和独立部署。",
    longDescription:
      "一个完整的微前端解决方案，采用 Webpack 5 模块联邦技术。支持多个独立应用的集成、共享依赖、独立部署和版本控制。包含主应用和多个微应用的完整示例。",
    image: "/images/projects/micro-frontend.jpg",
    technologies: [
      "Webpack 5",
      "React",
      "Module Federation",
      "TypeScript",
      "Docker",
    ],
    category: "Architecture",
    featured: true,
    status: "进行中",
    github: "https://github.com/redpandaex/micro-frontend-demo",
    demo: "https://micro-fe-demo.example.com",
    stars: 203,
    forks: 45,
    createdAt: "2023-12-01",
  },
  {
    id: 6,
    name: "React Native 移动应用",
    description:
      "跨平台移动应用，支持 iOS 和 Android，集成了常见的移动端功能。",
    longDescription:
      "一个功能丰富的跨平台移动应用，使用 React Native 开发。包含用户认证、推送通知、地理定位、相机功能、离线存储等移动端常见需求的实现。",
    image: "/images/projects/react-native-app.jpg",
    technologies: [
      "React Native",
      "TypeScript",
      "Redux Toolkit",
      "Expo",
      "Firebase",
    ],
    category: "Mobile App",
    featured: false,
    status: "完成",
    github: "https://github.com/redpandaex/rn-mobile-app",
    demo: null,
    stars: 94,
    forks: 18,
    createdAt: "2023-05-15",
  },
];

export default function ProjectsPage() {
  const featuredProjects = projects.filter((project) => project.featured);
  const otherProjects = projects.filter((project) => !project.featured);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "完成":
        return "bg-green-100 text-green-800 border-green-200";
      case "进行中":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Web App": "#3b82f6",
      Library: "#10b981",
      Backend: "#f59e0b",
      Architecture: "#8b5cf6",
      "Mobile App": "#ef4444",
    };
    return colors[category] || "#6b7280";
  };

  return (
    <div className="min-h-screen relative">
      {/* 背景特效 */}
      <ParticleBackground />

      {/* 滚动进度 */}
      <ScrollProgress />

      {/* 点击效果 */}
      <ClickEffects />

      <div className="pt-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <AnimatedElement animation="slideInUp">
              <AnimatedHeading level={1} className="text-4xl sm:text-5xl mb-4">
                我的项目
              </AnimatedHeading>
              <div className="text-lg text-muted-foreground max-w-2xl mx-auto">
                <GradientText className="text-lg">
                  这里展示了我开发的一些开源项目和技术作品，涵盖前端、后端、移动端等多个领域
                </GradientText>
              </div>
            </AnimatedElement>
          </div>

          {/* 特色项目 */}
          <AnimatedElement animation="slideInUp" delay={0.2} className="mb-16">
            <h2 className="text-2xl font-bold mb-8">✨ 特色项目</h2>
            <div className="grid gap-8 lg:grid-cols-2">
              {featuredProjects.map((project, index) => (
                <AnimatedElement
                  key={project.id}
                  animation="slideInUp"
                  delay={0.3 + index * 0.1}
                >
                  <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
                    {/* 项目图片 */}
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center text-6xl text-primary/30">
                        🚀
                      </div>
                      <div className="absolute top-4 left-4">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge
                          style={{
                            backgroundColor: `${getCategoryColor(project.category)}20`,
                            color: getCategoryColor(project.category),
                            borderColor: `${getCategoryColor(project.category)}40`,
                          }}
                        >
                          {project.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            <span>{project.stars}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            <span>{project.forks}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        {project.longDescription}
                      </p>

                      {/* 技术栈 */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.technologies.map((tech) => (
                          <Badge
                            key={tech}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>

                      {/* 项目信息 */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(project.createdAt).toLocaleDateString(
                              "zh-CN",
                            )}
                          </span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Github className="h-3 w-3" />
                            源码
                          </a>
                        </Button>
                        {project.demo && (
                          <Button size="sm" asChild>
                            <a
                              href={project.demo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              演示
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </AnimatedElement>
              ))}
            </div>
          </AnimatedElement>

          {/* 其他项目 */}
          <AnimatedElement animation="slideInUp" delay={0.6}>
            <h2 className="text-2xl font-bold mb-8">📚 其他项目</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {otherProjects.map((project, index) => (
                <AnimatedElement
                  key={project.id}
                  animation="slideInUp"
                  delay={0.7 + index * 0.1}
                >
                  <Card className="p-6 border-2 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <div className="flex gap-2">
                          <Badge
                            className={getStatusColor(project.status)}
                            variant="outline"
                          >
                            {project.status}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {project.description}
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {project.technologies.slice(0, 3).map((tech) => (
                          <Badge
                            key={tech}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {project.technologies.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.technologies.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            <span>{project.stars}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            <span>{project.forks}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(project.createdAt).toLocaleDateString(
                              "zh-CN",
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex-1"
                        >
                          <a
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1"
                          >
                            <Github className="h-3 w-3" />
                            源码
                          </a>
                        </Button>
                        {project.demo && (
                          <Button size="sm" asChild className="flex-1">
                            <a
                              href={project.demo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              演示
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </AnimatedElement>
              ))}
            </div>
          </AnimatedElement>

          {/* 项目统计 */}
          <AnimatedElement animation="slideInUp" delay={1.0} className="mt-16">
            <Card className="p-8 text-center border-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {projects.length}
                  </div>
                  <div className="text-muted-foreground">个项目</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {projects.reduce(
                      (total, project) => total + project.stars,
                      0,
                    )}
                  </div>
                  <div className="text-muted-foreground">GitHub Stars</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {projects.reduce(
                      (total, project) => total + project.forks,
                      0,
                    )}
                  </div>
                  <div className="text-muted-foreground">GitHub Forks</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {
                      new Set(
                        projects.flatMap((project) => project.technologies),
                      ).size
                    }
                  </div>
                  <div className="text-muted-foreground">种技术栈</div>
                </div>
              </div>
            </Card>
          </AnimatedElement>
        </div>
      </div>
    </div>
  );
}
