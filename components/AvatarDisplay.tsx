type Size = "sm" | "md" | "lg" | "xl"

const sizeMap: Record<Size, { animal: string; hat: string; glasses: string; offset: string }> = {
  sm: { animal: "text-2xl",  hat: "text-sm",  glasses: "text-xs",  offset: "-top-2" },
  md: { animal: "text-3xl",  hat: "text-base", glasses: "text-xs",  offset: "-top-2.5" },
  lg: { animal: "text-5xl",  hat: "text-2xl", glasses: "text-base", offset: "-top-4" },
  xl: { animal: "text-7xl",  hat: "text-4xl", glasses: "text-2xl",  offset: "-top-6" },
}

export default function AvatarDisplay({
  animal,
  hat,
  glasses,
  size = "md",
}: {
  animal: string
  hat?: string | null
  glasses?: string | null
  size?: Size
}) {
  const s = sizeMap[size]
  return (
    <span className="relative inline-flex flex-col items-center">
      {hat && (
        <span className={`${s.hat} leading-none absolute ${s.offset} left-1/2 -translate-x-1/2`} aria-hidden>
          {hat}
        </span>
      )}
      <span className={`${s.animal} leading-none`}>{animal}</span>
      {glasses && (
        <span className={`${s.glasses} leading-none absolute bottom-0 left-1/2 -translate-x-1/2`} aria-hidden>
          {glasses}
        </span>
      )}
    </span>
  )
}
