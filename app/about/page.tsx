import type { Metadata } from "next";
import { Suspense } from "react";
import { AboutContent } from "@/components/about-content";
import { AboutPageSkeleton } from "@/components/about-page-skeleton";
import { getRenderedAbout } from "@/lib/mdx-render";

export const metadata: Metadata = {
  title: "关于我",
  description: "了解更多关于我的信息、技能和经历",
};

async function AboutPageContent() {
  const renderedAbout = await getRenderedAbout();
  return <AboutContent renderedContent={renderedAbout.renderedContent} />;
}

export default function AboutPage() {
  return (
    <Suspense fallback={<AboutPageSkeleton />}>
      <AboutPageContent />
    </Suspense>
  );
}
