export type SectionId =
  | "learning"
  | "cognitive"
  | "engagement"
  | "flow"
  | "retention";

export interface SiteConfig {
  name: string;
  tagline: string;
  accentColor: string;
  links: {
    blog: string;
    github: string;
    linkedin: string;
    email: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface SiteContent {
  siteConfig: SiteConfig;
}

// NOTE: Section/page content is sourced from:
// - src/content/sections.ts
// - src/content/projects.ts
// Keep this file focused on global site configuration only.
export const siteContent: SiteContent = {
  siteConfig: {
    name: "",
    tagline: "Building controlled intelligence interfaces for real-world systems.",
    accentColor: "#FF8A1A",
    links: {
      blog: "https://kazumah.substack.com/",
      github: "https://github.com/kazumah1",
      linkedin: "https://linkedin.com/in/kazuma-hakushi",
      email: "kazuh@berkeley.edu"
    },
    seo: {
      title: "Curriculearn",
      description:
        "AI-powered curriculum optimization platform using neural analysis to enhance learning outcomes.",
      keywords: [
        "education",
        "curriculum",
        "learning optimization",
        "AI education",
        "neural analysis",
        "pedagogy"
      ]
    }
  }
};
