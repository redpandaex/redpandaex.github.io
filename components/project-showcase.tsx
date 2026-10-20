import { ArrowDownToLine, ArrowUpRight, GitFork } from "lucide-react";
import Image from "next/image";
import { projects } from "@/lib/projects";
import "@/app/projects/projects.css";

export function ProjectShowcase({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`project-showcase${compact ? " project-showcase-compact" : ""}`}
    >
      {projects.map((project) => (
        <article
          key={project.slug}
          className={`project-sheet project-${project.slug}`}
        >
          <div className="project-visual">
            <Image
              src={project.image}
              alt={project.imageAlt}
              width={project.imageWidth}
              height={project.imageHeight}
              loading={compact ? "lazy" : "eager"}
              sizes={
                project.slug === "ssr2clash"
                  ? "(max-width: 600px) 90vw, 600px"
                  : "180px"
              }
            />
          </div>
          <div className="project-body">
            <p className="project-category">{project.category}</p>
            <h2>{project.name}</h2>
            <p className="project-description">{project.description}</p>
            {!compact && (
              <ul className="project-features">
                {project.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            )}
            <p className="project-platform">
              {project.platforms}
              <span>{project.stack}</span>
            </p>
            <div className="project-actions">
              <a
                href={`https://github.com/redpandaex/${project.slug}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`查看 ${project.name} 源码`}
              >
                <GitFork size={15} />
                源码
                <ArrowUpRight size={14} />
              </a>
              <a
                href={`https://github.com/redpandaex/${project.slug}/releases`}
                target="_blank"
                rel="noreferrer"
                aria-label={`下载 ${project.name}`}
              >
                <ArrowDownToLine size={15} />
                下载
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
