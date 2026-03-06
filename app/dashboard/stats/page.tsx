import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { users, children, goals } from "@/lib/schema"
import { canViewStats } from "@/lib/stats-access"
import { desc, eq, ilike, sql } from "drizzle-orm"
import bcrypt from "bcryptjs"

function formatLastLogin(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return "-"
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
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

export default async function DashboardStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; reset?: string; target?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  if (!canViewStats(session.user.email)) {
    redirect("/dashboard")
  }

  const { q, reset, target } = await searchParams
  const emailQuery = (q ?? "").trim()
  const emailFilter = emailQuery ? ilike(users.email, `%${emailQuery}%`) : undefined

  async function resetPasswordAction(formData: FormData) {
    "use server"

    const session = await auth()
    if (!session?.user || !canViewStats(session.user.email)) {
      redirect("/dashboard")
    }

    const userId = (formData.get("userId") as string | null)?.trim()
    const userEmail = (formData.get("userEmail") as string | null)?.trim() ?? ""
    const newPassword = formData.get("newPassword") as string
    const currentQ = (formData.get("q") as string | null)?.trim() ?? ""

    const nextParams = new URLSearchParams()
    if (currentQ) nextParams.set("q", currentQ)
    if (userEmail) nextParams.set("target", userEmail)

    if (!userId || !newPassword || newPassword.length < 8) {
      nextParams.set("reset", "error")
      redirect(`/dashboard/stats?${nextParams.toString()}`)
    }

    try {
      const hash = await bcrypt.hash(newPassword, 12)
      try {
        await db.update(users).set({ password: hash }).where(eq(users.id, userId))
      } catch (err) {
        const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()
        if (
          message.includes("password") &&
          message.includes("column") &&
          (message.includes("does not exist") || message.includes("unknown"))
        ) {
          await db.execute(sql.raw('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "password" text;'))
          await db.update(users).set({ password: hash }).where(eq(users.id, userId))
        } else {
          throw err
        }
      }
      nextParams.set("reset", "ok")
      redirect(`/dashboard/stats?${nextParams.toString()}`)
    } catch {
      nextParams.set("reset", "error")
      redirect(`/dashboard/stats?${nextParams.toString()}`)
    }
  }

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
  const totalUsers = countResult[0]?.count ?? 0

  const childCounts = await db
    .select({
      parentId: children.parentId,
      count: sql<number>`count(*)::int`,
    })
    .from(children)
    .groupBy(children.parentId)
  const childCountByParent = Object.fromEntries(childCounts.map((r) => [r.parentId, r.count]))

  const goalCounts = await db
    .select({
      parentId: children.parentId,
      count: sql<number>`count(*)::int`,
    })
    .from(goals)
    .innerJoin(children, eq(goals.childId, children.id))
    .groupBy(children.parentId)
  const goalCountByParent = Object.fromEntries(goalCounts.map((r) => [r.parentId, r.count]))

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
      .where(emailFilter)
      .orderBy(desc(users.email))
    userList = list
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes("last_login_at") || message.includes("column") || message.includes("does not exist")) {
      const list = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(emailFilter)
        .orderBy(desc(users.email))
      userList = list.map((u) => ({ ...u, lastLoginAt: null }))
    } else {
      throw err
    }
  }

  return (
    <div className="space-y-6 xl:w-[72rem] xl:max-w-none xl:relative xl:left-1/2 xl:-translate-x-1/2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stats</h1>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          {"<- Dashboard"}
        </Link>
      </div>

      <p className="text-gray-600">
        People who have signed up (have an account and can log in). &quot;Activated&quot; = created at least one child.
      </p>

      {reset === "ok" && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Password reset saved{target ? ` for ${target}` : ""}.
        </div>
      )}
      {reset === "error" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not reset password{target ? ` for ${target}` : ""}. Try again.
        </div>
      )}

      <form className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm flex flex-col sm:flex-row gap-2 sm:items-center">
        <label htmlFor="email-search" className="text-sm text-gray-600 sm:w-36">
          Find by email
        </label>
        <input
          id="email-search"
          name="q"
          defaultValue={emailQuery}
          placeholder="nancy@tagbeansdigital.com"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl px-4 py-2"
        >
          Search
        </button>
        {emailQuery && (
          <Link href="/dashboard/stats" className="text-sm text-gray-500 hover:text-gray-700 px-2 py-2">
            Clear
          </Link>
        )}
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
          <p className="text-sm text-gray-500">Total users</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
          <p className="text-3xl font-bold text-gray-900">{Object.keys(childCountByParent).length}</p>
          <p className="text-sm text-gray-500">Activated (&gt;=1 child)</p>
        </div>
      </div>

      {userList.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-amber-50/50">
            <h2 className="text-sm font-semibold text-gray-700">All users (by email)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Children</th>
                  <th className="px-3 py-3 font-medium">Goals</th>
                  <th className="px-3 py-3 font-medium">Last login</th>
                  <th className="px-3 py-3 font-medium min-w-[180px]">Reset password</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-3 text-gray-900">{u.name ?? "-"}</td>
                    <td className="px-3 py-3 text-gray-600 break-all">{u.email ?? "-"}</td>
                    <td className="px-3 py-3 text-gray-600">{childCountByParent[u.id] ?? 0}</td>
                    <td className="px-3 py-3 text-gray-600">{goalCountByParent[u.id] ?? 0}</td>
                    <td className="px-3 py-3 text-gray-500">{u.lastLoginAt ? formatLastLogin(u.lastLoginAt) : "Never"}</td>
                    <td className="px-3 py-3 text-gray-600">
                      {u.email ? (
                        <form action={resetPasswordAction} className="flex items-center gap-1.5">
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="userEmail" value={u.email} />
                          <input type="hidden" name="q" value={emailQuery} />
                          <input
                            type="password"
                            name="newPassword"
                            required
                            minLength={8}
                            placeholder="Temp pass"
                            className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-xs"
                          />
                          <button
                            type="submit"
                            className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg px-2 py-1 whitespace-nowrap"
                          >
                            Save
                          </button>
                        </form>
                      ) : (
                        "-"
                      )}
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
