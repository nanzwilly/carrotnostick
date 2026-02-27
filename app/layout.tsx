import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://carrotnostick.com"

export const metadata: Metadata = {
  title: "CarrotNoStick",
  description: "Turn daily struggles into simple rewards your kids love!",
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: "CarrotNoStick",
    description: "Turn daily struggles into simple rewards your kids love!",
    url: baseUrl,
    siteName: "CarrotNoStick",
  },
  twitter: {
    card: "summary",
    title: "CarrotNoStick",
    description: "Turn daily struggles into simple rewards your kids love!",
  },
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
        <Analytics />
      </body>
    </html>
  )
}
