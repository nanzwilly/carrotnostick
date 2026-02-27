"use client"

import { useState } from "react"
import Link from "next/link"
import AvatarDisplay from "@/components/AvatarDisplay"
import type { BigHeadConfig } from "@/components/BigHeadAvatar"
import CopyLinkButton from "@/components/CopyLinkButton"
import TestGoalCard from "@/components/TestGoalCard"

const MOTIVATION_QUOTES = [
  "Every small star leads to a big galaxy of success!",
  "Small steps today, big wins tomorrow.",
  "You're doing great — keep going!",
]

type ChildWithGoals = {
  id: string
  name: string
  color: string
  avatarEmoji: string
  avatarHat: string | null
  avatarGlasses: string | null
  avatarConfig: BigHeadConfig | null
  goals: Array<{
    id: string
    name: string
    emoji: string
    starThreshold: number
    rewardDescription: string
    starEvents: unknown[]
    rewardRedemptions: unknown[]
  }>
}

export default function DashboardTestView({
  childrenWithGoals,
  baseUrl,
}: {
  childrenWithGoals: ChildWithGoals[]
  baseUrl: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeChild = childrenWithGoals[activeIndex] ?? null
  const motivationQuote = MOTIVATION_QUOTES[0]

  if (childrenWithGoals.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
        <p className="text-gray-600">No children yet. Add one from the main dashboard.</p>
        <Link href="/dashboard/new-child" className="text-orange-500 font-medium mt-2 inline-block">
          Add a child
        </Link>
      </div>
    )
  }

  const childUrl = `${baseUrl}/child/${activeChild?.id}`

  // Next reward for "Big Prize Ahead" — pick first goal that's not yet reached
  let nextGoal: (typeof activeChild.goals)[0] | null = null
  let starsNeeded = 0
  if (activeChild) {
    for (const g of activeChild.goals) {
      const total = g.starEvents.length
      const redeemed = g.rewardRedemptions.length * g.starThreshold
      const current = total - redeemed
      const inCycle = current % g.starThreshold || (current >= g.starThreshold ? g.starThreshold : current)
      if (inCycle < g.starThreshold) {
        nextGoal = g
        starsNeeded = g.starThreshold - inCycle
        break
      }
    }
  }

  return (
    <div className="flex gap-6 -mx-4 sm:mx-0">
      {/* Left sidebar — Family members + Today's motivation */}
      <aside className="w-44 shrink-0 space-y-6">
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Family members
          </h2>
          <ul className="space-y-1">
            {childrenWithGoals.map((child, i) => (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    i === activeIndex ? "bg-orange-100 text-gray-900" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <AvatarDisplay
                    animal={child.avatarEmoji}
                    hat={child.avatarHat}
                    glasses={child.avatarGlasses}
                    avatarConfig={child.avatarConfig as BigHeadConfig | null | undefined}
                    size="sm"
                  />
                  <span className="font-medium truncate text-sm">{child.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Today&apos;s motivation
          </h2>
          <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-3">
            <p className="text-sm text-gray-700 italic">&ldquo;{motivationQuote}&rdquo;</p>
          </div>
        </div>
      </aside>

      {/* Main — Active child's journey */}
      <div className="flex-1 min-w-0 space-y-6">
        {activeChild && (
          <>
            <div>
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                Active
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
                {activeChild.name}&apos;s Journey
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Tracking progress and celebrating wins
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <CopyLinkButton url={childUrl} />
                <Link
                  href={`/dashboard/child/${activeChild.id}/new-goal`}
                  className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
                >
                  + Add Goal
                </Link>
              </div>
            </div>

            {/* Goal cards grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {activeChild.goals.map((goal, i) => (
                <TestGoalCard key={goal.id} goal={goal} colorIndex={i} />
              ))}
              <Link
                href={`/dashboard/child/${activeChild.id}/new-goal`}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-100/50 hover:border-gray-300 transition-colors min-h-[180px] text-gray-500"
              >
                <span className="text-3xl mb-2">+</span>
                <span className="text-sm font-medium">Start a new challenge</span>
              </Link>
            </div>

            {/* Big Prize Ahead banner */}
            {nextGoal && (
              <div className="bg-orange-500 rounded-2xl p-5 text-white flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">Big Prize Ahead!</h3>
                  <p className="text-orange-100 text-sm mt-1">
                    Reach {nextGoal.starThreshold} stars in &ldquo;{nextGoal.name}&rdquo; to earn{" "}
                    <span className="font-semibold text-white">{nextGoal.rewardDescription}</span>
                  </p>
                </div>
                <div className="bg-orange-600 rounded-xl px-4 py-3 text-center shrink-0">
                  <p className="text-xs text-orange-100 uppercase font-semibold">Stars needed</p>
                  <p className="text-2xl font-bold mt-0.5">{starsNeeded}</p>
                  <div className="flex justify-center gap-0.5 mt-1">
                    {Array.from({ length: Math.min(5, nextGoal.starThreshold) }).map((_, i) => (
                      <span
                        key={i}
                        className={i < starsNeeded ? "opacity-100" : "opacity-40"}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
