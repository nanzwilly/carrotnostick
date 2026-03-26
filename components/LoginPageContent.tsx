import Link from "next/link"

const STEPS = [
  {
    icon: "👶",
    title: "Add your child",
    description: "Create an avatar and set a simple login PIN for them.",
  },
  {
    icon: "🎯",
    title: "Set small goals",
    description: "Cleaning the bed, trying new foods, or finishing homework.",
  },
  {
    icon: "⭐",
    title: "Give stars for effort",
    description: "Kids track progress on their own page with fun rewards.",
  },
  {
    icon: "🎁",
    title: "Stars become rewards",
    description: "Exchange stars for experiences like treats or family time.",
  },
]

const WHY_IT_WORKS = [
  "Kids respond better to rewards than punishment",
  "Builds habits slowly, without pressure",
  "No more shouting, just gentle encouragement",
  "Gives kids a sense of achievement",
]

export default function LoginPageContent() {
  return (
    <div className="flex flex-col justify-center px-8 py-12 lg:px-12 xl:px-16 max-w-xl">
      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
        Make kids build good habits, without punishments
      </h2>
      <p className="text-sm text-orange-500 mt-1">
        100% free. Sign up now!
      </p>

      {/* How it works — vertical list with icons */}
      <div className="mt-10 rounded-2xl border border-gray-200 bg-gray-50/50 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-orange-500 uppercase tracking-wider">
          How it works
        </h3>
        <ol className="mt-4 relative">
          {/* Vertical line connecting icon centers */}
          <div
            className="absolute left-5 top-5 bottom-5 w-px bg-gray-200 -translate-x-1/2"
            aria-hidden
          />
          {STEPS.map((step, i) => (
            <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl">
                {step.icon}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="font-semibold text-gray-900">{step.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Why it works */}
      <div className="mt-10">
        <h3 className="text-sm font-semibold text-orange-500 uppercase tracking-wider">
          Why it works
        </h3>
        <ul className="mt-4 space-y-3">
          {WHY_IT_WORKS.map((text, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">
                ✓
              </span>
              <span className="text-sm text-gray-700">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-10">
        <Link
          href="#login"
          className="inline-block w-full rounded-xl bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 px-6 text-center transition-colors shadow-sm"
        >
          Get Started Now
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-12 text-center text-xs text-gray-400">
        © {new Date().getFullYear()}{" "}
        <span
          className="font-bold"
          style={{ fontFamily: 'Aptos, "Segoe UI", system-ui, sans-serif' }}
        >
          <span className="text-gray-900">Carrot</span>
          <span className="text-orange-600">NoStick</span>
        </span>
        . All rights reserved.
      </p>
    </div>
  )
}
