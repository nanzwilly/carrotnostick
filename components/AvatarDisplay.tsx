"use client"

import BigHeadAvatar, { type BigHeadConfig } from "./BigHeadAvatar"

type Size = "sm" | "md" | "lg" | "xl"

const sizeMap: Record<Size, { animal: string; hat: string; glasses: string; hatOffset: string; glassesTopPct: string }> = {
  sm: { animal: "text-3xl",  hat: "text-sm",  glasses: "text-xs",  hatOffset: "-top-2.5", glassesTopPct: "44%" },
  md: { animal: "text-4xl",  hat: "text-lg",  glasses: "text-xs",  hatOffset: "-top-3",   glassesTopPct: "44%" },
  lg: { animal: "text-6xl",  hat: "text-3xl", glasses: "text-lg",  hatOffset: "-top-5",   glassesTopPct: "44%" },
  xl: { animal: "text-7xl",  hat: "text-4xl", glasses: "text-2xl", hatOffset: "-top-6",   glassesTopPct: "44%" },
}

const bigHeadSizePx: Record<Size, number> = { sm: 40, md: 56, lg: 80, xl: 112 }

export default function AvatarDisplay({
  animal,
  hat,
  glasses,
  size = "md",
  avatarConfig,
}: {
  animal: string
  hat?: string | null
  glasses?: string | null
  size?: Size
  avatarConfig?: BigHeadConfig | null
}) {
  // BigHead takes priority over the legacy emoji avatar
  if (avatarConfig) {
    return <BigHeadAvatar config={avatarConfig} size={bigHeadSizePx[size]} />
  }

  // ── Legacy emoji fallback ──────────────────────────────────────────────────
  const s = sizeMap[size]
  return (
    <span className="relative inline-flex flex-col items-center">
      {hat && (
        <span
          className={`${s.hat} leading-none absolute ${s.hatOffset} left-1/2 -translate-x-1/2`}
          aria-hidden
        >
          {hat}
        </span>
      )}
      <span className={`${s.animal} leading-none`}>{animal}</span>
      {glasses && (
        <span
          className={`${s.glasses} leading-none absolute`}
          style={{
            top: s.glassesTopPct,
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          aria-hidden
        >
          {glasses}
        </span>
      )}
    </span>
  )
}
