import Link from "next/link"
import { GraduationCap } from "lucide-react"
import type { ReactNode } from "react"

export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <span className="block text-sm font-semibold tracking-tight">
              Plana
            </span>
            <span className="block text-xs text-muted-foreground">
              Lesson Planner
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </header>
  )
}
