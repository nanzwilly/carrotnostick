"use client"

import { useState } from "react"
import { createRazorpaySubscription } from "@/app/actions/subscription"
import { useRouter } from "next/navigation"
import Script from "next/script"
import LogoText from "@/components/Logo"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

export default function UpgradePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleUpgrade() {
    setLoading(true)
    setError("")
    try {
      const { subscriptionId, keyId } = await createRazorpaySubscription()

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "CarrotNoStick",
        description: "Monthly subscription — all features included",
        image: "/icon.png",
        handler: function () {
          // Payment success — redirect back to dashboard
          router.push("/dashboard?upgraded=1")
        },
        theme: { color: "#f97316" },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <LogoText size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Aptos, "Segoe UI", system-ui, sans-serif' }}>
              Upgrade
            </h1>
            <p className="text-gray-600 mt-2">Keep all your family&apos;s progress, forever.</p>
          </div>

          {/* Pricing card */}
          <div className="bg-white rounded-2xl shadow-md border border-amber-100 overflow-hidden">
            <div className="bg-orange-400 text-white px-6 py-5 text-center">
              <div className="text-4xl font-black">₹299</div>
              <div className="text-orange-100 text-sm mt-1">per month · cancel anytime</div>
            </div>

            <div className="px-6 py-5 space-y-3">
              {[
                "✅ Unlimited children",
                "✅ Unlimited goals & stars",
                "✅ Co-parent access",
                "✅ Star requests from kids",
                "✅ All future features",
              ].map((feature) => (
                <div key={feature} className="text-gray-700 text-sm">{feature}</div>
              ))}
            </div>

            <div className="px-6 pb-6">
              {error && (
                <p className="text-red-600 text-sm mb-3 text-center">{error}</p>
              )}
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-orange-400 hover:bg-orange-500 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition-colors"
              >
                {loading ? "Opening checkout…" : "Subscribe with Razorpay →"}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                Secure payment powered by Razorpay
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 underline">
              ← Back to dashboard
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
