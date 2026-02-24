"use client"

import { useState } from "react"
import { createChild } from "@/app/actions/children"
import { useRouter } from "next/navigation"
import Link from "next/link"

const AVATAR_OPTIONS = ["🌟", "🦁", "🐼", "🦊", "🐨", "🦄", "🐸", "🐙", "🦋", "🐬"]
const COLOR_OPTIONS = [
  { label: "Orange", value: "#f97316" },
  { label: "Pink", value: "#ec4899" },
  { label: "Purple", value: "#a855f7" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Teal", value: "#14b8a6" },
]

export default function NewChildPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState("🌟")
  const [selectedColor, setSelectedColor] = useState("#f97316")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    formData.set("avatarEmoji", selectedEmoji)
    formData.set("color", selectedColor)

    try {
      await createChild(formData)
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
        <h1 className="text-2xl font-bold text-gray-900">Add a child</h1>
      </div>

      <div className="bg-white rounded-3xl shadow-sm p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Pick an avatar</label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_OPTIONS.map((emoji) => (
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

          {/* Color picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Pick a colour</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === c.value ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Child&apos;s name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Maya"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>

          {/* PIN */}
          <div className="space-y-1.5">
            <label htmlFor="pin" className="text-sm font-medium text-gray-700">
              4-digit PIN
            </label>
            <input
              id="pin"
              name="pin"
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              placeholder="e.g. 1234"
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300 tracking-widest text-center text-lg font-mono"
            />
            <p className="text-xs text-gray-400">
              Share this with your child so they can log in on their device.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl py-3 transition-colors"
          >
            {loading ? "Adding…" : `Add ${selectedEmoji}`}
          </button>
        </form>
      </div>
    </div>
  )
}
