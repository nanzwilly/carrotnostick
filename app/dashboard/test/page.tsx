import { getChildrenForParent } from "@/app/actions/children"
import Link from "next/link"
import DashboardTestView from "@/components/DashboardTestView"
import { redirect } from "next/navigation"

/**
 * Test dashboard page — Stitch-inspired design.
 * Main dashboard is unchanged at /dashboard.
 */
export default async function DashboardTestPage() {
  if (process.env.NODE_ENV !== "development") redirect("/dashboard")
  const childrenWithGoals = await getChildrenForParent()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to main dashboard
        </Link>
        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">
          Test design
        </span>
      </div>
      <DashboardTestView
        childrenWithGoals={childrenWithGoals}
        baseUrl={process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
      />
    </div>
  )
}
