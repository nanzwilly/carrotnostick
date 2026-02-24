"use client"

import { useState } from "react"
import { verifyChildPin, updateChildAvatar, getSiblings } from "@/app/actions/children"
import { createStarRequest } from "@/app/actions/stars"
import type { Child, Goal, StarEvent, RewardRedemption, StarRequest } from "@/lib/schema"
import { useParams } from "next/navigation"
import Link from "next/link"
import AvatarDisplay from "@/components/AvatarDisplay"

const ANIMALS = ["🐱","🐶","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🦄","🐔","🐧","🦋","🐙","🦖","🐲"]
const HATS    = ["🎩","👒","🎓","🪖","👑","🧢","🎅"]
const GLASSES = ["🕶️","👓"]

type GoalWithEvents = Goal & {
  starEvents: StarEvent[]
  rewardRedemptions: RewardRedemption[]
  starRequests: StarRequest[]
}
type ChildWithGoals = Child & { goals: GoalWithEvents[] }

type SiblingGoal = Goal & { starEvents: StarEvent[]; rewardRedemptions: RewardRedemption[] }
type SiblingWithGoals = Child & { goals: SiblingGoal[] }

// Total unredeemed stars across all active goals
function computeTotalStars(goals: Array<{ starEvents: unknown[]; rewardRedemptions: unknown[]; starThreshold: number }>) {
  return goals.reduce(
    (sum, g) => sum + Math.max(0, g.starEvents.length - g.rewardRedemptions.length * g.starThreshold),
    0
  )
}

