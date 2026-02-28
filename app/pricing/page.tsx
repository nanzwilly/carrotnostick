import Link from "next/link"
import LogoText from "@/components/Logo"

const FEATURES = [
  "Unlimited children",
  "Unlimited goals & stars",
  "Co-parent access",
  "Star requests from kids",
  "All future features",
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <LogoText size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Aptos, "Segoe UI", system-ui, sans-serif' }}>
            Plans
          </h1>
          <p className="text-orange-500 font-medium mt-2">Free while we are in early access.</p>
          <p className="text-gray-600 text-sm mt-1">No credit card required to start.</p>
        </div>

        {/* Pricing card */}
        <div className="bg-white rounded-2xl shadow-md border border-amber-100 overflow-hidden">
          <div className="bg-orange-400 text-white px-6 py-5 text-center">
            <div className="text-2xl font-black leading-tight">Rs. 69 / month (when pricing is introduced)</div>
            <div className="text-orange-100 text-sm mt-2">Early users will get special pricing</div>
          </div>

          <div className="px-6 py-5 space-y-3">
            <p className="text-sm font-medium text-gray-700">Everything included:</p>
            {FEATURES.map((feature) => (
              <div key={feature} className="text-gray-700 text-sm flex items-center gap-2">
                <span className="text-green-500">✅</span>
                {feature}
              </div>
            ))}
          </div>

          <div className="px-6 pb-6">
            <Link
              href="/register"
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl text-center transition-colors"
            >
              Start free!
            </Link>
            <p className="text-center text-xs text-gray-400 mt-3">
              <Link href="/register" className="text-orange-500 hover:underline">
                Sign up for early access
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 underline">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
