"use client"

import { useState, useEffect, useRef } from "react"
import { verifyChildPin, getSiblings, getChildByIdNoPin, saveBigHeadConfig } from "@/app/actions/children"
import { createStarRequest } from "@/app/actions/stars"
import { getShopItemsForChild, getShopBalance, purchaseShopItem } from "@/app/actions/shop"
import { getChildWishlist, addWishlistItem, removeWishlistItem } from "@/app/actions/wishlist"
import type { RewardShopItem, ChildWishlistItem } from "@/lib/schema"
import type { Child, Goal, StarEvent, RewardRedemption, StarRequest } from "@/lib/schema"
import { useParams } from "next/navigation"
import Link from "next/link"
import AvatarDisplay from "@/components/AvatarDisplay"
import LogoText from "@/components/Logo"
import BigHeadAvatar, {
  type BigHeadConfig,
  DEFAULT_BIGHEAD_CONFIG,
  EDITOR_CATEGORIES,
} from "@/components/BigHeadAvatar"
import HangmanGame from "@/components/HangmanGame"

type GoalWithEvents = Goal & {
  starEvents: StarEvent[]
  rewardRedemptions: RewardRedemption[]
  starRequests: StarRequest[]
}
type ChildWithGoals = Child & { goals: GoalWithEvents[] }

type SiblingGoal = Goal & { starEvents: StarEvent[]; rewardRedemptions: RewardRedemption[] }
type SiblingWithGoals = Child & { goals: SiblingGoal[] }

// Total unredeemed stars across all active goals
function computeTotalStars(goals: Array<{ starEvents: Array<{ quantity?: number | null }>; rewardRedemptions: unknown[]; starThreshold: number }>) {
  return goals.reduce(
    (sum, g) => sum + Math.max(0, g.starEvents.reduce((s, e) => s + (e.quantity ?? 1), 0) - g.rewardRedemptions.length * g.starThreshold),
    0
  )
}

function computeAwardedStars(goals: Array<{ starEvents: Array<{ quantity?: number | null }> }>) {
  return goals.reduce((sum, g) => sum + g.starEvents.reduce((s, e) => s + (e.quantity ?? 1), 0), 0)
}

