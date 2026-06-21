"use client"

import { useRef } from "react"
import {
  Presentation,
  FileText,
  Sheet,
  ImageIcon,
  Video,
  Link as LinkIcon,
  File,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { usePlanner } from "@/components/planner-provider"
import {
  RESOURCE_LABELS,
  formatFileSize,
  inferResourceKind,
  type LessonResource,
  type ResourceKind,
} from "@/lib/planner-data"

const KIND_ICONS: Record<ResourceKind, typeof File> = {
  slides: Presentation,
  document: FileText,
  spreadsheet: Sheet,
  image: ImageIcon,
  video: Video,
  link: LinkIcon,
  other: File,
}

export function LessonResources({
  lessonId,
  resources,
}: {
  lessonId: string
  resources: LessonResource[]
}) {
  const { addResource, removeResource } = usePlanner()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    Array.from(fileList).forEach((file) => {
      addResource(lessonId, {
        name: file.name,
        kind: inferResourceKind(file.name),
        size: file.size,
      })
    })
    toast.success(
      fileList.length === 1
        ? "Resource uploaded"
        : `${fileList.length} resources uploaded`,
    )
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <section aria-label="Slides and resources">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Presentation className="h-3.5 w-3.5 text-primary" />
          Slides & resources
        </h4>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {resources.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-5 text-center transition hover:border-primary/40 hover:bg-muted"
        >
          <Upload className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Upload slides or files for the agent to review
          </span>
        </button>
      ) : (
        <ul className="space-y-1.5">
          {resources.map((r) => {
            const Icon = KIND_ICONS[r.kind]
            return (
              <li
                key={r.id}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {r.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {RESOURCE_LABELS[r.kind]}
                    {r.size != null && ` · ${formatFileSize(r.size)}`}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${r.name}`}
                  onClick={() => {
                    removeResource(lessonId, r.id)
                    toast.success("Resource removed")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
