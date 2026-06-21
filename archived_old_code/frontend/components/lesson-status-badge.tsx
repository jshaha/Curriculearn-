import { STATUS_LABELS, type LessonStatus } from "@/lib/planner-data"
import { cn } from "@/lib/utils"

const STYLES: Record<LessonStatus, string> = {
  planned: "bg-secondary text-secondary-foreground",
  "in-progress": "bg-chart-3/15 text-chart-3",
  complete: "bg-chart-4/15 text-chart-4",
}

export function LessonStatusBadge({ status }: { status: LessonStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[status],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  )
}