export default function ChildPage() {
  const params = useParams()
  const childId = params.childId as string

  const [pin, setPin] = useState("")
  const [child, setChild] = useState<ChildWithGoals | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  // True while we check localStorage on first render (prevents PIN screen flash)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [showLoginConfetti, setShowLoginConfetti] = useState(false)
  const [newStarsCount, setNewStarsCount] = useState(0)
  const [confettiBursts, setConfettiBursts] = useState(0)
  const confettiTimeoutRef = useRef<number | null>(null)

  // ── Restore 30-day session from localStorage ────────────────────────────────
  useEffect(() => {
    const SESSION_KEY = `cns_child_${childId}`
    let cancelled = false

    const restore = async () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY)
        if (raw) {
          const { expiry } = JSON.parse(raw) as { expiry: number }
          if (expiry > Date.now()) {
            const result = await getChildByIdNoPin(childId)
            if (!cancelled && result) {
              const c = result as ChildWithGoals
              applyChildSessionData(c)
              localStorage.setItem(SESSION_KEY, JSON.stringify({ expiry: Date.now() + 30 * 24 * 60 * 60 * 1000 }))
            }
          }
        }
      } catch {
        // localStorage unavailable or corrupted — just show the PIN screen
      } finally {
        if (!cancelled) setSessionLoading(false)
      }
    }

    restore()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (confettiTimeoutRef.current) {
        window.clearTimeout(confettiTimeoutRef.current)
      }
    }
  }, [])

  // Track which goals this kid has already nudged this session
  const [nudgedGoals, setNudgedGoals] = useState<Set<string>>(new Set())

  // BigHead avatar editor
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const [activeCategory, setActiveCategory] = useState(EDITOR_CATEGORIES[0].key)
  const [editConfig, setEditConfig] = useState<BigHeadConfig>(DEFAULT_BIGHEAD_CONFIG)
  const [avatarSaving, setAvatarSaving] = useState(false)

  // Leaderboard
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [siblings, setSiblings] = useState<SiblingWithGoals[] | null>(null)
  const [siblingsLoading, setSiblingsLoading] = useState(false)

  // Shop
  const [showShop, setShowShop] = useState(false)
  const [shopItems, setShopItems] = useState<RewardShopItem[]>([])
  const [shopBalance, setShopBalance] = useState(0)
  const [shopLoading, setShopLoading] = useState(false)
  const [purchaseMsg, setPurchaseMsg] = useState("")

  // Hangman game
  const [showGame, setShowGame] = useState(false)
  const [gameUnlocked, setGameUnlocked] = useState(false)

  // Wishlist
  const [showWishlist, setShowWishlist] = useState(false)
  const [wishlistItems, setWishlistItems] = useState<ChildWishlistItem[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [wishName, setWishName] = useState("")
  const [wishEmoji, setWishEmoji] = useState("🎁")

  const applyChildSessionData = (c: ChildWithGoals) => {
    const alreadyNudged = new Set(
      c.goals.filter((g) => g.starRequests.length > 0).map((g) => g.id)
    )
    setNudgedGoals(alreadyNudged)
    setEditConfig(c.avatarConfig ?? DEFAULT_BIGHEAD_CONFIG)
    setChild(c)

    try {
      const seenKey = `cns_child_seen_stars_${childId}`
      const awardedStars = computeAwardedStars(c.goals)
      const prevRaw = localStorage.getItem(seenKey)
      const previousSeen = prevRaw ? Number(prevRaw) : 0

      if (Number.isFinite(previousSeen) && awardedStars > previousSeen) {
        const delta = awardedStars - previousSeen
        setNewStarsCount(delta)
        setConfettiBursts(Math.min(delta, 8))
        setShowLoginConfetti(true)
        setGameUnlocked(true)

        if (confettiTimeoutRef.current) {
          window.clearTimeout(confettiTimeoutRef.current)
        }
        confettiTimeoutRef.current = window.setTimeout(() => {
          setShowLoginConfetti(false)
          setConfettiBursts(0)
        }, 2200 + delta * 450)
      }

      localStorage.setItem(seenKey, String(awardedStars))
    } catch {
      // ignore localStorage issues
    }
  }

  const handleShowLeaderboard = async () => {
    setShowLeaderboard(true)
    if (siblings === null) {
      setSiblingsLoading(true)
      const data = await getSiblings(childId)
      setSiblings(data as SiblingWithGoals[])
      setSiblingsLoading(false)
    }
  }

  const handleShowShop = async () => {
    setShowShop(true)
    setPurchaseMsg("")
    setShopLoading(true)
    try {
      const [items, balance] = await Promise.all([
        getShopItemsForChild(childId),
        getShopBalance(childId),
      ])
      setShopItems(items)
      setShopBalance(balance)
    } finally {
      setShopLoading(false)
    }
  }

  const handlePurchase = async (itemId: string, itemName: string, cost: number) => {
    if (shopBalance < cost) {
      setPurchaseMsg("Not enough stars!")
      return
    }
    setShopLoading(true)
    try {
      await purchaseShopItem(childId, itemId)
      setShopBalance((b) => b - cost)
      setPurchaseMsg(`🎉 You got ${itemName}! Show your parent!`)
    } catch (err) {
      setPurchaseMsg(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setShopLoading(false)
    }
  }

  const handleShowWishlist = async () => {
    setShowWishlist(true)
    setWishlistLoading(true)
    try {
      const items = await getChildWishlist(childId)
      setWishlistItems(items)
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleAddWish = async () => {
    if (!wishName.trim()) return
    setWishlistLoading(true)
    try {
      const item = await addWishlistItem(childId, wishName, wishEmoji)
      setWishlistItems((prev) => [item, ...prev])
      setWishName("")
      setWishEmoji("🎁")
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleRemoveWish = async (itemId: string) => {
    setWishlistLoading(true)
    try {
      await removeWishlistItem(childId, itemId)
      setWishlistItems((prev) => prev.filter((i) => i.id !== itemId))
    } finally {
      setWishlistLoading(false)
    }
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = await verifyChildPin(childId, pin)
    if (!result) {
      setError("Something went wrong. Try again!")
      setLoading(false)
      return
    }
    if (result.status === "locked") {
      const hours = Math.floor(result.minutesLeft / 60)
      const mins = result.minutesLeft % 60
      const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} minutes`
      setError(`Too many wrong PINs 🔒 Try again in ${timeStr}.`)
      setPin("")
      setLoading(false)
      return
    }
    if (result.status === "invalid") {
      const left = result.attemptsLeft
      setError(
        left === 1
          ? "Wrong PIN — 1 try left before lockout! ⚠️"
          : `Wrong PIN. ${left} tries left.`
      )
      setPin("")
      setLoading(false)
      return
    }
    // status === "ok"
    const c = result.child as ChildWithGoals
    applyChildSessionData(c)
    try {
      localStorage.setItem(
        `cns_child_${childId}`,
        JSON.stringify({ expiry: Date.now() + 30 * 24 * 60 * 60 * 1000 })
      )
    } catch {}
    setLoading(false)
  }

  // ── Sign out ─────────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    try { localStorage.removeItem(`cns_child_${childId}`) } catch {}
    setChild(null)
    setPin("")
  }

  // ── Session restore loading splash ───────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">🥕</div>
      </div>
    )
  }

  // ── PIN entry screen ──────────────────────────────────────────────────────────
  if (!child) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm p-10 w-full max-w-xs text-center space-y-6">
          <div className="space-y-1">
            <h1 className="text-xl"><LogoText /></h1>
          </div>
          <p className="text-gray-500 text-sm">Enter your PIN to see your stars</p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4,6}"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              required
              autoFocus
              className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-2xl px-4 py-4 text-center text-3xl tracking-widest font-mono text-gray-900 focus:outline-none transition-colors"
            />
            {error && <p className="text-sm text-red-500 animate-bounce">{error}</p>}
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-2xl py-3 transition-colors text-lg"
            >
              {loading ? "…" : "Let me in ✨"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // The config to show in the header (live-updates as the editor changes)

  // ── Star view ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: child.color + "15" }}>
      {showLoginConfetti && (
        <LoginStarConfetti burstCount={confettiBursts} newStarsCount={newStarsCount} />
      )}

      {/* Top logo bar */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-white/60 px-4 py-3 text-center">
        <span className="font-bold text-gray-800 text-base tracking-tight">
          <LogoText />
        </span>
      </div>

      <div className="max-w-sm mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <button
            onClick={() => { setActiveCategory(EDITOR_CATEGORIES[0].key); setShowAvatarEditor(true) }}
            className="relative inline-block focus:outline-none group"
            title="Tap to change your look!"
          >
            <BigHeadAvatar config={editConfig} size={112} />
            <span className="absolute -bottom-1 -right-1 bg-white border border-gray-200 rounded-full text-sm px-1.5 py-0.5 shadow-sm opacity-80 group-hover:opacity-100 transition-opacity">✏️</span>
          </button>
          <h1 className="text-3xl font-black text-gray-900">{child.name}</h1>
          <p className="text-gray-500 text-sm">Your stars ⭐</p>
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* ── BigHead avatar editor modal ─────────────────────────────────────── */}
        {showAvatarEditor && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-2 pb-0">
            <div className="bg-white rounded-t-3xl w-full max-w-sm flex flex-col max-h-[90vh]">

              {/* Top bar */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
                <h2 className="text-lg font-bold text-gray-900">Your look 🎨</h2>
                <button
                  onClick={() => setShowAvatarEditor(false)}
                  className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              {/* Live preview */}
              <div className="flex justify-center pb-2 shrink-0">
                <BigHeadAvatar config={editConfig} size={160} />
              </div>

              {/* Category tab bar */}
              <div className="flex gap-2 px-4 pb-2 overflow-x-auto shrink-0 scrollbar-hide">
                {EDITOR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className={`shrink-0 flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeCategory === cat.key
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Options for selected category */}
              <div className="overflow-y-auto px-4 pb-4 pt-1 flex-1">
                <div className="flex flex-wrap gap-2">
                  {EDITOR_CATEGORIES.find((c) => c.key === activeCategory)?.options.map((opt) => {
                    const isSelected = editConfig[activeCategory as keyof BigHeadConfig] === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setEditConfig((prev) => ({ ...prev, [activeCategory]: opt.value }))}
                        className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                          isSelected
                            ? "bg-orange-500 text-white scale-105 shadow-sm"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Save button */}
              <div className="px-4 pb-5 pt-2 shrink-0">
                <button
                  disabled={avatarSaving}
                  onClick={async () => {
                    setAvatarSaving(true)
                    await saveBigHeadConfig(child.id, editConfig)
                    setChild((prev) => prev ? { ...prev, avatarConfig: editConfig } : prev)
                    setAvatarSaving(false)
                    setShowAvatarEditor(false)
                  }}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-2xl py-3 transition-colors text-base"
                >
                  {avatarSaving ? "Saving…" : "Save my look! 🎉"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Leaderboard modal ──────────────────────────────────────────────── */}
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
                      avatarEmoji: child.avatarEmoji,
                      avatarHat: child.avatarHat,
                      avatarGlasses: null,
                      avatarConfig: editConfig,
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
                      avatarConfig: s.avatarConfig ?? null,
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
                            entry.isMe ? "ring-2 ring-orange-400 bg-orange-50" : "bg-gray-50"
                          }`}
                        >
                          <span className="text-2xl w-8 text-center shrink-0">{medal}</span>
                          <AvatarDisplay
                            animal={entry.avatarEmoji}
                            hat={entry.avatarHat}
                            glasses={entry.avatarGlasses}
                            avatarConfig={entry.avatarConfig}
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
                          <span className="text-xl font-black shrink-0" style={{ color: entry.color }}>
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

        {/* ── Shop modal ────────────────────────────────────────────────────── */}
        {showShop && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-2 pb-0">
            <div className="bg-white rounded-t-3xl w-full max-w-sm p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">🛒 Reward Shop</h2>
                <button
                  onClick={() => setShowShop(false)}
                  className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 text-center">
                <p className="text-sm text-yellow-700">Your star balance</p>
                <p className="text-3xl font-black text-yellow-600">{shopBalance} ⭐</p>
              </div>

              {purchaseMsg && (
                <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-center text-sm text-green-700 font-medium">
                  {purchaseMsg}
                </div>
              )}

              {shopLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
              ) : shopItems.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="text-4xl">🏪</div>
                  <p className="text-gray-500 text-sm">No items in the shop yet. Ask your parent to add some!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {shopItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3"
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.starCost} ⭐</p>
                      </div>
                      <button
                        onClick={() => handlePurchase(item.id, item.name, item.starCost)}
                        disabled={shopLoading || shopBalance < item.starCost}
                        className={`text-sm font-bold rounded-full px-4 py-2 transition-colors ${
                          shopBalance >= item.starCost
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Buy
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Wishlist modal ─────────────────────────────────────────────── */}
        {showWishlist && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-2 pb-0">
            <div className="bg-white rounded-t-3xl w-full max-w-sm p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">💫 My Wishes</h2>
                <button
                  onClick={() => setShowWishlist(false)}
                  className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-gray-500">Tell your parent what rewards you&apos;d love!</p>

              {/* Add wish form */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {["🎁", "🍦", "🎮", "📱", "🎬", "🍕", "🧸", "⚽", "🎵", "🎢"].map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setWishEmoji(e)}
                      className={`text-lg p-1 rounded-lg transition-all ${
                        wishEmoji === e ? "bg-purple-200 ring-2 ring-purple-400 scale-110" : "hover:bg-purple-100"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={wishName}
                    onChange={(e) => setWishName(e.target.value)}
                    placeholder="I wish for..."
                    maxLength={100}
                    className="flex-1 border border-purple-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                  <button
                    onClick={handleAddWish}
                    disabled={wishlistLoading || !wishName.trim()}
                    className="bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white font-bold rounded-xl px-4 py-2 text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Wish list */}
              {wishlistLoading && wishlistItems.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
              ) : wishlistItems.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <div className="text-4xl">🌟</div>
                  <p className="text-gray-500 text-sm">No wishes yet. Add something you&apos;d love!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {wishlistItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                        item.status === "approved"
                          ? "bg-green-50 border border-green-200"
                          : item.status === "dismissed"
                          ? "bg-gray-50 border border-gray-200 opacity-60"
                          : "bg-gray-50"
                      }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                        {item.status === "approved" && (
                          <p className="text-xs text-green-600 font-medium">
                            Approved! {item.approvedStarCost} ⭐ in the shop
                          </p>
                        )}
                        {item.status === "dismissed" && (
                          <p className="text-xs text-gray-400">Maybe next time</p>
                        )}
                        {item.status === "pending" && (
                          <p className="text-xs text-purple-500">Waiting for parent...</p>
                        )}
                      </div>
                      {item.status === "pending" && (
                        <button
                          onClick={() => handleRemoveWish(item.id)}
                          disabled={wishlistLoading}
                          className="text-gray-400 hover:text-red-400 text-sm transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Hangman game modal ─────────────────────────────────────────── */}
        {showGame && (
          <HangmanGame color={child.color} onClose={() => setShowGame(false)} />
        )}

        {/* Game unlocked banner */}
        {gameUnlocked && !showGame && (
          <button
            onClick={() => { setShowGame(true); setGameUnlocked(false) }}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl px-4 py-4 text-center animate-pulse hover:animate-none transition-all"
          >
            <p className="text-lg font-black">🎮 Game Unlocked!</p>
            <p className="text-sm opacity-90">You earned a star — tap to play Hangman!</p>
          </button>
        )}

        {/* Goal cards */}
        {child.goals.length === 0 && (
          <div className="bg-white rounded-3xl p-8 text-center text-gray-400">
            No goals yet — ask your parent to add one!
          </div>
        )}

        {child.goals.map((goal) => {
          const totalStars = goal.starEvents.reduce((s, e) => s + (e.quantity ?? 1), 0)
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

        {/* Shop + Wishlist + Leaderboard buttons */}
        <div className="space-y-2">
          <button
            onClick={handleShowShop}
            className="w-full bg-white border-2 border-green-300 hover:bg-green-50 text-gray-700 font-bold rounded-2xl py-3 text-sm transition-colors flex items-center justify-center gap-2"
          >
            🛒 Reward Shop
          </button>
          <button
            onClick={handleShowWishlist}
            className="w-full bg-white border-2 border-purple-300 hover:bg-purple-50 text-gray-700 font-bold rounded-2xl py-3 text-sm transition-colors flex items-center justify-center gap-2"
          >
            💫 My Wishes
          </button>
          <button
            onClick={() => setShowGame(true)}
            className="w-full bg-white border-2 border-pink-300 hover:bg-pink-50 text-gray-700 font-bold rounded-2xl py-3 text-sm transition-colors flex items-center justify-center gap-2"
          >
            🎮 Play Hangman
          </button>
          <button
            onClick={handleShowLeaderboard}
            className="w-full bg-white border-2 border-yellow-300 hover:bg-yellow-50 text-gray-700 font-bold rounded-2xl py-3 text-sm transition-colors flex items-center justify-center gap-2"
          >
            🏆 See how the competition is doing
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4"><LogoText /></p>
      </div>
    </div>
  )
}

// ── Goal card ─────────────────────────────────────────────────────────────────

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
      <div className="flex items-center gap-2">
        <span className="text-2xl">{goal.emoji}</span>
        <p className="font-bold text-gray-800 text-lg">{goal.name}</p>
      </div>

      <ChildStarDisplay current={starsInCycle} total={goal.starThreshold} color={child.color} />

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
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
            <p className="text-amber-700 font-semibold text-sm">📨 Parent notified!</p>
            <p className="text-amber-500 text-xs mt-0.5">Waiting for them to give you a star…</p>
          </div>
        ) : (
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

      {goal.rewardRedemptions.length > 0 && (
        <p className="text-xs text-center text-gray-400">
          🏆 You&apos;ve earned this reward {goal.rewardRedemptions.length}× already!
        </p>
      )}
    </div>
  )
}

// ── Star display ──────────────────────────────────────────────────────────────

function ChildStarDisplay({ current, total, color }: { current: number; total: number; color: string }) {
  const starSize = total <= 5 ? "2rem" : total <= 10 ? "1.6rem" : total <= 20 ? "1.25rem" : "1rem"

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {/* Star grid */}
      <div className="flex flex-wrap justify-center" style={{ gap: "4px", maxWidth: "14rem" }}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className="select-none transition-all duration-300"
            style={{
              fontSize: starSize,
              lineHeight: 1,
              color: i < current ? color : "#d1d5db",
            }}
          >
            {i < current ? "★" : "☆"}
          </span>
        ))}
      </div>

      {total > 10 && (
        <div className="w-full px-4">
          <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((current / total) * 100, 100)}%`, backgroundColor: color }}
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

function LoginStarConfetti({
  burstCount,
  newStarsCount,
}: {
  burstCount: number
  newStarsCount: number
}) {
  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
      {Array.from({ length: burstCount }).map((_, burstIndex) =>
        Array.from({ length: 16 }).map((_, pieceIndex) => {
          const left = (burstIndex * 13 + pieceIndex * 7) % 100
          const delay = burstIndex * 0.45 + (pieceIndex % 5) * 0.05
          const duration = 1.4 + (pieceIndex % 4) * 0.2
          const symbol = pieceIndex % 3 === 0 ? "⭐" : pieceIndex % 3 === 1 ? "✨" : "🎉"

          return (
            <span
              key={`${burstIndex}-${pieceIndex}`}
              className="confetti-piece absolute top-0 text-2xl"
              style={{
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            >
              {symbol}
            </span>
          )
        })
      )}

      <div className="absolute top-16 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 shadow-sm border border-amber-100">
        <p className="text-sm font-bold text-amber-600">
          +{newStarsCount} new star{newStarsCount === 1 ? "" : "s"} earned!
        </p>
      </div>
    </div>
  )
}


