"use client"

import { useState } from "react"
import { getNotifications, markAllRead } from "@/app/actions/notifications"
import type { Notification } from "@/lib/schema"

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

const TYPE_ICONS: Record<string, string> = {
  nudge: "🙋",
  star_earned: "⭐",
  reward_reached: "🎉",
  streak_milestone: "🔥",
  shop_purchase: "🛒",
}

export default function NotificationBell({ initialCount }: { initialCount: number }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(initialCount)

  const handleOpen = async () => {
    setOpen(true)
    setLoading(true)
    try {
      const data = await getNotifications()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    setUnread(0)
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="relative text-sm bg-white border border-gray-200 rounded-full px-3 py-2 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 w-80 max-h-96 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-72">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">Loading…</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">No notifications yet</div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-gray-50 ${
                    !n.isRead ? "bg-orange-50/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{TYPE_ICONS[n.type] ?? "📌"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium">{n.title}</p>
                      {n.body && <p className="text-xs text-gray-400 mt-0.5">{n.body}</p>}
                      <p className="text-xs text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-orange-500 rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
