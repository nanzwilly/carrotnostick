/** Emails that can view dashboard stats (e.g. who has signed up). */
export const STATS_VIEWER_EMAILS = [
  "nanzwilly@gmail.com",
]

export function canViewStats(email: string | null | undefined): boolean {
  if (!email) return false
  return STATS_VIEWER_EMAILS.includes(email.toLowerCase())
}
