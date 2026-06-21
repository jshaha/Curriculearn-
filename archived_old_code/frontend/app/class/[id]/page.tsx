import { AppHeader } from "@/components/app-header"
import { ClassDetail } from "@/components/class-detail"

export default async function ClassPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="min-h-svh">
      <AppHeader />
      <ClassDetail classId={id} />
    </div>
  )
}
