import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CarrotNoStick 🥕",
  description: "Turn daily struggles into simple rewards your kids love!",
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
