"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { giveStar } from "@/app/actions/stars"

type Goal = {
  id: string
  name: string
  emoji: string
  starThreshold: number
  rewardDescription: string
  starEvents: unknown[]
  rewardRedemptions: unknown[]
}

const CARD_COLORS = [
  { bg: "bg-orange-100", bar: "bg-orange-500", text: "text-orange-700" },
  { bg: "bg-sky-100", bar: "bg-sky-500", text: "text-sky-700" },
  { bg: "bg-violet-100", bar: "bg-violet-500", text: "text-violet-700" },
  { bg: "bg-amber-100", bar: "bg-amber-500", text: "text-amber-700" },
]

export default function TestGoalCard({
  goal,
  colorIndex = 0,
}: {
  goal: Goal
  colorIndex?: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const totalStars = goal.starEvents.length
  const redeemedCycles = goal.rewardRedemptions.length
  const redeemedStars = redeemedCycles * goal.starThreshold
  const currentStars = totalStars - redeemedStars
  const starsInCycle =
    currentStars % goal.starThreshold ||
    (currentStars >= goal.starThreshold ? goal.starThreshold : currentStars)
  const rewardReached = currentStars >= goal.starThreshold
  const progressPct = Math.min((starsInCycle / goal.starThreshold) * 100, 100)
  const colors = CARD_COLORS[colorIndex % CARD_COLORS.length]

  const handleGiveStar = async () => {
    setLoading(true)
    try {
      await giveStar(goal.id)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`${colors.bg} px-4 py-3 flex items-center gap-2`}>
        <span className="text-2xl">{goal.emoji}</span>
        <h3 className="font-bold text-gray-900">{goal.name}</h3>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          Reward: {goal.rewardDescription} · every {goal.starThreshold} ⭐
        </p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {starsInCycle}/{goal.starThreshold} stars this cycle
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.bar} rounded-full transition-all`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className={`text-sm font-semibold ${colors.text}`}>
            ★ {currentStars} total stars
          </span>
          {!rewardReached && (
            <button
              type="button"
              onClick={handleGiveStar}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-full transition-colors"
            >
              {loading ? "…" : "Give star"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
