import { AppHeader } from "@/components/app-header"
import { LessonDetailPage } from "@/components/lesson-detail-page"

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>
}) {
  const { id, lessonId } = await params
  return (
    <div className="min-h-svh">
      <AppHeader />
      <LessonDetailPage classId={id} lessonId={lessonId} />
    </div>
  )
}
