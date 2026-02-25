import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CarrotNoStick 🥕",
  description: "A star reward system for your family",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-amber-50 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
