"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { registerUser } from "@/app/actions/auth"

type Tab = "signin" | "register"

const inputClass =
  "w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"

export default function InviteAuthForm({
  googleSignIn,
  acceptUrl,
}: {
  googleSignIn: () => Promise<void>
  acceptUrl: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("signin")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const result = await signIn("credentials", {
      email: fd.get("email") as string,
      password: fd.get("password") as string,
      redirect: false,
    })
    if (result?.error) {
      setError("Invalid email or password. Please try again.")
      setLoading(false)
    } else {
      router.push(acceptUrl)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const password = fd.get("password") as string
    const confirm = fd.get("confirm") as string
    if (password !== confirm) {
      setError("Passwords don't match.")
      setLoading(false)
      return
    }
    try {
      await registerUser(fd)
      // Auto sign-in after registration
      const result = await signIn("credentials", {
        email: fd.get("email") as string,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError("Account created! Please use the Sign In tab to continue.")
        setTab("signin")
        setLoading(false)
      } else {
        router.push(acceptUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Google sign-in */}
      <form action={googleSignIn}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-100" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 border-t border-gray-100" />
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-2xl bg-gray-100 p-1 gap-1">
        <button
          type="button"
          onClick={() => { setTab("signin"); setError("") }}
          className={
            tab === "signin"
              ? "flex-1 rounded-xl bg-white shadow-sm py-2 text-sm font-semibold text-gray-900 transition"
              : "flex-1 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
          }
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setTab("register"); setError("") }}
          className={
            tab === "register"
              ? "flex-1 rounded-xl bg-white shadow-sm py-2 text-sm font-semibold text-gray-900 transition"
              : "flex-1 py-2 text-sm text-gray-500 hover:text-gray-700 transition"
          }
        >
          Create Account
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Sign In form */}
      {tab === "signin" && (
        <form onSubmit={handleSignIn} className="space-y-3">
          <input name="email" type="email" placeholder="Email" required className={inputClass} />
          <input name="password" type="password" placeholder="Password" required className={inputClass} />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold rounded-2xl py-3 text-sm transition-colors"
          >
            {loading ? "Signing in…" : "Sign in & join family"}
          </button>
        </form>
      )}

      {/* Create Account form */}
      {tab === "register" && (
        <form onSubmit={handleRegister} className="space-y-3">
          <input name="name" type="text" placeholder="Your name (optional)" className={inputClass} />
          <input name="email" type="email" placeholder="Email" required className={inputClass} />
          <input name="password" type="password" placeholder="Password (min 8 characters)" required minLength={8} className={inputClass} />
          <input name="confirm" type="password" placeholder="Confirm password" required className={inputClass} />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold rounded-2xl py-3 text-sm transition-colors"
          >
            {loading ? "Creating account…" : "Create account & join family"}
          </button>
        </form>
      )}
    </div>
  )
}
