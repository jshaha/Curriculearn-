"use client";

import type { ReactNode } from "react";

import { EditorialLayout } from "@/components/EditorialLayout";
import { HeroMediaBlock } from "@/components/HeroMediaBlock";
import { ItemMedia } from "@/components/ItemMedia";
import { MarkdownContent } from "@/components/MarkdownContent";
import type {
  CaseStudySection,
  EditorialLink,
  EditorialMedia,
  HeroMedia
} from "@/content/editorialTypes";
import type { BreadcrumbItem } from "@/components/Breadcrumbs";

interface CaseStudyPageProps {
  breadcrumbs?: BreadcrumbItem[];
  backHref?: string;
  title: string;
  year?: string;
  dek: string;
  tags: string[];
  heroMedia: HeroMedia;
  sections: CaseStudySection[];
  links?: EditorialLink[];
  note?: string;
  inlineMetaMedia?: EditorialMedia;
  introSlot?: ReactNode;
}

export const CaseStudyPage = ({
  breadcrumbs,
  backHref,
  title,
  year,
  dek,
  tags,
  heroMedia,
  sections,
  links,
  note,
  inlineMetaMedia,
  introSlot
}: CaseStudyPageProps): JSX.Element => {
  return (
    <EditorialLayout
      breadcrumbs={breadcrumbs}
      backHref={backHref}
      meta={
        year ? (
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted">
            {year}
          </p>
        ) : undefined
      }
      title={title}
      dek={dek}
      chips={tags}
      intro={
        <div className="space-y-4">
          {links && links.length > 0 ? (
            <div className="flex flex-wrap gap-4 text-[0.95rem] text-fg/68">
              {links.map((link) => (
                <a
                  key={`${title}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-fg/16 underline-offset-4 transition-colors duration-150 hover:text-accent hover:decoration-accent"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
          {introSlot}
        </div>
      }
    >
      <div className="space-y-11">
        <div className="max-w-[960px]">
          <HeroMediaBlock media={heroMedia} />
        </div>

        {inlineMetaMedia ? (
          <div className="max-w-[220px]">
            <ItemMedia media={inlineMetaMedia} title={title} sizes="220px" roundedClassName="rounded-[5px]" />
          </div>
        ) : null}

        {sections.map((section) => (
          <section key={section.id} className="max-w-[72ch] space-y-4">
            <h2 className="text-[1.42rem] font-medium tracking-[-0.03em] text-fg sm:text-[1.6rem]">
              {section.heading}
            </h2>
            <MarkdownContent content={section.body} />
            {section.media ? (
              <div className="max-w-[680px] pt-2">
                <ItemMedia
                  media={section.media}
                  title={`${title} ${section.heading}`}
                  sizes="(max-width: 1024px) 100vw, 680px"
                  className="w-full"
                  roundedClassName="rounded-[5px]"
                />
              </div>
            ) : null}
          </section>
        ))}

        {note ? <p className="max-w-[72ch] text-sm leading-relaxed text-muted">{note}</p> : null}
      </div>
    </EditorialLayout>
  );
};
