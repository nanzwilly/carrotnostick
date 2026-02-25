/**
 * LogoText — 🥕 Carrot · NoStick
 * The carrot emoji and orange dot are baked in.
 * Font size, weight, and colour context come from the parent element.
 */
export default function LogoText() {
  return (
    <span className="inline-flex items-center gap-1.5 font-bold tracking-tight">
      <span>🥕</span>
      <span className="text-gray-900">
        Carrot
        <span
          className="text-orange-400 inline-block relative"
          style={{ top: "0.15em" }}
        >
          ·
        </span>
        NoStick
      </span>
    </span>
  )
}
