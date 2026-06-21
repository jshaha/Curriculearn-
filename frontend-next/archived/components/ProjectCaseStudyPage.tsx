"use client";

import type { ProjectCaseStudy } from "@/content/projects";
import { CaseStudyPage } from "@/components/CaseStudyPage";

export const ProjectCaseStudyPage = ({ project }: { project: ProjectCaseStudy }): JSX.Element => {
  return (
    <CaseStudyPage
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: project.title }
      ]}
      title={project.title}
      year={project.year}
      dek={project.dek}
      tags={project.tags}
      heroMedia={project.heroMedia}
      sections={project.sections}
      links={project.links}
      note={project.note}
    />
  );
};
