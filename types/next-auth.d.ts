import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isPremium: boolean
      trialStartedAt: string | null
      subStatus: string  // "trialing" | "active" | "expired"
      subDaysLeft: number | null
    }
  }
}
