import type { ProjectCaseStudy } from "@/content/editorialTypes";

export type { ProjectCaseStudy } from "@/content/editorialTypes";

export const projectCaseStudies: ProjectCaseStudy[] = [
  {
    slug: "brain-to-text",
    title: "Brain-to-Text",
    year: "2025",
    dek:
      "Brain-to-Text is a neural sequence modeling project focused on decoding cortical time-series signals into structured linguistic outputs using RNN-Transducer architectures. The system preprocesses noisy neural signals, extracts temporal features, and trains GRU-based encoders with transducer loss to align neural dynamics with phonetic targets. The project emphasizes temporal alignment, robustness under signal sparsity, and decoding stability rather than benchmark optimization.",
    tags: ["RNN-GRU", "RNN Transducer", "n-gram", "LLM"],
    media: {
      kind: "image",
      src: "/images/brain2text.png",
      alt: "Brain-to-Text system diagram",
      aspect: "landscape"
    },
    heroMedia: {
      type: "image",
      src: "/images/brain2text.png",
      alt: "Brain-to-Text system diagram",
      aspect: "landscape"
    },
    links: [{ label: "GitHub", href: "https://github.com/bealowman/brain-to-text-working" },
	     { label: "Research Poster", href: "/assets/brain-to-text/brain-to-text-poster.pdf" }
    ],
    sections: [
      {
        id: "context",
        heading: "Context",
        body:
          "This project builds on the cortical speech decoding work described in *[An Accurate and Rapidly Calibrating Speech Neuroprosthesis](https://www.nejm.org/doi/full/10.1056/NEJMoa2314132)* by Card et al., 2024. Neural speech signals recorded from intracortical arrays are low signal-to-noise and temporally sparse, and small misalignments significantly degrade decoding accuracy. The original work demonstrated that sequence models can map motor cortex activity to text, but training stability and temporal resolution remain core challenges.\n\nOur goal was not to reproduce the paper directly, but to explore alternative sequence modeling strategies and decoding refinements under similar signal constraints."
      },
      {
        id: "what-i-built",
        heading: "What I built",
        body:
          "I implemented RNN-T architectures with GRU encoders and prediction networks, applied temporal and frequency masking for robustness, and experimented with diphone-level training. I also evaluated neural language model rescoring and lightweight transformer fine-tuning to improve decoding consistency."
      },
      {
        id: "system-design",
        heading: "System design",
        body:
          "The pipeline includes signal normalization, sliding-window feature extraction, sequence-to-sequence training with transducer loss, and beam search decoding. Emphasis was placed on stable training under noisy input."
      },
      {
        id: "tradeoffs",
        heading: "Tradeoffs",
        body:
          "RNN-T improves temporal modeling but increases training instability. Masking and regularization were necessary to prevent overfitting."
      },
      {
        id: "result",
        heading: "Result",
        body:
          "The project reduced decoding error rates from approximately 5% to ~2% under the competition metric and was presented to over 100 members of Neurotech@Berkeley in a technical deep-dive session."
      }
    ]
  },
  {
    slug: "atlas",
    title: "Atlas",
    year: "2025-2026",
    dek:
      "Atlas is a modular research ingestion and retrieval system that continuously pulls papers from arXiv, OpenReview, and Crossref, compiles PDFs into structured section-level artifacts, computes embeddings, and supports hybrid search through Postgres + pgvector. The system separates ingestion, processing, and ranking so retrieval logic can evolve independently of indexing, and uses content hashing and embedding versioning to maintain reproducibility. Atlas focuses on infrastructure integrity - idempotent pipelines, hybrid (vector + keyword) retrieval, and personalized ranking driven by interaction signals - rather than shallow document indexing.",
    tags: ["FastAPI", "PostgreSQL", "pgvector", "Redis"],
    media: {
      kind: "image",
      src: "/images/atlas.png",
      alt: "Atlas interface",
      aspect: "landscape"
    },
    heroMedia: {
      type: "image",
      src: "/images/atlas.png",
      alt: "Atlas interface",
      aspect: "landscape"
    },
    links: [{ label: "GitHub", href: "https://github.com/kazumah1/atlas" }],
    sections: [
      {
        id: "context",
        heading: "Context",
        body:
          "I wanted a system that could generate a personalized research feed without flattening papers into keyword blobs. Academic documents contain structure, citation relationships, and dense semantics that most feeds ignore."
      },
      {
        id: "what-i-built",
        heading: "What I built",
        body:
          "Atlas ingests raw PDFs into object storage, extracts structured text and figures, splits content by section, and inserts both vector embeddings and tsvector indexes into Postgres. Search combines symbolic filters (author, venue, year) with semantic similarity, and ranking incorporates recency and topic affinity."
      },
      {
        id: "system-design",
        heading: "System design",
        body:
          "The system runs on Postgres + pgvector with Redis for job orchestration. Embeddings are versioned and tied to content hashes to support safe reprocessing. Ranking is decoupled from ingestion, allowing experimentation without reindexing the corpus."
      },
      {
        id: "tradeoffs",
        heading: "Tradeoffs",
        body:
          "Granular embeddings improve retrieval quality but increase ingestion cost. I prioritized structural coherence and ranking flexibility over indexing speed."
      }
    ]
  },
  {
    slug: "wingman",
    title: "Wingman",
    year: "2025",
    dek:
      "Wingman is an AR-based teleoperation system built on Snap Spectacles that enables remote robot navigation and arm control through a real-time HUD connected to a FastAPI backend over REST and WebSocket. The system integrates depth-aware spatial overlays with low-latency command routing, maintaining synchronization between the wearable interface and the robot's physical state. Designed and deployed at CalHacks, Wingman prioritizes real-time coherence and reliable action routing over feature density.",
    tags: ["XR", "FastAPI", "WebSocket", "Robotics"],
    media: {
      kind: "image",
      src: "/images/wingman.png",
      alt: "Wingman project visual",
      aspect: "landscape"
    },
    heroMedia: {
      type: "image",
      src: "/images/wingman.png",
      alt: "Wingman project visual",
      aspect: "landscape"
    },
    links: [{ label: "Devpost", href: "https://devpost.com/software/wingman-9xok8b" }],
    sections: [
      {
        id: "context",
        heading: "Context",
        body:
          "Teleoperation systems often separate perception, command routing, and visualization into disconnected flows, leading to latency and operator confusion."
      },
      {
        id: "what-i-built",
        heading: "What I built",
        body:
          "I implemented a Spectacles-based heads-up display connected to a FastAPI control plane. The backend routes commands to the robot controller while maintaining real-time state updates. A depth processing pipeline converts robot-camera images into spatial overlays for AR visualization."
      },
      {
        id: "system-design",
        heading: "System design",
        body:
          "Communication runs over WebSocket for state synchronization and REST for deterministic command execution. The interface was intentionally constrained to reduce cognitive load during live control."
      },
      {
        id: "tradeoffs",
        heading: "Tradeoffs",
        body:
          "Balancing visual richness with latency was critical. The interface favors clarity and responsiveness over visual complexity."
      },
      {
        id: "result",
        heading: "Result",
        body:
          "Wingman won 3rd Place (Best Robotics Hack) and Honorable Mention (Best Use of Snap Spectacles) at CalHacks 12.0 among 45 teams. The system was demoed live in 15+ sessions with sustained 20-minute teleoperation runs."
      }
    ]
  },
  {
    slug: "live-label",
    title: "LiveLabel",
    year: "2025-2026",
    dek:
      "LiveLabel is a fully local, real-time computer vision system combining YOLO-based object detection, SAM-based segmentation, multi-object tracking, and motion detection pipelines running at 15-30 FPS. The system integrates asynchronous frame processing with IoU-based tracking and optional local VLM interpretation via Ollama. It is designed to operate without cloud dependency, emphasizing low-latency inference and controllable state transitions.",
    tags: ["OpenCV", "YOLO", "SAM", "Local LLM"],
    media: {
      kind: "video",
      src: "/videos/live-label.mp4",
      alt: "LiveLabel Demo",
      aspect: "landscape"
    },
    heroMedia: {
      type: "video",
      src: "/videos/live-label.mp4",
      alt: "LiveLabel Demo",
      aspect: "landscape"
    },
    links: [{ label: "GitHub", href: "https://github.com/kazumah1/live-label" }],
    sections: [
      {
        id: "context",
        heading: "Context",
        body:
          "Many computer vision systems rely on cloud APIs or struggle with consistent multi-object tracking under real-time constraints."
      },
      {
        id: "what-i-built",
        heading: "What I built",
        body:
          "The system supports dual detection modes, asynchronous frame handling, IoU-based object tracking, and three motion detection strategies (MOG2, KNN background subtraction, and structural similarity). A local language model can interpret scene outputs in real time."
      },
      {
        id: "system-design",
        heading: "System design",
        body:
          "The architecture decouples detection, tracking, and interpretation. Frame processing runs asynchronously to maintain FPS stability, while tracking maintains consistent object identities across frames."
      },
      {
        id: "tradeoffs",
        heading: "Tradeoffs",
        body:
          "Higher model accuracy reduces FPS. The system targets a stable balance between detection quality and real-time responsiveness."
      }
    ]
  },
  {
    slug: "coffy",
    title: "Coffy",
    year: "2025",
    dek:
      "Coffy is a single-agent, tool-based scheduling application built with React Native and FastAPI that coordinates calendar availability and SMS negotiation through structured LLM tool calls. It integrates the Google Calendar API and SignalWire messaging to parse natural-language scheduling requests, reconcile availability across participants, and autonomously propose or finalize meeting times. The system constrains LLM behavior through explicit tool invocation to preserve deterministic state transitions and auditability.",
    tags: ["React Native", "FastAPI", "Supabase", "LLM Agent"],
    media: {
      kind: "image",
      src: "/images/coffy.png",
      alt: "Coffy project visual",
      aspect: "landscape"
    },
    heroMedia: {
      type: "image",
      src: "/images/coffy.png",
      alt: "Coffy project visual",
      aspect: "landscape"
    },
    links: [{ label: "GitHub", href: "https://github.com/kazumah1/coffy" }],
    sections: [
      {
        id: "context",
        heading: "Context",
        body:
          "Human scheduling requires reconciling preferences, calendar constraints, and asynchronous communication. Most tools fragment this process across platforms."
      },
      {
        id: "what-i-built",
        heading: "What I built",
        body:
          "Coffy parses scheduling intent, checks availability via Google Calendar, communicates with invitees via SMS, and proposes time slots automatically. The LLM operates through structured tools rather than freeform planning to maintain predictable execution."
      },
      {
        id: "system-design",
        heading: "System design",
        body:
          "The backend enforces deterministic scheduling logic while the LLM handles intent extraction. Supabase stores persistent state, and external APIs handle calendar synchronization and messaging."
      },
      {
        id: "tradeoffs",
        heading: "Tradeoffs",
        body:
          "Allowing fully autonomous LLM planning increases unpredictability. Constraining the agent through tool-based architecture preserves reliability while retaining flexibility."
      },
      {
        id: "result",
        heading: "Result",
        body:
          "Coffy successfully scheduled 30+ real-world events across users using automated calendar reconciliation and SMS coordination, validating the reliability of its tool-based agent architecture."
      }
    ]
  }
];

export const projectSlugs = projectCaseStudies.map((project) => ({ slug: project.slug }));

export const getProjectBySlug = (slug: string): ProjectCaseStudy | null =>
  projectCaseStudies.find((project) => project.slug === slug) ?? null;
