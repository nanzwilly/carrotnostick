/**
 * LogoText — 🥕 Carrot · NoStick
 * The carrot emoji and orange dot are baked in.
 * Font size, weight, and colour context come from the parent element.
 */
export default function LogoText() {
  return (
    <span className="font-bold tracking-tight whitespace-nowrap text-gray-900">
      <span style={{ fontSize: '1.5em', lineHeight: 1, display: 'inline-block', verticalAlign: 'middle', marginRight: '0.15em' }}>🥕</span>Carrot<span className="text-orange-400">·</span>NoStick
    </span>
  )
}
