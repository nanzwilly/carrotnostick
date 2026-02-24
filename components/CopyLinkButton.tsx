"use client"

import { useState } from "react"

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-sm bg-white border border-gray-200 rounded-full px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-50 transition-colors"
      title={url}
    >
      {copied ? "✓ Copied!" : "🔗 Link"}
    </button>
  )
}
