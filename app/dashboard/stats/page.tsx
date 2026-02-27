import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { canViewStats } from "@/lib/stats-access"
import { desc, sql } from "drizzle-orm"

function formatLastLogin(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return "—"
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function DashboardStatsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  if (!canViewStats(session.user.email)) {
    redirect("/dashboard")
  }

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
  const totalUsers = countResult[0]?.count ?? 0

  let userList: { id: string; email: string | null; name: string | null; lastLoginAt: Date | null }[] = []
  try {
    const list = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .orderBy(desc(users.email))
    userList = list
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (
      message.includes("last_login_at") ||
      message.includes("column") ||
      message.includes("does not exist")
    ) {
      // Column not migrated yet: load without lastLoginAt and show "—"
      const list = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .orderBy(desc(users.email))
      userList = list.map((u) => ({ ...u, lastLoginAt: null }))
    } else {
      throw err
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stats</h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Dashboard
        </Link>
      </div>

      <p className="text-gray-600">
        People who have signed up (have an account and can log in).
      </p>

      <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
        <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
        <p className="text-sm text-gray-500">Total users</p>
      </div>

      {userList.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-amber-50/50">
            <h2 className="text-sm font-semibold text-gray-700">
              All users (by email)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Last login</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-4 py-3 text-gray-900">
                      {u.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {u.lastLoginAt
                        ? formatLastLogin(u.lastLoginAt)
                        : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
