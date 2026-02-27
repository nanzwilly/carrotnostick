import { readFileSync } from "fs"
import path from "path"
import { ImageResponse } from "next/og"

export const alt = "CarrotNoStick — Turn daily struggles into simple rewards your kids love!"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  const iconPath = path.join(process.cwd(), "app", "icon.png")
  const iconBuffer = readFileSync(iconPath)
  const iconDataUrl = `data:image/png;base64,${iconBuffer.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <img
          src={iconDataUrl}
          width={320}
          height={320}
          alt=""
          style={{ marginBottom: 24 }}
        />
        <span
          style={{
            fontSize: 48,
            color: "#111827",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          CarrotNoStick
        </span>
        <span
          style={{
            fontSize: 24,
            color: "#6b7280",
            fontWeight: 500,
            textAlign: "center",
            marginTop: 12,
          }}
        >
          Turn daily struggles into simple rewards your kids love!
        </span>
      </div>
    ),
    { ...size }
  )
}
