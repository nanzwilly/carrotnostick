"use client"

import { useState } from "react"
import Link from "next/link"
import LogoText from "@/components/Logo"
import { requestPasswordReset } from "@/app/actions/password-reset"

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMsg("")
    const result = await requestPasswordReset(new FormData(e.currentTarget))
    setMsg(result.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="bg-white rounded-3xl shadow-sm p-10 w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl flex justify-center">
            <LogoText size="lg" />
          </h1>
          <p className="text-gray-500 text-sm">Forgot your password?</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="Enter your account email"
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold rounded-2xl py-3 text-sm transition-colors"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {msg && (
          <p className="text-sm text-gray-600 text-center">{msg}</p>
        )}

        <p className="text-center text-xs text-gray-400">
          Back to{" "}
          <Link href="/login" className="text-yellow-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

