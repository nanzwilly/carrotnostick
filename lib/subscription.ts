export type SubStatus = "trialing" | "active" | "expired"

/**
 * Subscription status. Free access for everyone until we introduce pricing.
 * When pricing is introduced, we can restore trial/expired logic using
 * trialStartedAt and isPremium from the user table.
 */
export function getSubStatus(_user: {
  email?: string | null
  trialStartedAt: Date | null
  isPremium: boolean
}): { status: SubStatus; daysLeft?: number } {
  return { status: "active" }
}
