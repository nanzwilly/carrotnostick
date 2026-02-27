import { ImageResponse } from "next/og"

export const alt = "CarrotNoStick — Turn daily struggles into simple rewards your kids love!"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 72,
          background: "linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#9a3412",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 800,
        }}
      >
        <span style={{ fontSize: 120, marginBottom: 16 }}>🥕</span>
        <span>CarrotNoStick</span>
        <span style={{ fontSize: 32, fontWeight: 500, marginTop: 12, color: "#b45309" }}>
          Turn daily struggles into simple rewards your kids love!
        </span>
      </div>
    ),
    { ...size }
  )
}
