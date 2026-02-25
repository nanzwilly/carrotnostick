"use client"

import { useState } from "react"
import { updateChildPin } from "@/app/actions/children"

export default function ChangeChildPinButton({ childId, childName }: { childId: string; childName: string }) {
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleClose = () => {
    setOpen(false)
    setPin("")
    setConfirm("")
    setError("")
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin !== confirm) {
      setError("PINs don't match")
      return
    }
    setLoading(true)
    setError("")
    try {
      await updateChildPin(childId, pin)
      setSuccess(true)
      setTimeout(handleClose, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-center text-xl font-mono tracking-widest text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-orange-500 transition-colors font-medium"
        title={`Change ${childName}'s PIN`}
      >
        🔑 Change PIN
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Change {childName}&apos;s PIN</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-sm"
              >
                ✕
              </button>
            </div>

            {success ? (
              <div className="text-center py-4 space-y-2">
                <div className="text-3xl">✅</div>
                <p className="text-green-700 font-semibold text-sm">PIN updated!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">New 6-digit PIN</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    required
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Confirm PIN</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    required
                    className={inputClass}
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || pin.length !== 6 || confirm.length !== 6}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold rounded-2xl py-2.5 text-sm transition-colors"
                >
                  {loading ? "Saving…" : "Save new PIN"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
