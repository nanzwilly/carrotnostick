/**
 * LogoText — 🥕 Carrot · NoStick
 * The carrot emoji and orange dot are baked in.
 * Font size, weight, and colour context come from the parent element.
 */
export default function LogoText() {
  return (
    <span className="inline-flex items-baseline gap-1.5 font-bold tracking-tight">
      <span className="text-[1.5em] leading-none">🥕</span>
      <span className="text-gray-900">
        Carrot<span className="text-orange-400">·</span>NoStick
      </span>
    </span>
  )
}
