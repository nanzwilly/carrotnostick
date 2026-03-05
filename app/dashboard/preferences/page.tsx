import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import PreferencesForm from "@/components/PreferencesForm"

export default async function PreferencesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // Check if the user has a password (email/password account vs OAuth-only)
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { password: true },
  })

  const hasPassword = !!user?.password

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Preferences</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings</p>
      </div>
      <PreferencesForm
        currentName={session.user.name ?? ""}
        currentEmail={session.user.email ?? ""}
        hasPassword={hasPassword}
      />
    </div>
  )
}
