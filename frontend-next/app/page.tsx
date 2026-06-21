"use client"

import { useState } from "react"

type Class = {
  id: string
  name: string
  period: string
  students: number
  room: string
  schedule: string
}

const MOCK_CLASSES: Class[] = [
  { id: "1", name: "Cognitive Science", period: "Period 1", students: 28, room: "Lab 204", schedule: "Mon/Wed/Fri 9:00 AM" },
  { id: "2", name: "AP Psychology", period: "Period 2", students: 24, room: "Room 312", schedule: "Tue/Thu 10:30 AM" },
  { id: "3", name: "Neuroscience Lab", period: "Period 3", students: 16, room: "Lab 201", schedule: "Mon/Wed 1:00 PM" },
  { id: "4", name: "Behavioral Economics", period: "Period 4", students: 22, room: "Room 405", schedule: "Tue/Thu 2:30 PM" },
  { id: "5", name: "Memory & Learning", period: "Period 5", students: 19, room: "Room 308", schedule: "Mon/Wed/Fri 11:00 AM" },
  { id: "6", name: "Advanced Psychology", period: "Period 6", students: 26, room: "Room 410", schedule: "Tue/Thu 4:00 PM" },
]

export default function HomePage() {
  const [hoveredClass, setHoveredClass] = useState<string | null>(null)

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
        {/* Header */}
        <div className="mb-20">
          <h1 className="text-7xl font-light mb-4 tracking-tight">Classes</h1>
          <div className="h-px w-32 bg-white/20" />
        </div>

        {/* Class Grid */}
        <div className="grid grid-cols-2 gap-6">
          {MOCK_CLASSES.map((classItem) => (
            <a
              key={classItem.id}
              href={`/class/${classItem.id}`}
              onMouseEnter={() => setHoveredClass(classItem.id)}
              onMouseLeave={() => setHoveredClass(null)}
              className="group relative block border border-white/10 hover:border-white/30 transition-all p-8 bg-black hover:bg-white/[0.02]"
            >
              {/* Hover accent line */}
              <div className={`absolute left-0 top-0 bottom-0 w-px bg-white transition-opacity ${hoveredClass === classItem.id ? 'opacity-100' : 'opacity-0'}`} />

              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <h2 className="text-3xl font-light tracking-tight">
                      {classItem.name}
                    </h2>
                    <span className="text-sm text-white/40 font-mono">{classItem.period}</span>
                  </div>
                  <div className="h-px bg-white/10 group-hover:bg-white/20 transition-colors" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">Students</span>
                    <span className="font-mono text-white/60">{classItem.students}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">Room</span>
                    <span className="font-mono text-white/60">{classItem.room}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/40">Schedule</span>
                    <span className="font-mono text-white/60 text-xs">{classItem.schedule}</span>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-white/60">View class</span>
                  <svg className="w-3 h-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Footer stats */}
        <div className="mt-24 pt-12 border-t border-white/10">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-light mb-1">{MOCK_CLASSES.length}</div>
              <div className="text-sm text-white/40">Total Classes</div>
            </div>
            <div>
              <div className="text-4xl font-light mb-1">
                {MOCK_CLASSES.reduce((acc, c) => acc + c.students, 0)}
              </div>
              <div className="text-sm text-white/40">Total Students</div>
            </div>
            <div>
              <div className="text-4xl font-light mb-1">
                {Math.round(MOCK_CLASSES.reduce((acc, c) => acc + c.students, 0) / MOCK_CLASSES.length)}
              </div>
              <div className="text-sm text-white/40">Average Class Size</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
