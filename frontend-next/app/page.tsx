"use client"

import { useEffect, useState } from "react"
import { getClasses, seedDemoClassesIfEmpty, resetToDemo, type ClassRecord } from "@/lib/classes"
import { signOut, supabase } from "@/lib/supabase"
import { openIntro } from "@/components/IntroSlides"
import { api } from "@/lib/api"

export default function HomePage() {
  const [hoveredClass, setHoveredClass] = useState<string | null>(null)
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  // Guests have no account to return to, so signing out would orphan their data.
  const [isGuest, setIsGuest] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsGuest(data.session?.user.is_anonymous ?? true)
    })
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        // Wake up the backend (Render free tier spins down after 15 min inactivity)
        api.wake()
        // Seed a demo set on a brand-new user's first sign-in, otherwise load theirs.
        const list = await seedDemoClassesIfEmpty()
        if (active) setClasses(list)
      } catch (err) {
        console.error("Failed to load classes:", err)
        if (active) {
          try {
            setClasses(await getClasses())
          } catch {
            /* leave empty */
          }
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleReset = async () => {
    if (!window.confirm("Reset everything to a fresh demo? This deletes all your classes and documents.")) return
    setResetting(true)
    try {
      setClasses(await resetToDemo())
    } catch (err) {
      console.error("Reset failed:", err)
    } finally {
      setResetting(false)
    }
  }

  const totalStudents = classes.reduce((acc, c) => acc + (c.students ?? 0), 0)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Subtle grid overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:px-12 sm:py-24">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-6 sm:mb-20 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.26em] text-[#FF8A1A]">Curriculearn</div>
            <h1 className="text-5xl sm:text-7xl font-light mb-4 tracking-tight">Classes</h1>
            <div className="h-px w-32 bg-white/20 mb-4" />
            <p className="max-w-md text-sm text-white/45">
              Upload a lesson to any class. Curriculearn simulates how students process it, finds the weak spots, and rewrites them.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openIntro}
              className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[#FF8A1A] border border-[#FF8A1A]/40 px-4 py-2 transition-colors hover:border-[#FF8A1A]"
            >
              How it works
            </button>
            <button
              onClick={handleReset}
              disabled={resetting || loading}
              className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40 border border-white/10 px-4 py-2 transition-colors hover:text-white/80 hover:border-white/30 disabled:opacity-40"
              title="Delete all your data and restore the demo classes"
            >
              {resetting ? "Resetting…" : "Reset demo"}
            </button>
            {!isGuest && (
            <button
              onClick={() => signOut()}
              className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40 border border-white/10 px-4 py-2 transition-colors hover:text-white/80 hover:border-white/30"
              title="Sign out of your Google account"
            >
              Sign out
            </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="font-mono text-sm text-white/40">Loading classes…</div>
        ) : (
        /* Class Grid */
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {classes.map((classItem) => (
            <a
              key={classItem.id}
              href={`/class/${classItem.id}`}
              onMouseEnter={() => setHoveredClass(classItem.id)}
              onMouseLeave={() => setHoveredClass(null)}
              className="group relative block border border-white/10 hover:border-white/30 transition-all p-6 sm:p-8 bg-black hover:bg-white/[0.02]"
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
        )}

        {/* Footer stats */}
        <div className="mt-24 pt-12 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            <div>
              <div className="text-4xl font-light mb-1">{classes.length}</div>
              <div className="text-sm text-white/40">Total Classes</div>
            </div>
            <div>
              <div className="text-4xl font-light mb-1">
                {totalStudents}
              </div>
              <div className="text-sm text-white/40">Total Students</div>
            </div>
            <div>
              <div className="text-4xl font-light mb-1">
                {classes.length > 0 ? Math.round(totalStudents / classes.length) : 0}
              </div>
              <div className="text-sm text-white/40">Average Class Size</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
