import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import ProfileDropdown from "@/components/ProfileDropdown"
import LogoText from "@/components/Logo"

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
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">🥕</span>
            <span className="font-bold text-gray-900 text-lg tracking-tight">
              <LogoText />
            </span>
          </Link>

          <ProfileDropdown user={session.user} signOut={handleSignOut} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
