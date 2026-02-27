"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { deleteChild } from "@/app/actions/children"

interface ChildCardMenuProps {
  childId: string
  childName: string
  onEditPin: () => void
}

export default function ChildCardMenu({ childId, childName, onEditPin }: ChildCardMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [menuOpen])

  const handleEditPin = () => {
    setMenuOpen(false)
    onEditPin()
  }

  const handleDeleteClick = () => {
    setMenuOpen(false)
    setConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      await deleteChild(childId)
      setConfirmOpen(false)
      router.refresh()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((o) => !o)
          }}
          className="p-1.5 rounded-full text-gray-500 hover:bg-black/10 hover:text-gray-700 transition-colors"
          aria-label="More options"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="6" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="18" r="1.5" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-10">
            <button
              type="button"
              onClick={handleEditPin}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-gray-400">🔑</span>
              Edit pin
            </button>
            <Link
              href={`/dashboard/child/${childId}/edit`}
              onClick={() => setMenuOpen(false)}
              className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <span className="text-gray-400">✏️</span>
              Edit profile
            </Link>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <span className="text-red-400">🗑</span>
              Delete child
            </button>
          </div>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Delete {childName}?</h2>
            <p className="text-sm text-gray-600">
              This will permanently delete this child and all their goals and star history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold transition-colors"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
