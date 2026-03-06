"use client"

import type { ReactNode } from "react"

type ConfirmSubmitButtonProps = {
  confirmText: string
  className?: string
  children: ReactNode
}

export default function ConfirmSubmitButton({
  confirmText,
  className,
  children,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        const ok = window.confirm(confirmText)
        if (!ok) return
        const form = event.currentTarget.closest("form")
        form?.requestSubmit()
      }}
    >
      {children}
    </button>
  )
}
