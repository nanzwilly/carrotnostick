"use client"

import { useState } from "react"
import { updateName, updatePassword } from "@/app/actions/user"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function PreferencesForm({
  currentName,
  currentEmail,
  hasPassword,
}: {
  currentName: string
  currentEmail: string
  hasPassword: boolean
}) {
  const router = useRouter()

  // Name section state
  const [nameLoading, setNameLoading] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Password section state
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const handleName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setNameLoading(true)
    setNameMsg(null)
    try {
      await updateName(new FormData(e.currentTarget))
      setNameMsg({ ok: true, text: "Name updated!" })
      router.refresh()
    } catch (err) {
      setNameMsg({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" })
    } finally {
      setNameLoading(false)
    }
  }

  const handlePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPwLoading(true)
    setPwMsg(null)
    try {
      await updatePassword(new FormData(e.currentTarget))
      // Sign out and redirect to login — user must sign in with their new password
      await signOut({ callbackUrl: "/login?passwordChanged=1" })
    } catch (err) {
      setPwMsg({ ok: false, text: err instanceof Error ? err.message : "Something went wrong" })
      setPwLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Name ── */}
      <section className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Display name</h2>

        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">Email: </span>
          {currentEmail}
        </div>

        <form onSubmit={handleName} className="space-y-3">
          <input
            name="name"
            type="text"
            defaultValue={currentName}
            placeholder="Your name"
            required
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
          />
          {nameMsg && (
            <p className={`text-sm ${nameMsg.ok ? "text-green-600" : "text-red-600"}`}>
              {nameMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={nameLoading}
            className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold rounded-2xl px-5 py-2.5 text-sm transition-colors"
          >
            {nameLoading ? "Saving…" : "Save name"}
          </button>
        </form>
      </section>

      {/* ── Password ── */}
      <section className="bg-white rounded-3xl shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Password</h2>

        {!hasPassword ? (
          <p className="text-sm text-gray-500">
            Your account uses Google sign-in — no password to change.
          </p>
        ) : (
          <form onSubmit={handlePassword} className="space-y-3">
            <input
              name="currentPassword"
              type="password"
              placeholder="Current password"
              required
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
            />
            <input
              name="newPassword"
              type="password"
              placeholder="New password (min 8 characters)"
              required
              minLength={8}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              required
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
            />
            {pwMsg && (
              <p className={`text-sm ${pwMsg.ok ? "text-green-600" : "text-red-600"}`}>
                {pwMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold rounded-2xl px-5 py-2.5 text-sm transition-colors"
            >
              {pwLoading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
