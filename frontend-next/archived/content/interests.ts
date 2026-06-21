export type Interest = {
  id: string;
  title: string;
  description: string;
  tags?: string[];
};

export const interestsIntro =
  "These are the intellectual threads I return to across product work and systems design: recurring lenses that shape how I frame problems, scope tradeoffs, and evaluate interface decisions.";

export const interests: Interest[] = [
  {
    id: "interest-systems-grounded-in-physics",
    title: "Systems grounded in physics",
    description:
      "I'm interested in systems that are constrained by physical reality - latency, bandwidth, energy, signal noise. I prefer models that acknowledge these constraints rather than abstracting them away.",
    tags: [
      "physical constraints",
      "signal modeling",
      "latency",
      "energy systems",
      "real-world modeling"
    ]
  },
  {
    id: "interest-world-models-and-perception",
    title: "World models and perception",
    description:
      "I'm interested in how systems - biological or artificial - build internal models of the world from partial observations. This includes perception pipelines, state estimation, and representation learning.",
    tags: [
      "world models",
      "state estimation",
      "representation learning",
      "sensor fusion",
      "perception systems"
    ]
  },
  {
    id: "interest-decision-making-and-learning",
    title: "Decision making and learning",
    description:
      "My neuroscience background drives questions around how decisions emerge from noisy inputs, how learning reshapes internal representations, and how behavior stabilizes under feedback.\n\nI'm especially interested in reinforcement learning, credit assignment, and how biological systems manage stability despite continuous adaptation.",
    tags: [
      "decision theory",
      "reinforcement learning",
      "credit assignment",
      "neural dynamics",
      "behavior modeling"
    ]
  },
  {
    id: "interest-energy-efficiency-of-intelligence",
    title: "Energy efficiency of intelligence",
    description:
      "The human brain runs on ~20 watts while supporting perception, reasoning, and motor control. That constraint matters.\n\nI'm interested in how energy efficiency shapes computation - both in biological systems and in on-device AI.",
    tags: [
      "energy-efficient computing",
      "neuromorphic ideas",
      "on-device AI",
      "computational efficiency",
      "brain metabolism"
    ]
  },
  {
    id: "interest-human-ai-interaction",
    title: "Human-AI interaction",
    description:
      "As models grow more capable, interface design becomes a systems problem. I care about keeping oversight meaningful - through confidence signaling, reversibility, and structural constraints.",
    tags: [
      "human-in-the-loop",
      "model transparency",
      "tool-based agents",
      "confidence estimation",
      "auditability"
    ]
  }
];
