"use client"

import { useState } from "react"
import { createInviteToken } from "@/app/actions/invites"

export default function InviteButton() {
  const [state, setState] = useState<"idle" | "loading" | "copied">("idle")

  const handleInvite = async () => {
    setState("loading")
    try {
      const token = await createInviteToken()
      const origin =
        process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
      const url = `${origin}/invite/${token}`
      await navigator.clipboard.writeText(url)
      setState("copied")
      setTimeout(() => setState("idle"), 3000)
    } catch {
      setState("idle")
    }
  }

  return (
    <button
      onClick={handleInvite}
      disabled={state !== "idle"}
      className="text-sm bg-white border border-gray-200 rounded-full px-4 py-2 font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60 whitespace-nowrap text-center"
    >
      {state === "loading"
        ? "Generating…"
        : state === "copied"
        ? "✓ Invite link copied!"
        : "👥 Invite co-parent"}
    </button>
  )
}
