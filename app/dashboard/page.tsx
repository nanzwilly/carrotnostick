import { getChildrenForParent, getPendingRequests } from "@/app/actions/children"
import Link from "next/link"
import GoalCard from "@/components/GoalCard"
import CopyLinkButton from "@/components/CopyLinkButton"
import NudgeCard from "@/components/NudgeCard"
import InviteButton from "@/components/InviteButton"
import AvatarDisplay from "@/components/AvatarDisplay"
import ChangeChildPinButton from "@/components/ChangeChildPinButton"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>
}) {
  const { invite } = await searchParams
  const [childrenWithGoals, pendingRequests] = await Promise.all([
    getChildrenForParent(),
    getPendingRequests(),
  ])

  return (
    <div className="space-y-8">
      {/* Invite banners */}
      {invite === "success" && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-2xl px-4 py-3 text-sm font-medium">
          🎉 Co-parent joined successfully! They can now see and manage your family.
        </div>
      )}
      {invite === "error" && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl px-4 py-3 text-sm font-medium">
          This invite link has already been used or has expired. Generate a new one to invite again.
        </div>
      )}

      {/* Nudges section */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">Nudges</h2>
            <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {pendingRequests.length}
            </span>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <NudgeCard key={req.id} request={req} />
            ))}
          </div>
        </div>
      )}

      {/* Page title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Your family</h1>
        <div className="flex items-center gap-2">
          <InviteButton />
          <Link
            href="/dashboard/new-child"
            className="bg-orange-500 text-white rounded-full px-4 py-2 text-sm font-semibold hover:bg-orange-600 transition-colors whitespace-nowrap text-center"
          >
            + Add child
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {childrenWithGoals.length === 0 && (
        <div className="bg-white rounded-3xl p-10 text-center space-y-4 shadow-sm">
          <div className="text-5xl">👶</div>
          <p className="text-gray-600 font-medium">No children yet.</p>
          <p className="text-gray-400 text-sm">
            Add your first child to start giving stars.
          </p>
          <Link
            href="/dashboard/new-child"
            className="inline-block bg-orange-500 text-white rounded-full px-6 py-3 font-semibold hover:bg-orange-600 transition-colors"
          >
            Add a child
          </Link>
        </div>
      )}

      {/* Child cards */}
      {childrenWithGoals.map((child) => {
        const childUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/child/${child.id}`
        return (
          <div key={child.id} className="bg-white rounded-3xl shadow-sm overflow-hidden">
            {/* Child header */}
            <div
              className="px-6 pt-7 pb-4 flex items-center justify-between"
              style={{ backgroundColor: child.color + "20" }} // 12% opacity tint
            >
              <div className="flex items-center gap-3">
                <AvatarDisplay animal={child.avatarEmoji} hat={child.avatarHat} glasses={child.avatarGlasses} avatarConfig={child.avatarConfig} size="xl" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{child.name}</h2>
                  <ChangeChildPinButton childId={child.id} childName={child.name} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Share link (copy to clipboard) */}
                <CopyLinkButton url={childUrl} />
                <Link
                  href={`/dashboard/child/${child.id}/new-goal`}
                  className="text-sm bg-white border border-gray-200 rounded-full px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  + Goal
                </Link>
              </div>
            </div>

            {/* Goals */}
            <div className="divide-y-2 divide-gray-100">
              {child.goals.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">
                  No goals yet.{" "}
                  <Link
                    href={`/dashboard/child/${child.id}/new-goal`}
                    className="text-orange-500 underline"
                  >
                    Add one
                  </Link>
                </div>
              )}
              {child.goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>

            {/* Archived goals link */}
            <div className="px-6 py-3 border-t-2 border-gray-100">
              <Link
                href={`/dashboard/child/${child.id}/archived`}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                📦 View archived goals
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}

