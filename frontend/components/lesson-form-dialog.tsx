"use client"

import { useEffect, useState, type ReactElement } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePlanner } from "@/components/planner-provider"
import {
  STATUS_LABELS,
  type Lesson,
  type LessonStatus,
} from "@/lib/planner-data"

type Props = {
  trigger: ReactElement
  classId: string
  /** Editing an existing lesson. */
  editLesson?: Lesson
  /** Default date (YYYY-MM-DD) when creating a new lesson. */
  defaultDate?: string
}

function emptyForm(date: string) {
  return {
    title: "",
    date,
    summary: "",
    objectives: "",
    materials: "",
    homework: "",
    status: "planned" as LessonStatus,
  }
}

export function LessonFormDialog({
  trigger,
  classId,
  editLesson,
  defaultDate,
}: Props) {
  const { addLesson, updateLesson, deleteLesson } = usePlanner()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() =>
    emptyForm(defaultDate ?? new Date().toISOString().slice(0, 10)),
  )

  useEffect(() => {
    if (open) {
      setForm(
        editLesson
          ? {
              title: editLesson.title,
              date: editLesson.date,
              summary: editLesson.summary,
              objectives: editLesson.objectives.join("\n"),
              materials: editLesson.materials.join("\n"),
              homework: editLesson.homework,
              status: editLesson.status,
            }
          : emptyForm(defaultDate ?? new Date().toISOString().slice(0, 10)),
      )
    }
  }, [open, editLesson, defaultDate])

  function toList(value: string) {
    return value
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
  }

  function handleSubmit() {
    if (!form.title.trim()) {
      toast.error("Please add a lesson title.")
      return
    }
    if (!form.date) {
      toast.error("Please choose a date.")
      return
    }
    const payload = {
      classId,
      title: form.title.trim(),
      date: form.date,
      summary: form.summary.trim(),
      objectives: toList(form.objectives),
      materials: toList(form.materials),
      homework: form.homework.trim(),
      status: form.status,
    }
    if (editLesson) {
      updateLesson(editLesson.id, payload)
      toast.success("Lesson updated")
    } else {
      addLesson(payload)
      toast.success("Lesson added")
    }
    setOpen(false)
  }

  function handleDelete() {
    if (editLesson) {
      deleteLesson(editLesson.id)
      toast.success("Lesson deleted")
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editLesson ? "Edit lesson" : "New lesson"}
          </DialogTitle>
          <DialogDescription>
            Summarize what students will learn this day.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="lesson-title">Title</Label>
            <Input
              id="lesson-title"
              placeholder="e.g. Cell Structure & Organelles"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="lesson-date">Date</Label>
              <Input
                id="lesson-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lesson-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as LessonStatus })
                }
              >
                <SelectTrigger id="lesson-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(STATUS_LABELS) as LessonStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lesson-summary">Summary</Label>
            <Textarea
              id="lesson-summary"
              rows={3}
              placeholder="A short overview of the day's lesson."
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lesson-objectives">
              Objectives{" "}
              <span className="text-muted-foreground">(one per line)</span>
            </Label>
            <Textarea
              id="lesson-objectives"
              rows={2}
              placeholder={"Identify major organelles\nExplain their functions"}
              value={form.objectives}
              onChange={(e) =>
                setForm({ ...form, objectives: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lesson-materials">
              Materials{" "}
              <span className="text-muted-foreground">(one per line)</span>
            </Label>
            <Textarea
              id="lesson-materials"
              rows={2}
              placeholder={"Microscope slides\nLabeling worksheet"}
              value={form.materials}
              onChange={(e) =>
                setForm({ ...form, materials: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lesson-homework">Homework</Label>
            <Input
              id="lesson-homework"
              placeholder="e.g. Read Ch. 4.1"
              value={form.homework}
              onChange={(e) => setForm({ ...form, homework: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {editLesson ? (
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editLesson ? "Save" : "Add lesson"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
