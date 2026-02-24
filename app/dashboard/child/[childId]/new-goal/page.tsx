"use client"

import { useState } from "react"
import { createGoal } from "@/app/actions/goals"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

// No ⭐ here — stars are reserved for the progress display
const GOAL_EMOJIS = ["🎯", "🍎", "📖", "🎨", "🏃", "🧹", "🌱", "💬", "🎵", "🤝", "🍕", "🦁", "🚀", "💪", "🌈"]

export default function NewGoalPage() {
  const router = useRouter()
  const params = useParams()
  const childId = params.childId as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("🎯")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    formData.set("childId", childId)
    formData.set("emoji", selectedEmoji)

    try {
      await createGoal(formData)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add a goal</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Emoji picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Goal icon</label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-2xl p-2 rounded-xl transition-all ${
                    selectedEmoji === emoji
                      ? "bg-orange-100 ring-2 ring-orange-400 scale-110"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Goal name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              What behaviour are you rewarding?
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Tries something new at dinner"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Reward */}
          <div className="space-y-1.5">
            <label htmlFor="rewardDescription" className="text-sm font-medium text-gray-700">
              What&apos;s the reward?
            </label>
            <input
              id="rewardDescription"
              name="rewardDescription"
              type="text"
              required
              placeholder="e.g. 3 KFC strips"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* Stars needed */}
          <div className="space-y-1.5">
            <label htmlFor="starThreshold" className="text-sm font-medium text-gray-700">
              Stars needed for reward
            </label>
            <input
              id="starThreshold"
              name="starThreshold"
              type="number"
              min={1}
              max={40}
              defaultValue={5}
              required
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 text-center text-lg font-semibold"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl py-3 transition-colors"
          >
            {loading ? "Adding…" : "Add goal"}
          </button>
        </form>
      </div>
    </div>
  )
}
