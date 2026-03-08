import { BlogCardGrid } from "@/components/blog-card";
import { ClickEffects } from "@/components/click-effects";
import { Hero } from "@/components/hero";
import { HomeClientWrapper } from "@/components/home-client-wrapper";
import { ParticleBackground } from "@/components/particle-background";
import { ScrollProgress } from "@/components/scroll-progress";
import { getAllPosts, getFeaturedPosts } from "@/lib/posts";

export default function Home() {
  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts();
  const recentPosts = allPosts.slice(0, 6); // 显示最新的6篇文章

  return (
    <HomeClientWrapper>
      <div className="min-h-screen relative">
        {/* 背景特效 */}
        <ParticleBackground />

        {/* 滚动进度和回到顶部 */}
        <ScrollProgress />

        {/* 点击效果 */}
        <ClickEffects />

        {/* Hero 区域 */}
        <Hero />

        {/* 内容区域 */}
        <main
          id="content"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10"
        >
          <BlogCardGrid posts={recentPosts} featuredPosts={featuredPosts} />
        </main>
      </div>
    </HomeClientWrapper>
  );
}