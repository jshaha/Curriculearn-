import type {
  AccordionEntry,
  EditorialBodySection,
  SectionId,
  SectionPageDefinition
} from "@/content/editorialTypes";

export type {
  AccordionEntry,
  AccordionMedia,
  AccordionSections,
  CaseStudySection,
  EditorialBodySection,
  EditorialLink,
  EditorialMedia,
  HeroMedia,
  ProjectCaseStudy,
  SectionId,
  SectionPageDefinition
} from "@/content/editorialTypes";

export const sectionPageOrder: SectionId[] = [
  "experience",
  "projects",
  "leadership",
  "interests",
  "about"
];

const experienceItems: AccordionEntry[] = [
  {
    id: "exp-qualcomm",
    role: "Technical Project Manager Intern (Contracted)",
    org: "Qualcomm",
    dates: "2025 - Present",
    tags: [
      "Python",
      "TypeScript",
      "FAISS",
      "FastMCP",
      "RAG pipelines",
      "LLM inference optimization",
      "Memory profiling",
      "Tool integration",
      "Cross-platform runtime design",
      "Vector indexing",
      "On-device deployment"
    ],
    summary:
      "Built a cross-platform runtime interface for on-device LLM agents across Snapdragon X Elite, Mac, and Windows. Improved inference performance and memory efficiency while integrating retrieval and tool-calling capabilities into a compact, deployable pipeline.",
    body: [],
    sections: {
      whatIBuilt: [
        "- Achieved ~60% faster inference and ~20% lower RAM usage than Ollama with 32K token support",
        "- Built a RAG + MCP pipeline using FAISS and FastMCP",
        "- Managed 3M x 768-dim vectors under 16GB RAM",
        "- Integrated 15+ Microsoft 365 tools into a unified agent interface"
      ]
    },
    media: {
      type: "image",
      src: "/images/qualcomm.png",
      alt: "Qualcomm logo"
    },
    links: []
  },
  {
    id: "exp-demind",
    role: "Machine Learning Software Engineering Intern",
    org: "DeMind",
    dates: "2025",
    tags: [
      "Python",
      "Signal processing",
      "EEG pipelines",
      "Time-series modeling",
      "Regression",
      "Feature engineering",
      "Adaptive baselines",
      "Real-time systems",
      "Model calibration",
      "Wearable data integration"
    ],
    summary:
      "Built real-time stress prediction systems from biometric and EEG streams, focusing on adaptive baselines and personalization under noisy physiological data.",
    body: [
      "The core challenge was that physiological signals are non-stationary. Baseline heart rate, HRV, and EEG band power drift over time and vary across individuals. A static threshold model was not viable."
    ],
    sections: {
      whatIBuilt: [
        "- Designed a preprocessing pipeline that included signal smoothing, artifact rejection, bandpower extraction (alpha, beta, gamma), HRV feature engineering, and sliding-window aggregation for time-series modeling.",
        "- Implemented two adaptive baseline strategies:",
        "- Rolling-window normalization with decay weighting",
        "- Context-aware baselines conditioned on time-of-day and recent activity state",
        "- Built regression models for stress scoring and calibrated outputs against commercial wearables including IDUN Guardian EEG, Garmin HRV metrics, Fitbit stress indicators, and Apple Watch heart-rate derived signals.",
        "- Optimized inference for real-time scoring under live data streams and validated alignment across devices for over 100 active users."
      ]
    },
    media: {
      type: "image",
      src: "/images/demind.jpeg",
      alt: "DeMind logo"
    },
    links: []
  },
  {
    id: "exp-xiberlinc",
    role: "Software Engineering Intern",
    org: "Xiberlinc",
    dates: "2025",
    tags: [
      "Python",
      "Parselmouth",
      "Audio signal processing",
      "Feature extraction",
      "Dataset construction",
      "Runtime benchmarking",
      "ML preprocessing pipelines",
      "Time-series feature engineering"
    ],
    summary:
      "Constructed structured datasets from large-scale voice recordings for downstream EEG prediction research. Focused on runtime tradeoffs and feature quality across audio processing libraries.",
    body: [],
    sections: {
      whatIBuilt: [
        "- Processed 15,000+ seconds of audio",
        "- Benchmarked feature extraction methods across runtime and predictive utility",
        "- Achieved real-time factor ~0.5 in audio feature extraction"
      ]
    },
    media: {
      type: "image",
      src: "/images/xiberlinc.jpeg",
      alt: "Xiberlinc logo"
    },
    links: []
  }
];

