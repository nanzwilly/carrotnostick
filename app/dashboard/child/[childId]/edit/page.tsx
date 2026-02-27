import { redirect } from "next/navigation"
import { getChildForEdit } from "@/app/actions/children"
import EditChildProfileForm from "./EditChildProfileForm"
import Link from "next/link"

export default async function EditChildProfilePage({
  params,
}: {
  params: Promise<{ childId: string }>
}) {
  const { childId } = await params
  const child = await getChildForEdit(childId)
  if (!child) redirect("/dashboard")

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit profile</h1>
      <EditChildProfileForm childId={child.id} initialName={child.name} initialColor={child.color} />
    </div>
  )
}
