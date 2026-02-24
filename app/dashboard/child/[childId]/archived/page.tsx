"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getArchivedGoals, unarchiveGoal } from "@/app/actions/goals"
import type { Goal, StarEvent, RewardRedemption } from "@/lib/schema"

type ArchivedGoal = Goal & { starEvents: StarEvent[]; rewardRedemptions: RewardRedemption[] }

export default function ArchivedGoalsPage() {
  const params = useParams()
  const router = useRouter()
  const childId = params.childId as string

  const [goals, setGoals] = useState<ArchivedGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getArchivedGoals(childId)
      setGoals(data as ArchivedGoal[])
    } finally {
      setLoading(false)
    }
  }, [childId])

  useEffect(() => { load() }, [load])

  const handleUnarchive = async (goalId: string) => {
    setRestoringId(goalId)
    try {
      await unarchiveGoal(goalId)
      await load()
      router.refresh()
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Archived goals</h1>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400 text-sm">Loading…</div>
      )}

      {!loading && goals.length === 0 && (
        <div className="bg-white rounded-3xl p-10 text-center space-y-3 shadow-sm">
          <div className="text-4xl">📦</div>
          <p className="text-gray-600 font-medium">No archived goals</p>
          <p className="text-gray-400 text-sm">
            Goals you archive will appear here. You can restore them any time.
          </p>
        </div>
      )}

      {!loading && goals.length > 0 && (
        <div className="space-y-3">
          {goals.map((goal) => {
            const totalStars = goal.starEvents.length
            const redeemedCycles = goal.rewardRedemptions.length
            const redeemedStars = redeemedCycles * goal.starThreshold
            const currentStars = totalStars - redeemedStars

            return (
              <div key={goal.id} className="bg-white rounded-3xl shadow-sm px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl shrink-0">{goal.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-700 truncate">{goal.name}</p>
                    <p className="text-xs text-gray-400">
                      {currentStars} star{currentStars !== 1 ? "s" : ""} earned · reward: {goal.rewardDescription}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnarchive(goal.id)}
                  disabled={restoringId === goal.id}
                  className="shrink-0 text-sm bg-orange-50 hover:bg-orange-100 text-orange-600 font-semibold rounded-full px-4 py-2 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {restoringId === goal.id ? "Restoring…" : "↩ Restore"}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
