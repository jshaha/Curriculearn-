import type { SectionId } from "@/content/siteContent";

export type { SectionId };

export interface EditorialLink {
  label: string;
  href: string;
}

export interface EditorialMedia {
  kind: "image" | "logo" | "video" | "gif" | "none";
  src?: string;
  alt?: string;
  aspect?: "square" | "landscape" | "portrait";
  placeholderText?: string;
  placeholderMonogram?: string;
}

export interface HeroMedia {
  type: "image" | "video" | "gif";
  src: string;
  alt: string;
  poster?: string;
  aspect?: "landscape" | "portrait" | "square" | "ultrawide";
}

export interface EditorialBodySection {
  id: string;
  heading?: string;
  body: string;
  media?: EditorialMedia;
}

export interface CaseStudySection {
  id: string;
  heading: string;
  body: string;
  media?: EditorialMedia;
}

export interface AccordionSections {
  context?: string[];
  whatIBuilt?: string[];
  results?: string[];
}

export interface AccordionMedia {
  type: "image" | "video" | "gif" | "placeholder";
  src?: string;
  alt?: string;
}

export interface AccordionEntry {
  id: string;
  role: string;
  org: string;
  dates: string;
  tags?: string[];
  summary: string;
  body: string[];
  sections?: AccordionSections;
  impactBullets?: string[];
  media?: AccordionMedia;
  links?: EditorialLink[];
  note?: string;
}

export interface SectionPageDefinition {
  id: SectionId;
  title: string;
  route: `/${SectionId}`;
  dek: string;
  chips?: string[];
  intro: string;
  items?: AccordionEntry[];
  sections?: EditorialBodySection[];
}

export interface ProjectCaseStudy {
  slug: string;
  title: string;
  subtitle?: string;
  year?: string;
  dek: string;
  tags: string[];
  media?: EditorialMedia;
  heroMedia: HeroMedia;
  links?: EditorialLink[];
  note?: string;
  sections: CaseStudySection[];
}
