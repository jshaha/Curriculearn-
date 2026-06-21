import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectCaseStudyPage } from "@/components/ProjectCaseStudyPage";
import { getProjectBySlug, projectSlugs } from "@/content/projects";
import { siteContent } from "@/content/siteContent";

interface ProjectRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export const generateStaticParams = () => projectSlugs;

export const generateMetadata = async ({ params }: ProjectRouteProps): Promise<Metadata> => {
  const resolvedParams = await params;
  const project = getProjectBySlug(resolvedParams.slug);

  if (!project) {
    return {};
  }

  return {
    title: `${project.title} | ${siteContent.siteConfig.name}`,
    description: project.dek
  };
};

export default async function ProjectPage({ params }: ProjectRouteProps): Promise<JSX.Element> {
  const resolvedParams = await params;
  const project = getProjectBySlug(resolvedParams.slug);

  if (!project) {
    notFound();
  }

  return <ProjectCaseStudyPage project={project} />;
}
