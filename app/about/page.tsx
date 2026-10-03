import type { Metadata } from "next";
import { Suspense } from "react";
import { AboutContent } from "@/components/about-content";
import { AboutPageSkeleton } from "@/components/about-page-skeleton";
import { getRenderedAbout } from "@/lib/mdx-render";
import { RouteSurface } from "@/components/page-motion";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: `关于 ${siteConfig.author.name}`,
  description: `${siteConfig.author.name}，${siteConfig.author.role}。${siteConfig.author.bio}`,
};

async function AboutPageContent() {
  const renderedAbout = await getRenderedAbout();
  return <AboutContent renderedContent={renderedAbout.renderedContent} />;
}

export default function AboutPage() {
  return (
    <RouteSurface routeKey="about">
      <Suspense fallback={<AboutPageSkeleton />}>
        <AboutPageContent />
      </Suspense>
    </RouteSurface>
  );
}
