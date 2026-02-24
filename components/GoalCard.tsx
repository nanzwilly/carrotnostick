"use client"

import { useState, useRef } from "react"
import { giveStar, redeemReward } from "@/app/actions/stars"
import { archiveGoal, deleteGoal } from "@/app/actions/goals"
import StarDisplay from "./StarDisplay"
import type { Goal, StarEvent, RewardRedemption } from "@/lib/schema"
import { useRouter } from "next/navigation"

type GoalWithEvents = Goal & {
  starEvents: StarEvent[]
  rewardRedemptions: RewardRedemption[]
}

const CONFETTI = [
  { emoji: "⭐", left: "8%",  duration: "1.2s", delay: "0s"    },
  { emoji: "🎉", left: "18%", duration: "1.5s", delay: "0.1s"  },
  { emoji: "✨", left: "30%", duration: "1.1s", delay: "0.2s"  },
  { emoji: "⭐", left: "42%", duration: "1.4s", delay: "0.05s" },
  { emoji: "🌟", left: "55%", duration: "1.3s", delay: "0.15s" },
  { emoji: "🎊", left: "65%", duration: "1.6s", delay: "0s"    },
  { emoji: "✨", left: "75%", duration: "1.2s", delay: "0.3s"  },
  { emoji: "⭐", left: "85%", duration: "1.5s", delay: "0.1s"  },
  { emoji: "🎉", left: "93%", duration: "1.1s", delay: "0.2s"  },
]

export default function GoalCard({ goal }: { goal: GoalWithEvents }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Calculate unredeemed stars
  const totalStars = goal.starEvents.length
  const redeemedCycles = goal.rewardRedemptions.length
  const redeemedStars = redeemedCycles * goal.starThreshold
  const currentStars = totalStars - redeemedStars
  const starsInCycle = currentStars % goal.starThreshold || (currentStars > 0 && currentStars >= goal.starThreshold ? goal.starThreshold : currentStars)
  const rewardReached = currentStars >= goal.starThreshold

  // ── Fly star from button to its slot ──────────────────────────────────────
  const flyStarToSlot = (targetSlotIndex: number) => {
    const button = buttonRef.current
    const card = cardRef.current
    if (!button || !card) return

    const fromRect = button.getBoundingClientRect()

    // Try to find the exact star slot; fall back to progress bar
    const targetEl =
      card.querySelector(`[data-star-slot="${targetSlotIndex}"]`) ||
      card.querySelector("[data-progress-bar]")

    const toRect = targetEl
      ? targetEl.getBoundingClientRect()
      : { left: fromRect.left, top: fromRect.top - 60, width: 28, height: 28 }

    const fromX = fromRect.left + fromRect.width / 2
    const fromY = fromRect.top + fromRect.height / 2
    const toX = toRect.left + toRect.width / 2
    const toY = toRect.top + toRect.height / 2

    // Create a fixed-position flying star
    const star = document.createElement("span")
    star.textContent = "⭐"
    star.style.cssText = `
      position: fixed;
      left: ${fromX}px;
      top: ${fromY}px;
      font-size: 1.6rem;
      z-index: 9999;
      pointer-events: none;
      transform: translate(-50%, -50%) scale(1);
      will-change: left, top, transform;
    `
    document.body.appendChild(star)

    // Two rAFs to ensure initial position is painted before transition kicks in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        star.style.transition = [
          "left 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
          "top 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
          "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
          "opacity 0.2s ease 0.45s",
        ].join(", ")
        star.style.left = `${toX}px`
        star.style.top = `${toY}px`
        star.style.transform = "translate(-50%, -50%) scale(1.5)"
        star.style.opacity = "0"
      })
    })

    // Clean up after animation
    setTimeout(() => {
      if (document.body.contains(star)) document.body.removeChild(star)
    }, 750)
  }

  const handleGiveStar = async () => {
    setLoading(true)

    // Fire the animation immediately — before waiting for the server
    flyStarToSlot(starsInCycle)

    try {
      const result = await giveStar(goal.id)
      if (result.rewardReached) {
        setTimeout(() => setShowCelebration(true), 400)
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async () => {
    setLoading(true)
    setShowCelebration(false)
    try {
      await redeemReward(goal.id)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    setLoading(true)
    setMenuOpen(false)
    try {
      await archiveGoal(goal.id)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteGoal(goal.id)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ── Big celebration overlay ──────────────────────────────────────────── */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className="confetti-piece absolute top-0 text-2xl"
                style={{ left: c.left, animationDuration: c.duration, animationDelay: c.delay }}
              >
                {c.emoji}
              </span>
            ))}
          </div>

          <div className="celeb-pop bg-white rounded-3xl shadow-2xl p-8 max-w-xs w-full text-center space-y-5 relative">
            <div className="text-6xl animate-bounce">🎉</div>
            <div className="space-y-1">
              <p className="text-2xl font-black text-gray-900">Goal reached!</p>
              <p className="text-gray-500 text-sm">{goal.name}</p>
            </div>
            <div className="text-3xl tracking-widest">⭐⭐⭐⭐⭐</div>
            <div className="bg-orange-50 rounded-2xl px-5 py-3 space-y-0.5">
              <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide">Reward</p>
              <p className="text-xl font-black text-gray-900">{goal.rewardDescription}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRedeem}
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-2xl py-3 transition-colors"
              >
                {loading ? "…" : "Redeem ✓"}
              </button>
              <button
                onClick={() => setShowCelebration(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl py-3 transition-colors text-sm"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Goal card ────────────────────────────────────────────────────────── */}
      <div ref={cardRef} className="px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{goal.emoji}</span>
            <div>
              <p className="font-semibold text-gray-800">{goal.name}</p>
              <p className="text-xs text-gray-400">
                Reward: {goal.rewardDescription} · every {goal.starThreshold} stars
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!rewardReached && (
              <button
                ref={buttonRef}
                onClick={handleGiveStar}
                disabled={loading}
                className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold rounded-full px-4 py-2 text-sm transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {loading ? "…" : "⭐ Give star"}
              </button>
            )}

            {/* ··· menu */}
            <div className="relative">
              <button
                onClick={() => { setMenuOpen(!menuOpen); setConfirmDelete(false) }}
                className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-lg"
              >
                ···
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 bg-white border border-gray-100 rounded-2xl shadow-lg py-1.5 z-10 min-w-[140px]">
                  <button
                    onClick={handleArchive}
                    disabled={loading}
                    className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    📦 Archive
                  </button>
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      🗑 Delete
                    </button>
                  ) : (
                    <div className="px-4 py-2 space-y-1.5">
                      <p className="text-xs text-red-500 font-medium">Delete all history?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDelete}
                          disabled={loading}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg py-1.5 transition-colors"
                        >
                          Yes, delete
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-lg py-1.5 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Star display */}
        <StarDisplay
          current={starsInCycle}
          total={goal.starThreshold}
          rewardDescription={goal.rewardDescription}
        />

        {/* Reward reached banner */}
        {rewardReached && !showCelebration && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-green-800 text-sm">🎉 Reward earned!</p>
              <p className="text-xs text-green-600">{goal.rewardDescription}</p>
            </div>
            <button
              onClick={() => setShowCelebration(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold rounded-full px-4 py-2 text-sm transition-colors"
            >
              Redeem ✓
            </button>
          </div>
        )}

        {redeemedCycles > 0 && (
          <p className="text-xs text-gray-400">
            {redeemedCycles} reward{redeemedCycles > 1 ? "s" : ""} redeemed so far
          </p>
        )}
      </div>
    </>
  )
}
