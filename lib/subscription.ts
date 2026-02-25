export type SubStatus = "trialing" | "active" | "expired"

/** Founder accounts — always active, forever free */
const FOUNDER_EMAILS = ["nanzwilly@gmail.com"]

export function getSubStatus(user: {
  email?: string | null
  trialStartedAt: Date | null
  isPremium: boolean
}): { status: SubStatus; daysLeft?: number } {
  // Founder bypass — always active
  if (user.email && FOUNDER_EMAILS.includes(user.email.toLowerCase())) {
    return { status: "active" }
  }

  if (user.isPremium) return { status: "active" }

  const start = user.trialStartedAt ?? new Date()
  const msLeft = start.getTime() + 30 * 86_400_000 - Date.now()
  const daysLeft = Math.ceil(msLeft / 86_400_000)

  if (daysLeft > 0) return { status: "trialing", daysLeft }
  return { status: "expired" }
}
