"use client"

import { useState } from "react"
import { verifyChildPin } from "@/app/actions/children"
import { createStarRequest } from "@/app/actions/stars"
import type { Child, Goal, StarEvent, RewardRedemption, StarRequest } from "@/lib/schema"
import { useParams } from "next/navigation"
import Link from "next/link"

type GoalWithEvents = Goal & {
  starEvents: StarEvent[]
  rewardRedemptions: RewardRedemption[]
  starRequests: StarRequest[]
}
type ChildWithGoals = Child & { goals: GoalWithEvents[] }

export default function ChildPage() {
  const params = useParams()
  const childId = params.childId as string

  const [pin, setPin] = useState("")
  const [child, setChild] = useState<ChildWithGoals | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Track which goals this kid has already nudged this session
  const [nudgedGoals, setNudgedGoals] = useState<Set<string>>(new Set())

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = await verifyChildPin(childId, pin)
    if (result) {
      const c = result as ChildWithGoals
      // Pre-populate nudged set from any already-pending requests
      const alreadyNudged = new Set(
        c.goals
          .filter((g) => g.starRequests.length > 0)
          .map((g) => g.id)
      )
      setNudgedGoals(alreadyNudged)
      setChild(c)
    } else {
      setError("Wrong PIN. Try again!")
      setPin("")
    }
    setLoading(false)
  }

  // ── PIN entry screen ────────────────────────────────────────────────────────
  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm p-10 w-full max-w-xs text-center space-y-6">
          <div className="space-y-1">
            <div className="text-5xl">🥕</div>
            <h1 className="text-xl font-bold text-gray-900">carrotnostick</h1>
          </div>
          <p className="text-gray-500 text-sm">Enter your PIN to see your stars</p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              required
              autoFocus
              className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-2xl px-4 py-4 text-center text-3xl tracking-widest font-mono text-gray-900 focus:outline-none transition-colors"
            />

            {error && (
              <p className="text-sm text-red-500 animate-bounce">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-2xl py-3 transition-colors text-lg"
            >
              {loading ? "…" : "Let me in ✨"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Star view ───────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{ backgroundColor: child.color + "15" }}
    >
      <div className="max-w-sm mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-6xl">{child.avatarEmoji}</div>
          <h1 className="text-3xl font-black text-gray-900">{child.name}</h1>
          <p className="text-gray-500 text-sm">Your stars ⭐</p>
        </div>

        {/* Goal cards */}
        {child.goals.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center text-gray-400">
            No goals yet — ask your parent to add one!
          </div>
        )}

        {child.goals.map((goal) => {
          const totalStars = goal.starEvents.length
          const redeemedStars = goal.rewardRedemptions.length * goal.starThreshold
          const currentStars = totalStars - redeemedStars
          const starsInCycle = Math.min(currentStars, goal.starThreshold)
          const remaining = goal.starThreshold - starsInCycle
          const rewardReached = currentStars >= goal.starThreshold
          const isNudged = nudgedGoals.has(goal.id)

          return (
            <GoalCard
              key={goal.id}
              goal={goal}
              child={child}
              starsInCycle={starsInCycle}
              remaining={remaining}
              rewardReached={rewardReached}
              isNudged={isNudged}
              onNudge={async (message) => {
                await createStarRequest(goal.id, child.id, message)
                setNudgedGoals((prev) => new Set([...prev, goal.id]))
              }}
            />
          )
        })}

        <p className="text-center text-xs text-gray-400 pb-4">carrotnostick 🥕</p>
      </div>
    </div>
  )
}

// ── Goal card with nudge button ───────────────────────────────────────────────

function GoalCard({
  goal,
  child,
  starsInCycle,
  remaining,
  rewardReached,
  isNudged,
  onNudge,
}: {
  goal: GoalWithEvents
  child: ChildWithGoals
  starsInCycle: number
  remaining: number
  rewardReached: boolean
  isNudged: boolean
  onNudge: (message: string) => Promise<void>
}) {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(isNudged)

  const handleNudge = async () => {
    setSending(true)
    await onNudge(message)
    setSent(true)
    setSending(false)
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
      {/* Goal name */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">{goal.emoji}</span>
        <p className="font-bold text-gray-800 text-lg">{goal.name}</p>
      </div>

      {/* Stars on hand */}
      <ChildStarDisplay
        current={starsInCycle}
        total={goal.starThreshold}
        color={child.color}
      />

      {/* Status / actions */}
      <div className="space-y-3">
        {rewardReached ? (
          <div className="bg-green-50 rounded-2xl px-4 py-3 text-center">
            <p className="font-black text-green-700 text-lg">🎉 You did it!</p>
            <p className="text-green-600 text-sm">Go claim your {goal.rewardDescription}!</p>
            <Link
              href={`/child/${child.id}/celebrate?goalId=${goal.id}&reward=${encodeURIComponent(goal.rewardDescription)}&name=${encodeURIComponent(child.name)}&emoji=${encodeURIComponent(child.avatarEmoji)}`}
              className="inline-block mt-2 bg-green-500 text-white font-bold rounded-full px-5 py-2 text-sm hover:bg-green-600 transition-colors"
            >
              Show parent 🎊
            </Link>
          </div>
        ) : sent ? (
          /* Already nudged */
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
            <p className="text-amber-700 font-semibold text-sm">📨 Parent notified!</p>
            <p className="text-amber-500 text-xs mt-0.5">Waiting for them to give you a star…</p>
          </div>
        ) : (
          /* Nudge form */
          <div className="space-y-2">
            <p className="text-center text-gray-500 text-sm">
              {remaining === 1
                ? <span>Just <span className="text-orange-500 font-black">1 more star</span> for {goal.rewardDescription}!</span>
                : <span><span className="text-orange-500 font-black">{remaining} more stars</span> for {goal.rewardDescription}</span>
              }
            </p>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell parent what you did… (optional)"
              maxLength={80}
              className="w-full border border-gray-200 rounded-2xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition"
            />
            <button
              onClick={handleNudge}
              disabled={sending}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl py-2.5 text-sm transition-colors"
            >
              {sending ? "Sending…" : "🙋 I did it! Tell parent"}
            </button>
          </div>
        )}
      </div>

      {/* Redeemed count */}
      {goal.rewardRedemptions.length > 0 && (
        <p className="text-xs text-center text-gray-400">
          🏆 You&apos;ve earned this reward {goal.rewardRedemptions.length}× already!
        </p>
      )}
    </div>
  )
}

// ── Star hand display ─────────────────────────────────────────────────────────

function ChildStarDisplay({
  current,
  total,
  color,
}: {
  current: number
  total: number
  color: string
}) {
  const useCompact = total > 10

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {useCompact ? (
        <div className="w-full space-y-2">
          <div className="text-5xl text-center select-none">✋</div>
          <div className="flex items-center gap-2 px-2">
            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((current / total) * 100, 100)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="text-7xl select-none">✋</div>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={`text-lg transition-all duration-500 ${
                  i < current ? "opacity-100" : "opacity-20"
                }`}
                style={{
                  transform: i < current ? "scale(1.2) translateY(-4px)" : "scale(1)",
                  filter: i < current ? `drop-shadow(0 0 4px ${color})` : "none",
                }}
              >
                ⭐
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="text-3xl font-black" style={{ color }}>
        {current} / {total}
      </div>
    </div>
  )
}
