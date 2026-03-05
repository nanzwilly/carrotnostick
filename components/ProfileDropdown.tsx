"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

type User = {
  name?: string | null
  email?: string | null
  image?: string | null
}

export default function ProfileDropdown({
  user,
  signOut,
  showStatsLink = false,
}: {
  user: User
  signOut: () => Promise<void>
  showStatsLink?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const initial = (user.name ?? user.email ?? "?")[0].toUpperCase()

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full hover:bg-amber-50 px-2 py-1 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {user.image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? ""}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-yellow-400 text-white font-bold text-sm flex items-center justify-center">
            {initial}
          </span>
        )}
        <span className="text-sm text-gray-700 font-medium hidden sm:block max-w-[120px] truncate">
          {user.name ?? user.email}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {user.name ?? "—"}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {showStatsLink && (
              <Link
                href="/dashboard/stats"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
              >
                <span>📊</span>
                Stats
              </Link>
            )}
            <Link
              href="/dashboard/preferences"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
            >
              <span>⚙️</span>
              Preferences
            </Link>
            <a
              href="mailto:carrotnostick@zohomail.in"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
            >
              <span>✉️</span>
              Support
            </a>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 transition-colors"
              >
                <span>👋</span>
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
