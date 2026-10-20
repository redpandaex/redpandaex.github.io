import type { Metadata } from "next";
import { RouteSurface } from "@/components/page-motion";
import { ProjectShowcase } from "@/components/project-showcase";

export const metadata: Metadata = {
  title: "项目",
  description:
    "SonaHop 跨设备音频、SSR2Clash 订阅转换、GlimTray 显示器亮度工具。",
  alternates: { canonical: "/projects/" },
};
export default function ProjectsPage() {
  return (
    <RouteSurface routeKey="projects">
      <div className="site-container inner-page projects-page">
        <header className="projects-heading">
          <h1>
            项目
            <span className="library-star" aria-hidden="true">
              *
            </span>
          </h1>
          <p>围绕声音、网络和显示器，做了这三个工具。</p>
        </header>
        <ProjectShowcase />
      </div>
    </RouteSurface>
  );
}