const leadershipItems: AccordionEntry[] = [
  {
    id: "lead-valley-project-lead",
    role: "Project Lead",
    org: "Valley Consulting Group",
    dates: "2025 - Present",
    tags: [
      "System design",
      "LLM agents",
      "Finance data modeling",
      "Architecture reviews",
      "Decision logs",
      "Technical leadership",
      "Project scoping",
      "Risk framing",
      "Cross-team coordination"
    ],
    summary:
      "Led a 10-person engineering team delivering an AI-powered financial intelligence strategy and LLM agent for a Fortune 500 / Big Tech client. Focused on scoping, system design, and decision quality rather than process overhead.",
    body: [],
    sections: {
      results: [
        "- Defined architecture and milestone structure",
        "- Translated finance workflows into grounded LLM capabilities",
        "- Established reusable design review patterns",
        "- Reduced late-stage architectural reversals"
      ]
    },
    media: {
      type: "image",
      src: "/images/valley.png",
      alt: "Valley Consulting Group logo"
    },
    links: []
  },
  {
    id: "lead-neurotech-software-lead",
    role: "Software Division Lead",
    org: "Neurotech@Berkeley",
    dates: "2025 - Present",
    tags: [
      "EEG modeling",
      "Signal processing",
      "Experimental design",
      "Neural decoding",
      "Evaluation pipelines",
      "Team mentorship",
      "ML code review",
      "Research coordination"
    ],
    summary:
      "Led two non-invasive neurotechnology projects in EEG-based gait intent decoding and neural language decoding. Focused on experimental scope, modeling constraints, and execution quality.",
    body: [],
    sections: {
      results: [
        "- Defined model targets and evaluation pipelines",
        "- Contributed core ML and signal-processing code",
        "- Scaled recruiting, onboarding, and mentorship processes",
        "- Increased technical depth and delivery consistency across teams"
      ]
    },
    media: {
      type: "image",
      src: "/images/neurotech.jpeg",
      alt: "Neurotech@Berkeley logo"
    },
    links: []
  }
];

const aboutSections: EditorialBodySection[] = [
  {
    id: "about-thesis",
    heading: "What I optimize for",
    body: `I optimize for systems that remain understandable over time.

That usually means explicit state transitions instead of hidden side effects, typed boundaries between components, and interfaces that reflect system truth rather than masking it. I prefer architectures where the UI and backend share a consistent event model. When state and timing are first-class concepts, teams debug faster and users make better decisions.`
  },
  {
    id: "about-collaboration",
    heading: "How I work",
    body: `I work best where ownership is clear and technical arguments are concrete. I tend to write down intent before implementation, surface tradeoffs early, and keep decisions traceable across system boundaries.

I value short feedback loops. I would rather ship a constrained, testable version early than debate abstractions in isolation.`
  },
  {
    id: "about-links",
    heading: "Where to find me",
    body: `GitHub, LinkedIn, and email are the easiest ways to reach me.

I am especially interested in work that involves:

- Complex systems with real operational consequences
- Interfaces that influence decision quality
- Human-AI interaction where oversight still matters`
  }
];

export const sectionPages: Record<SectionId, SectionPageDefinition> = {
  experience: {
    id: "experience",
    title: "Experience",
    route: "/experience",
    dek:
      "Applied software engineering across LLM systems, signal pipelines, and runtime interface design.",
    chips: ["ML Systems", "Signal Processing", "Runtime Interfaces"],
    intro:
      "I work on systems where reliability, runtime performance, and interpretation quality all matter at the same time.",
    items: experienceItems
  },
  projects: {
    id: "projects",
    title: "Projects",
    route: "/projects",
    dek:
      "Selected builds across neural decoding, retrieval systems, AR robotics, and local multimodal agents.",
    chips: ["Full-Stack", "ML Systems", "Interactive Tools"],
    intro:
      "These projects are where I test ideas quickly, then tighten them into usable systems with clear tradeoffs and measurable behavior."
  },
  leadership: {
    id: "leadership",
    title: "Leadership",
    route: "/leadership",
    dek:
      "Technical leadership focused on system clarity, execution quality, and decision accountability.",
    chips: ["Project Leadership", "Architecture", "Mentorship"],
    intro:
      "I focus leadership effort on reducing ambiguity and improving decision quality so teams can move faster with fewer reversals.",
    items: leadershipItems
  },
  interests: {
    id: "interests",
    title: "Interests",
    route: "/interests",
    dek:
      "Intellectual themes I return to when designing systems, interfaces, and human-AI workflows.",
    chips: ["Decision Quality", "Legibility", "Human-AI"],
    intro:
      "These are the intellectual threads I return to across product work and systems design: recurring lenses that shape how I frame problems, scope tradeoffs, and evaluate interface decisions."
  },
  about: {
    id: "about",
    title: "About",
    route: "/about",
    dek:
      "Computer Science + Neuroscience perspective on software systems, interfaces, and decision-making under constraints.",
    chips: ["System Clarity", "Human Factors", "Maintainability"],
    intro:
      "I'm an undergraduate at UC Berkeley studying Computer Science and Neuroscience (GPA 3.9).\n\nI build software that stays coherent as systems get more complex. Most of my work sits at the boundary between system behavior and human interpretation - where state, timing, and decision-making all matter at once.\n\nComputer science trained me to design and reason about large systems. Neuroscience sharpened my interest in how people process information under constraints. Together, they shape how I think of interfaces as visuals and cognitive environments.\n\nComplexity is not the problem. Unclear state and weak feedback loops are.",
    sections: aboutSections
  }
};

export interface SectionMeta {
  id: SectionId;
  title: string;
  dek: string;
}

export const sectionMeta: ReadonlyArray<SectionMeta> = sectionPageOrder.map(
  (sectionId) => ({
    id: sectionId,
    title: sectionPages[sectionId].title,
    dek: sectionPages[sectionId].dek
  })
);

export const isSectionId = (value: string): value is SectionId =>
  sectionPageOrder.includes(value as SectionId);
