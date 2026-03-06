import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import PreferencesForm from "@/components/PreferencesForm"
import Link from "next/link"

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

      <section className="bg-white rounded-3xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900">Co-parents</h2>
        <p className="text-sm text-gray-500 mt-1">
          Add or remove co-parents for your account.
        </p>
        <Link
          href="/dashboard/preferences/co-parents"
          className="mt-4 inline-flex items-center rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-bold text-white hover:bg-yellow-500 transition-colors"
        >
          Manage co-parents
        </Link>
      </section>
    </div>
  )
}
