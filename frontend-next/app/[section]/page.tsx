import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SectionPageClient } from "@/components/SectionPageClient";
import { isSectionId, sectionPageOrder, sectionPages } from "@/content/sections";
import { siteContent } from "@/content/siteContent";

interface SectionRouteProps {
  params: Promise<{
    section: string;
  }>;
}

export const generateStaticParams = () =>
  sectionPageOrder.map((sectionId) => ({ section: sectionId }));

export const generateMetadata = async ({ params }: SectionRouteProps): Promise<Metadata> => {
  const resolvedParams = await params;
  if (!isSectionId(resolvedParams.section)) {
    return {};
  }

  const section = sectionPages[resolvedParams.section];
  return {
    title: `${section.title} | ${siteContent.siteConfig.name}`,
    description: section.dek
  };
};

export default async function SectionPage({ params }: SectionRouteProps): Promise<JSX.Element> {
  const resolvedParams = await params;
  if (!isSectionId(resolvedParams.section)) {
    notFound();
  }

  return <SectionPageClient sectionId={resolvedParams.section} />;
}
