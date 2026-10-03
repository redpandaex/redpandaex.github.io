import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { GoogleAnalytics } from "@/components/google-analytics";
import { Navbar } from "@/components/navbar";
import { MotionProvider } from "@/components/motion-provider";
import { PaletteProvider } from "@/components/palette-provider";
import { ArticleTransitionProvider } from "@/components/article-transition";
import { ScrollProgress } from "@/components/scroll-progress";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/lib/config";
import { getAllPosts } from "@/lib/mdx";
import { summarizePost } from "@/lib/utils";
import "./globals.css";
// 导入highlight.js样式 - 选择一个主题，比如github-dark
import "highlight.js/styles/github-dark.css";
import cn from "clsx";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // 添加这一行
  preload: true, // 显式启用预加载
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // 添加这一行
  preload: true, // 显式启用预加载
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  verification: {
    google: "jZIW_JJilnDkihlbOvJH_2viVeLvwWXCACY_agwifhU",
    other: {
      "msvalidate.01": "251506A8C8052BFBD12CD6A66D49B33A",
    },
  },
  description: siteConfig.description,
  icons: { icon: "/favicon.svg" },
  keywords: [
    "Next.js",
    "React",
    "TypeScript",
    "Tailwind CSS",
    "GSAP",
    "前端开发",
    "技术博客",
    "LXW",
  ],
  authors: [
    {
      name: siteConfig.author.name,
      url: siteConfig.url,
    },
  ],
  creator: siteConfig.author.name,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/images/redpanda-studio.webp",
        width: 1400,
        height: 1050,
        alt: "RedPanda 创意编程博客",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: "@lxw",
    images: ["/images/redpanda-studio.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth">
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider defaultTheme="light" storageKey="ui-theme">
          <MotionProvider>
            <PaletteProvider>
              <ArticleTransitionProvider>
                {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
                  <GoogleAnalytics
                    measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
                  />
                )}
                <a href="#main-content" className="skip-link">
                  跳转到主要内容
                </a>
                <ScrollProgress />
                <Navbar posts={getAllPosts().map(summarizePost)} />
                <div className="site-shell relative z-10 flex min-h-screen flex-col">
                  <main id="main-content" className="flex-1" tabIndex={-1}>
                    {children}
                  </main>
                  <Footer />
                </div>
              </ArticleTransitionProvider>
            </PaletteProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
