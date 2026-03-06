import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import ProfileDropdown from "@/components/ProfileDropdown"
import LogoText from "@/components/Logo"
import { canViewStats } from "@/lib/stats-access"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  async function handleSignOut() {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <LogoText size="lg" />
          </Link>

          <ProfileDropdown
            user={session.user}
            signOut={handleSignOut}
            showStatsLink={canViewStats(session.user.email)}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
