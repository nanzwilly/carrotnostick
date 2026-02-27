"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateChildProfile } from "@/app/actions/children"

const PRESET_COLORS = [
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
  "#8b5cf6", "#ec4899", "#ef4444",
]

export default function EditChildProfileForm({
  childId,
  initialName,
  initialColor,
}: {
  childId: string
  initialName: string
  initialColor: string
}) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await updateChildProfile(childId, { name, color })
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card color
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-9 h-9 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: color === c ? "#1f2937" : "transparent",
              }}
              aria-label={`Select ${c}`}
            />
          ))}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  )
}
