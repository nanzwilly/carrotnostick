"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"

function CelebratePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  const reward = searchParams.get("reward") ?? "your reward"
  const name = searchParams.get("name") ?? "You"
  const emoji = searchParams.get("emoji") ?? "🌟"
  const childId = params.childId as string

  useEffect(() => {
    setTimeout(() => setShow(true), 100)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-300 to-orange-400 flex items-center justify-center px-4">
      {/* Confetti dots */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
              fontSize: `${1 + Math.random() * 2}rem`,
            }}
          >
            {["⭐", "🎉", "✨", "🌟", "🎊"][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      {/* Card */}
      <div
        className={`bg-white rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center space-y-6 transition-all duration-700 ${
          show ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
      >
        {/* Avatar */}
        <div className="text-7xl animate-bounce">{emoji}</div>

        {/* Name */}
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-gray-900">{name}!</h1>
          <p className="text-gray-500 text-lg font-medium">You earned it! 🥳</p>
        </div>

        {/* Stars */}
        <div className="text-5xl tracking-widest">⭐⭐⭐⭐⭐</div>

        {/* Reward */}
        <div className="bg-orange-50 rounded-2xl px-6 py-4 space-y-1">
          <p className="text-sm text-orange-500 font-semibold uppercase tracking-wide">Your reward</p>
          <p className="text-2xl font-black text-gray-900">{reward}</p>
        </div>

        {/* Screenshot prompt */}
        <div className="bg-gray-50 rounded-2xl px-4 py-3">
          <p className="text-sm text-gray-500">
            📸 Screenshot this and show your parent!
          </p>
        </div>

        {/* Back button */}
        <Link
          href={`/child/${childId}`}
          className="block text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Back to my stars
        </Link>
      </div>
    </div>
  )
}

export default function CelebratePageWrapper() {
  return (
    <Suspense>
      <CelebratePage />
    </Suspense>
  )
}
