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
  CLASS_COLORS,
  type ClassColor,
  type ClassRecord,
} from "@/lib/planner-data"
import { cn } from "@/lib/utils"

const COLOR_OPTIONS: ClassColor[] = ["blue", "teal", "amber", "green", "rose"]

type Props = {
  trigger: ReactElement
  /** When provided, the dialog edits this class instead of creating one. */
  editClass?: ClassRecord
}

const empty = {
  name: "",
  subject: "",
  gradeLevel: "",
  room: "",
  period: "",
  studentCount: "",
  color: "blue" as ClassColor,
}

export function ClassFormDialog({ trigger, editClass }: Props) {
  const { addClass, updateClass } = usePlanner()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (open) {
      setForm(
        editClass
          ? {
              name: editClass.name,
              subject: editClass.subject,
              gradeLevel: editClass.gradeLevel,
              room: editClass.room,
              period: editClass.period,
              studentCount: String(editClass.studentCount),
              color: editClass.color,
            }
          : empty,
      )
    }
  }, [open, editClass])

  function handleSubmit() {
    if (!form.name.trim() || !form.subject.trim()) {
      toast.error("Please add a class name and subject.")
      return
    }
    const payload = {
      name: form.name.trim(),
      subject: form.subject.trim(),
      gradeLevel: form.gradeLevel.trim() || "—",
      room: form.room.trim() || "—",
      period: form.period.trim() || "—",
      studentCount: Number(form.studentCount) || 0,
      color: form.color,
    }
    if (editClass) {
      updateClass(editClass.id, payload)
      toast.success("Class updated")
    } else {
      addClass(payload)
      toast.success("Class created")
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editClass ? "Edit class" : "New class"}</DialogTitle>
          <DialogDescription>
            {editClass
              ? "Update the details for this class."
              : "Add a class to your dashboard."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="class-name">Class name</Label>
            <Input
              id="class-name"
              placeholder="e.g. Biology — Period 2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="class-subject">Subject</Label>
              <Input
                id="class-subject"
                placeholder="Biology"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="class-grade">Grade level</Label>
              <Input
                id="class-grade"
                placeholder="Grade 10"
                value={form.gradeLevel}
                onChange={(e) =>
                  setForm({ ...form, gradeLevel: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="class-room">Room</Label>
              <Input
                id="class-room"
                placeholder="204"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="class-period">Period</Label>
              <Input
                id="class-period"
                placeholder="Period 2"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="class-students">Students</Label>
              <Input
                id="class-students"
                type="number"
                min={0}
                placeholder="28"
                value={form.studentCount}
                onChange={(e) =>
                  setForm({ ...form, studentCount: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Select ${c} color`}
                  onClick={() => setForm({ ...form, color: c })}
                  className={cn(
                    "h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition",
                    CLASS_COLORS[c].dot,
                    form.color === c
                      ? "ring-foreground"
                      : "ring-transparent hover:ring-border",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editClass ? "Save changes" : "Create class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
