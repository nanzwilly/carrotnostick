"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { approveStarRequest, dismissStarRequest } from "@/app/actions/stars"
import type { Goal, StarRequest } from "@/lib/schema"

type NudgeRequest = StarRequest & {
  goal: Goal
  child: {
    id: string
    name: string
    avatarEmoji: string
    color: string
  }
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function NudgeCard({ request }: { request: NudgeRequest }) {
  const router = useRouter()
  const [approving, setApproving] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  const handleApprove = async () => {
    setApproving(true)
    await approveStarRequest(request.id)
    router.refresh()
  }

  const handleDismiss = async () => {
    setDismissing(true)
    await dismissStarRequest(request.id)
    router.refresh()
  }

  return (
    <div className="flex items-start gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-amber-100">
      {/* Child avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: request.child.color + "25" }}
      >
        {request.child.avatarEmoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">{request.child.name}</span>
          <span className="text-gray-400 text-xs">·</span>
          <span className="text-gray-500 text-sm">
            {request.goal.emoji} {request.goal.name}
          </span>
          <span className="text-gray-400 text-xs ml-auto">{timeAgo(request.createdAt)}</span>
        </div>
        {request.message && (
          <p className="text-sm text-gray-600 mt-0.5 italic">"{request.message}"</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 flex-shrink-0">
        <button
          onClick={handleApprove}
          disabled={approving || dismissing}
          className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl px-3 py-1.5 transition-colors"
          title="Give star"
        >
          {approving ? "…" : "⭐ Give"}
        </button>
        <button
          onClick={handleDismiss}
          disabled={approving || dismissing}
          className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600 text-xs font-bold rounded-xl px-3 py-1.5 transition-colors"
          title="Dismiss"
        >
          {dismissing ? "…" : "✕"}
        </button>
      </div>
    </div>
  )
}
