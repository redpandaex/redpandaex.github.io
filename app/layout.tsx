import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { GoogleAnalytics } from "@/components/google-analytics";
import { Navbar } from "@/components/navbar";
import { ParticleBackground } from "@/components/particle-background";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/lib/config";
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
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: "@lxw",
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
        <ThemeProvider defaultTheme="system" storageKey="ui-theme">
          {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
            <GoogleAnalytics
              measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
            />
          )}
          <a href="#main-content" className="skip-link">
            跳转到主要内容
          </a>
          <ParticleBackground />
          <div className="relative z-10 flex min-h-screen flex-col">
            <Navbar />
            <main id="main-content" className="flex-1" tabIndex={-1}>
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
