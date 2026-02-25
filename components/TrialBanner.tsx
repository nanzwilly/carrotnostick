import Link from "next/link"
import type { SubStatus } from "@/lib/subscription"

interface TrialBannerProps {
  status: SubStatus
  daysLeft?: number | null
}

export default function TrialBanner({ status, daysLeft }: TrialBannerProps) {
  if (status === "active") return null

  if (status === "expired") {
    return (
      <div className="bg-red-600 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-3">
        <span>🚨 Your free trial has ended.</span>
        <Link
          href="/upgrade"
          className="underline font-semibold hover:no-underline whitespace-nowrap"
        >
          Upgrade now →
        </Link>
      </div>
    )
  }

  // trialing
  const days = daysLeft ?? 0

  if (days <= 2) {
    return (
      <div className="bg-red-500 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-3">
        <span>🚨 Only <strong>{days} day{days !== 1 ? "s" : ""}</strong> left in your free trial!</span>
        <Link href="/upgrade" className="underline font-semibold hover:no-underline">
          Upgrade →
        </Link>
      </div>
    )
  }

  if (days <= 7) {
    return (
      <div className="bg-amber-500 text-white text-center text-sm py-2 px-4 flex items-center justify-center gap-3">
        <span>⚠️ <strong>{days} days</strong> left in your free trial — don&apos;t lose your data.</span>
        <Link href="/upgrade" className="underline font-semibold hover:no-underline">
          Upgrade →
        </Link>
      </div>
    )
  }

  // > 7 days — subtle green
  return (
    <div className="bg-emerald-600 text-white text-center text-sm py-1.5 px-4 flex items-center justify-center gap-3">
      <span>✨ <strong>{days} days</strong> left in your free trial</span>
      <Link href="/upgrade" className="underline hover:no-underline opacity-80">
        Upgrade
      </Link>
    </div>
  )
}
