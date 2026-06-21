"use client"

import { use } from "react"

type Assignment = {
  id: string
  title: string
  dueDate: string
  status: "active" | "upcoming" | "completed"
}

const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: "1", title: "Neural Networks: Backpropagation Analysis", dueDate: "2026-06-25", status: "active" },
  { id: "2", title: "Memory Systems Reading Response", dueDate: "2026-06-22", status: "completed" },
  { id: "3", title: "Cognitive Load Theory Paper", dueDate: "2026-06-28", status: "upcoming" },
  { id: "4", title: "Lab Report: Working Memory Experiment", dueDate: "2026-07-02", status: "upcoming" },
]

const CLASS_NAMES: Record<string, string> = {
  "1": "Cognitive Science",
  "2": "AP Psychology",
  "3": "Neuroscience Lab",
  "4": "Behavioral Economics",
  "5": "Memory & Learning",
  "6": "Advanced Psychology",
}

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const className = CLASS_NAMES[id] || "Class"

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Subtle grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-12 py-24">
        {/* Back link */}
        <a href="/teacher-class" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors mb-12">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Classes
        </a>

        {/* Header */}
        <div className="mb-20">
          <h1 className="text-7xl font-light mb-4 tracking-tight">{className}</h1>
          <div className="h-px w-32 bg-white/20" />
        </div>

        {/* Assignments List */}
        <div className="space-y-8">
          <h2 className="text-2xl font-light mb-6">Assignments</h2>

          <div className="space-y-4">
            {MOCK_ASSIGNMENTS.map((assignment) => (
              <div
                key={assignment.id}
                className="group border border-white/10 hover:border-white/30 transition-all p-6 bg-black hover:bg-white/[0.02]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-light mb-2">{assignment.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-white/40">
                      <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      <span className="font-mono text-xs">
                        {assignment.status === "active" && "Active"}
                        {assignment.status === "upcoming" && "Upcoming"}
                        {assignment.status === "completed" && "Completed"}
                      </span>
                    </div>
                  </div>

                  <div className={`w-2 h-2 rounded-full ${
                    assignment.status === "active" ? "bg-white" :
                    assignment.status === "upcoming" ? "bg-white/40" :
                    "bg-white/20"
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
