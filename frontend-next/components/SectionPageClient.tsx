"use client";

import type { SectionId } from "@/content/siteContent";
import { AccordionList } from "@/components/AccordionList";
import { AboutHobbies } from "@/components/AboutHobbies";
import { EditorialLayout } from "@/components/EditorialLayout";
import { InterestRows } from "@/components/InterestRows";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ProjectListItem } from "@/components/ProjectListItem";
import { hobbyGroups } from "@/content/hobbies";
import { interests, interestsIntro } from "@/content/interests";
import { projectCaseStudies } from "@/content/projects";
import { sectionPages } from "@/content/sections";
import { useScrollMotion } from "@/hooks/useScrollMotion";
import { usePrefersReducedMotion } from "@/lib/hooks";
import { SectionBrainHeader } from "@/three/SectionBrainHeader";

interface SectionPageClientProps {
  sectionId: SectionId;
}

export const SectionPageClient = ({ sectionId }: SectionPageClientProps): JSX.Element => {
  const section = sectionPages[sectionId];
  const isInterestsSection = section.id === "interests";
  const prefersReducedMotion = usePrefersReducedMotion();
  const { progress, velocity } = useScrollMotion(1600);
  const isAboutSection = section.id === "about";
  const scrollLabelBySection: Record<SectionId, string> = {
    experience: "View roles",
    projects: "View projects",
    leadership: "View roles",
    interests: "View interests",
    about: "View sections"
  };

  const hero = (
    <div
      className={`mx-auto w-full opacity-92 ${
        isAboutSection ? "max-w-[700px]" : "max-w-[760px]"
      }`}
    >
      <div
        className={
          isAboutSection
            ? "h-[280px] sm:h-[320px] lg:h-[360px]"
            : "h-[260px] sm:h-[300px] lg:h-[340px]"
        }
      >
        <SectionBrainHeader
          sectionId={section.id}
          scrollProgress={progress}
          scrollVelocity={velocity}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>
    </div>
  );

  const intro = isInterestsSection ? (
    <div className="max-w-[70ch] space-y-5">
      <p className="max-w-[68ch] text-[1.03rem] leading-[1.82] text-fg/76 sm:text-[1.1rem]">
        {interestsIntro}
      </p>
      <a
        href="#items"
        aria-label="Scroll to view interests"
        className="inline-flex items-center gap-2 rounded-sm px-0.5 py-1.5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-fg/58 underline decoration-transparent underline-offset-[0.24em] transition-colors duration-150 hover:text-accent hover:decoration-accent/75 focus-visible:outline-none focus-visible:text-accent focus-visible:decoration-accent/75"
      >
        <span aria-hidden="true">↓</span>
        View interests
      </a>
    </div>
  ) : (
    <div className="max-w-[70ch] space-y-5">
      {isAboutSection && (
        <div className="mb-6">
          <div className="h-36 w-36 overflow-hidden rounded-full border border-fg/10 bg-fg/6">
            <img
              src="/images/profile.jpg"
              alt="Profile photo"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}
      <MarkdownContent content={section.intro} />
      <a
        href="#items"
        aria-label={`Scroll to ${scrollLabelBySection[sectionId].toLowerCase()}`}
        className="inline-flex items-center gap-2 rounded-sm px-0.5 py-1.5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-fg/58 underline decoration-transparent underline-offset-[0.24em] transition-colors duration-150 hover:text-accent hover:decoration-accent/75 focus-visible:outline-none focus-visible:text-accent focus-visible:decoration-accent/75"
      >
        <span aria-hidden="true">↓</span>
        {scrollLabelBySection[sectionId]}
      </a>
    </div>
  );

  return (
    <EditorialLayout
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: section.title }
      ]}
      title={section.title}
      hero={hero}
      intro={intro}
      contentId="items"
    >
      {section.id === "projects" ? (
        <div className="space-y-1">
          {projectCaseStudies.map((project) => (
            <ProjectListItem key={project.slug} project={project} />
          ))}
        </div>
      ) : null}

      {section.id === "interests" ? <InterestRows items={interests} /> : null}

      {section.id === "experience" && section.items ? (
        <AccordionList items={section.items} sectionKey="experience" />
      ) : null}

      {section.id === "leadership" && section.items ? (
        <AccordionList items={section.items} sectionKey="leadership" />
      ) : null}

      {section.id === "about" && section.sections ? (
        <div className="space-y-10">
          {section.sections.map((entry) => (
            <section key={entry.id} className="max-w-[72ch] space-y-4">
              {entry.heading ? (
                <h2 className="text-[1.42rem] font-medium tracking-[-0.03em] text-fg sm:text-[1.6rem]">
                  {entry.heading}
                </h2>
              ) : null}
              <MarkdownContent content={entry.body} />
            </section>
          ))}
          <AboutHobbies groups={hobbyGroups} />
        </div>
      ) : null}
    </EditorialLayout>
  );
};