export default function ChildPage() {
  const params = useParams()
  const childId = params.childId as string

  const [pin, setPin] = useState("")
  const [child, setChild] = useState<ChildWithGoals | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Track which goals this kid has already nudged this session
  const [nudgedGoals, setNudgedGoals] = useState<Set<string>>(new Set())

  // Avatar editor
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const [editAnimal, setEditAnimal] = useState("")
  const [editHat, setEditHat] = useState<string | null>(null)
  const [editGlasses, setEditGlasses] = useState<string | null>(null)
  const [avatarSaving, setAvatarSaving] = useState(false)

  // Leaderboard
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [siblings, setSiblings] = useState<SiblingWithGoals[] | null>(null)
  const [siblingsLoading, setSiblingsLoading] = useState(false)

  const handleShowLeaderboard = async () => {
    setShowLeaderboard(true)
    if (siblings === null) {
      setSiblingsLoading(true)
      const data = await getSiblings(childId)
      setSiblings(data as SiblingWithGoals[])
      setSiblingsLoading(false)
    }
  }

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
      setEditAnimal(c.avatarEmoji)
      setEditHat(c.avatarHat ?? null)
      setEditGlasses(c.avatarGlasses ?? null)
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
          <button
            onClick={() => setShowAvatarEditor(true)}
            className="relative inline-block focus:outline-none group"
            title="Tap to change your look!"
          >
            <AvatarDisplay animal={editAnimal || child.avatarEmoji} hat={editHat} glasses={editGlasses} size="xl" />
            <span className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full text-sm px-1.5 py-0.5 shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">✏️</span>
          </button>
          <h1 className="text-3xl font-black text-gray-900">{child.name}</h1>
          <p className="text-gray-500 text-sm">Your stars ⭐</p>
        </div>

        {/* Avatar editor modal */}
        {showAvatarEditor && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-2 pb-0">
            <div className="bg-white rounded-t-3xl w-full max-w-sm p-6 space-y-5 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Your look 🎨</h2>
                <button onClick={() => setShowAvatarEditor(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">✕</button>
              </div>

              {/* Preview */}
              <div className="flex justify-center py-2">
                <AvatarDisplay animal={editAnimal || child.avatarEmoji} hat={editHat} glasses={editGlasses} size="xl" />
              </div>

              {/* Animal picker */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">🐾 Pick your animal</p>
                <div className="flex flex-wrap gap-2">
                  {ANIMALS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setEditAnimal(a)}
                      className={`text-2xl p-2 rounded-xl transition-all ${editAnimal === a ? "bg-orange-100 ring-2 ring-orange-400 scale-110" : "hover:bg-gray-100"}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hat picker */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">🎩 Hat</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditHat(null)}
                    className={`text-sm px-3 py-1.5 rounded-xl border transition-all ${editHat === null ? "bg-orange-100 border-orange-400 text-orange-700 font-bold" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    None
                  </button>
                  {HATS.map((h) => (
                    <button
                      key={h}
                      onClick={() => setEditHat(h)}
                      className={`text-2xl p-2 rounded-xl transition-all ${editHat === h ? "bg-orange-100 ring-2 ring-orange-400 scale-110" : "hover:bg-gray-100"}`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glasses picker */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">🕶️ Glasses</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setEditGlasses(null)}
                    className={`text-sm px-3 py-1.5 rounded-xl border transition-all ${editGlasses === null ? "bg-orange-100 border-orange-400 text-orange-700 font-bold" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    None
                  </button>
                  {GLASSES.map((g) => (
                    <button
                      key={g}
                      onClick={() => setEditGlasses(g)}
                      className={`text-2xl p-2 rounded-xl transition-all ${editGlasses === g ? "bg-orange-100 ring-2 ring-orange-400 scale-110" : "hover:bg-gray-100"}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={avatarSaving}
                onClick={async () => {
                  setAvatarSaving(true)
                  await updateChildAvatar(child.id, editAnimal || child.avatarEmoji, editHat, editGlasses)
                  setChild((prev) => prev ? { ...prev, avatarEmoji: editAnimal || prev.avatarEmoji, avatarHat: editHat, avatarGlasses: editGlasses } : prev)
                  setAvatarSaving(false)
                  setShowAvatarEditor(false)
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl py-3 transition-colors"
              >
                {avatarSaving ? "Saving…" : "Save my look! 🎉"}
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-2 pb-0">
            <div className="bg-white rounded-t-3xl w-full max-w-sm p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">🏆 Leaderboard</h2>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              {siblingsLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
              ) : (siblings ?? []).length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="text-5xl">🐣</div>
                  <p className="text-gray-700 font-semibold">You&apos;re the only one!</p>
                  <p className="text-gray-400 text-sm">No siblings yet. Enjoy having all the stars to yourself! 😄</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    {
                      id: child.id,
                      name: child.name,
                      avatarEmoji: editAnimal || child.avatarEmoji,
                      avatarHat: editHat,
                      avatarGlasses: editGlasses,
                      color: child.color,
                      totalStars: computeTotalStars(child.goals),
                      isMe: true,
                    },
                    ...(siblings ?? []).map((s) => ({
                      id: s.id,
                      name: s.name,
                      avatarEmoji: s.avatarEmoji,
                      avatarHat: s.avatarHat,
                      avatarGlasses: s.avatarGlasses,
                      color: s.color,
                      totalStars: computeTotalStars(s.goals),
                      isMe: false,
                    })),
                  ]
                    .sort((a, b) => b.totalStars - a.totalStars)
                    .map((entry, index) => {
                      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`
                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                            entry.isMe
                              ? "ring-2 ring-orange-400 bg-orange-50"
                              : "bg-gray-50"
                          }`}
                        >
                          <span className="text-2xl w-8 text-center shrink-0">{medal}</span>
                          <AvatarDisplay
                            animal={entry.avatarEmoji}
                            hat={entry.avatarHat}
                            glasses={entry.avatarGlasses}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 truncate">
                              {entry.name}
                              {entry.isMe && (
                                <span className="text-orange-500 font-normal text-xs ml-1">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">
                              {entry.totalStars} star{entry.totalStars !== 1 ? "s" : ""} collected
                            </p>
                          </div>
                          <span
                            className="text-xl font-black shrink-0"
                            style={{ color: entry.color }}
                          >
                            {entry.totalStars}⭐
                          </span>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        )}

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

        {/* Competition leaderboard button */}
        <button
          onClick={handleShowLeaderboard}
          className="w-full bg-white border-2 border-yellow-300 hover:bg-yellow-50 text-gray-700 font-bold rounded-2xl py-3 text-sm transition-colors flex items-center justify-center gap-2"
        >
          🏆 See how the competition is doing
        </button>

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
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {/* 🤚 Back-of-hand — same size for every goal */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        {/* Hand */}
        <span className="text-7xl leading-none select-none" aria-hidden>🤚</span>

        {/* Tiny stars drawn on the back — all contained within the hand */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ paddingTop: "14px" }}
        >
          <div
            className="flex flex-wrap justify-center"
            style={{ width: "2.6rem", gap: "1px" }}
          >
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className="select-none transition-all duration-300"
                style={{
                  fontSize: "0.48rem",
                  lineHeight: 1,
                  color: i < current ? color : "#d1d5db",
                }}
              >
                {i < current ? "★" : "☆"}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar for goals with many stars (>10) */}
      {total > 10 && (
        <div className="w-full px-4">
          <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((current / total) * 100, 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      )}

      <div className="text-3xl font-black" style={{ color }}>
        {current} / {total}
      </div>
    </div>
  )
}
