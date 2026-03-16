"use client"

import { useState } from "react"
import { createShopItem, deleteShopItem } from "@/app/actions/shop"
import { useRouter } from "next/navigation"
import type { RewardShopItem } from "@/lib/schema"

const SHOP_EMOJIS = ["🎁", "🍦", "🎮", "📱", "🎬", "🍕", "🧸", "📚", "🎨", "⚽", "🎵", "🍩", "🛍️", "🎢", "🏖️"]

export default function ShopManager({ initialItems }: { initialItems: RewardShopItem[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [emoji, setEmoji] = useState("🎁")
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("emoji", emoji)
    try {
      await createShopItem(formData)
      setShowForm(false)
      setEmoji("🎁")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    setLoading(true)
    try {
      await deleteShopItem(itemId)
      setDeleteConfirm(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Existing items */}
      {initialItems.length === 0 && !showForm && (
        <div className="bg-white rounded-3xl p-10 text-center space-y-4 shadow-sm">
          <div className="text-5xl">🛒</div>
          <p className="text-gray-600 font-medium">No shop items yet.</p>
          <p className="text-gray-400 text-sm">
            Add rewards that your kids can buy with stars!
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {initialItems.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800">{item.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-700 font-bold text-sm rounded-full px-3 py-1">
                {item.starCost} ⭐
              </span>
              {deleteConfirm === item.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={loading}
                    className="text-xs bg-red-500 text-white rounded-lg px-2 py-1 font-bold"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="text-xs bg-gray-100 text-gray-600 rounded-lg px-2 py-1 font-bold"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(item.id)}
                  className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                >
                  🗑
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add new item form */}
      {showForm ? (
        <div className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Add shop item</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {SHOP_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-xl p-1.5 rounded-xl transition-all ${
                      emoji === e ? "bg-orange-100 ring-2 ring-orange-400 scale-110" : "hover:bg-gray-100"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Reward name</label>
              <input
                name="name"
                type="text"
                required
                maxLength={100}
                placeholder="e.g. 30 min screen time"
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Star cost</label>
              <input
                name="starCost"
                type="number"
                min={1}
                max={1000}
                required
                defaultValue={5}
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-300 text-center font-semibold"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-2xl py-3 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl py-3 transition-colors"
              >
                {loading ? "Adding…" : "Add item"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl py-3 transition-colors text-sm"
        >
          + Add reward item
        </button>
      )}
    </div>
  )
}
