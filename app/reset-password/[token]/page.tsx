"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import LogoText from "@/components/Logo"
import { resetPasswordWithToken } from "@/app/actions/password-reset"

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useParams<{ token: string }>()
  const token = params?.token ?? ""

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const fd = new FormData(e.currentTarget)
    fd.set("token", token)
    const result = await resetPasswordWithToken(fd)
    setMsg({ ok: result.ok, text: result.message })
    setLoading(false)
    if (result.ok) {
      setTimeout(() => router.push("/login?passwordChanged=1"), 800)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="bg-white rounded-3xl shadow-sm p-10 w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl flex justify-center">
            <LogoText size="lg" />
          </h1>
          <p className="text-gray-500 text-sm">Set a new password</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="password"
            type="password"
            minLength={8}
            required
            placeholder="New password (min 8 chars)"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
          />
          <input
            name="confirmPassword"
            type="password"
            required
            placeholder="Confirm new password"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold rounded-2xl py-3 text-sm transition-colors"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>

        {msg && (
          <p className={`text-sm text-center ${msg.ok ? "text-green-600" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </div>
  )
}

