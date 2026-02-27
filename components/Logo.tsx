import Image from "next/image"

const sizeClasses = { sm: "h-8", md: "h-10", lg: "h-14" } as const

/**
 * CarrotNoStick logo — image (carrot + "Carrot" black, "NoStick" orange, Aptos font).
 */
export default function LogoText({
  size = "md",
  className = "",
}: {
  size?: keyof typeof sizeClasses
  className?: string
}) {
  return (
    <Image
      src="/logo.png"
      alt="CarrotNoStick"
      width={200}
      height={48}
      className={`${sizeClasses[size]} w-auto ${className}`.trim()}
      priority
    />
  )
}
