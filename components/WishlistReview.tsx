"use client"

import { useState } from "react"
import { approveWishlistItem, dismissWishlistItem } from "@/app/actions/wishlist"
import { useRouter } from "next/navigation"
import type { ChildWishlistItem } from "@/lib/schema"

type WishlistGroup = {
  childId: string
  childName: string
  items: ChildWishlistItem[]
}

export default function WishlistReview({ wishlists }: { wishlists: WishlistGroup[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [starCost, setStarCost] = useState(5)

  const pendingWishlists = wishlists
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => i.status === "pending"),
    }))
    .filter((g) => g.items.length > 0)

  if (pendingWishlists.length === 0) return null

  const handleApprove = async (itemId: string) => {
    setLoading(itemId)
    try {
      await approveWishlistItem(itemId, starCost)
      setApprovingId(null)
      setStarCost(5)
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  const handleDismiss = async (itemId: string) => {
    setLoading(itemId)
    try {
      await dismissWishlistItem(itemId)
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">💫 Child Wishes</h2>
        <span className="bg-purple-100 text-purple-700 text-xs font-bold rounded-full px-2 py-0.5">
          {pendingWishlists.reduce((sum, g) => sum + g.items.length, 0)} new
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Your children suggested these rewards. Approve to add them to the shop with a star price, or dismiss.
      </p>

      {pendingWishlists.map((group) => (
        <div key={group.childId} className="space-y-2">
          <p className="text-sm font-semibold text-gray-600">{group.childName}&apos;s wishes:</p>
          {group.items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm px-5 py-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.emoji}</span>
                <p className="flex-1 font-semibold text-gray-800">{item.name}</p>
                {loading === item.id ? (
                  <span className="text-sm text-gray-400">...</span>
                ) : approvingId === item.id ? null : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setApprovingId(item.id); setStarCost(5) }}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg px-3 py-1.5 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDismiss(item.id)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-lg px-3 py-1.5 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>

              {/* Star cost picker when approving */}
              {approvingId === item.id && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <label className="text-sm font-medium text-green-700 whitespace-nowrap">Star cost:</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={starCost}
                    onChange={(e) => setStarCost(parseInt(e.target.value) || 1)}
                    className="w-20 border border-green-300 rounded-lg px-2 py-1 text-center font-bold text-green-800 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <span className="text-sm text-green-600">⭐</span>
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={loading === item.id}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg px-3 py-1.5 transition-colors"
                    >
                      Add to Shop
                    </button>
                    <button
                      onClick={() => setApprovingId(null)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-lg px-3 py-1.5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
