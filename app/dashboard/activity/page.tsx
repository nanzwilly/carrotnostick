import { getActivityFeed, type ActivityItem } from "@/app/actions/activity"
import Link from "next/link"

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

function ActivityItemRow({ item }: { item: ActivityItem }) {
  const icon =
    item.type === "star" ? "⭐" :
    item.type === "redemption" ? "🎁" :
    item.type === "nudge" ? "🙋" : "📝"

  const description =
    item.type === "star"
      ? `${item.childName} earned ${item.quantity && item.quantity > 1 ? `${item.quantity} stars` : "a star"} for ${item.goalName}`
      : item.type === "redemption"
      ? `${item.childName} redeemed reward for ${item.goalName}`
      : `${item.childName} sent a nudge for ${item.goalName}`

  const statusBadge =
    item.type === "nudge" && item.status
      ? item.status === "approved"
        ? "✅"
        : item.status === "dismissed"
        ? "✕"
        : "⏳"
      : null

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="text-xl shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800">
          <span className="font-semibold" style={{ color: item.childColor }}>
            {item.childName}
          </span>{" "}
          {item.type === "star" && (
            <>earned {item.quantity && item.quantity > 1 ? <span className="font-bold">{item.quantity} stars</span> : "a star"} for </>
          )}
          {item.type === "redemption" && <>redeemed reward for </>}
          {item.type === "nudge" && <>sent a nudge for </>}
          <span className="font-medium">{item.goalEmoji} {item.goalName}</span>
          {statusBadge && <span className="ml-1">{statusBadge}</span>}
        </p>
        {item.note && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">&quot;{item.note}&quot;</p>
        )}
      </div>
      <span className="text-xs text-gray-400 shrink-0 mt-0.5">{timeAgo(item.timestamp)}</span>
    </div>
  )
}

export default async function ActivityPage() {
  const items = await getActivityFeed(100)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Activity Feed</h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-100">
        {items.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400">
            <div className="text-4xl mb-3">📜</div>
            <p className="font-medium">No activity yet</p>
            <p className="text-sm mt-1">Stars, rewards, and nudges will appear here.</p>
          </div>
        ) : (
          items.map((item) => <ActivityItemRow key={`${item.type}-${item.id}`} item={item} />)
        )}
      </div>
    </div>
  )
}
