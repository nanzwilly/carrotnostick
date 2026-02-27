import { readFileSync } from "fs"
import path from "path"
import { ImageResponse } from "next/og"

export const alt = "CarrotNoStick — Turn daily struggles into simple rewards your kids love!"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  const logoPath = path.join(process.cwd(), "public", "logo.png")
  const logoBuffer = readFileSync(logoPath)
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`

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
          src={logoDataUrl}
          width={360}
          height={86}
          alt=""
          style={{ marginBottom: 24 }}
        />
        <span
          style={{
            fontSize: 28,
            color: "#6b7280",
            fontWeight: 500,
            textAlign: "center",
            maxWidth: 600,
          }}
        >
          Turn daily struggles into simple rewards your kids love!
        </span>
      </div>
    ),
    { ...size }
  )
}
