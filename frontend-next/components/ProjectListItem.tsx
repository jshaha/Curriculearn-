import Link from "next/link";

import type { ProjectCaseStudy } from "@/content/projects";
import { ItemMedia } from "@/components/ItemMedia";

export const ProjectListItem = ({ project }: { project: ProjectCaseStudy }): JSX.Element => {
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group block -mx-4 rounded-[24px] px-4 py-8 transition-[background-color] duration-200 hover:bg-fg/[0.025] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/45"
      aria-label={`Open project case study: ${project.title}`}
    >
      <article className="grid gap-6 sm:gap-8 md:grid-cols-[132px_minmax(0,1fr)] md:items-start">
        <div className="space-y-3">
          <div className="w-full max-w-[132px] overflow-hidden rounded-[5px] transition duration-200 group-hover:brightness-[1.06]">
            <ItemMedia media={project.media} title={project.title} sizes="(max-width: 768px) 150px, 132px" />
          </div>
          {project.year ? (
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted">
              {project.year}
            </p>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-fg/42 transition-colors duration-150 group-hover:text-accent">
              Case study
            </span>
          </div>

          <h2 className="mt-2 text-[1.46rem] font-medium tracking-[-0.03em] text-fg sm:text-[1.7rem]">
            <span className="relative inline-block after:absolute after:bottom-[-0.18em] after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-200 group-hover:after:scale-x-100">
              {project.title}
            </span>
          </h2>

          <p className="mt-3 max-w-[66ch] text-[1rem] leading-[1.74] text-fg/76">
            {project.dek}
          </p>

          {project.tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {project.tags.map((tag) => (
                <span
                  key={`${project.slug}-${tag}`}
                  className="rounded-full border border-fg/10 px-3 py-1.5 font-mono text-[0.58rem] uppercase tracking-[0.13em] text-fg/56 transition-colors duration-150 group-hover:border-fg/16"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
};
