export type SectionId =
  | "experience"
  | "projects"
  | "leadership"
  | "interests"
  | "about";

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
    name: "Kazuma Hakushi",
    tagline: "Building controlled intelligence interfaces for real-world systems.",
    accentColor: "#FF8A1A",
    links: {
      blog: "https://kazumah.substack.com/",
      github: "https://github.com/kazumah1",
      linkedin: "https://linkedin.com/in/kazuma-hakushi",
      email: "kazuh@berkeley.edu"
    },
    seo: {
      title: "Kazuma Hakushi | Portfolio",
      description:
        "Personal portfolio with focused work in engineering, leadership, and deep-tech interface design.",
      keywords: [
        "portfolio",
        "full stack",
        "frontend",
        "three.js",
        "react",
        "engineering"
      ]
    }
  }
};
