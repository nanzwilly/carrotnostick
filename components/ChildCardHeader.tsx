"use client"

import { useState } from "react"
import AvatarDisplay from "@/components/AvatarDisplay"
import ChangeChildPinButton from "@/components/ChangeChildPinButton"
import ChildCardMenu from "@/components/ChildCardMenu"
import type { Child } from "@/lib/schema"

interface ChildCardHeaderProps {
  child: Child
  children: React.ReactNode
}

export default function ChildCardHeader({ child, children: actionRow }: ChildCardHeaderProps) {
  const [pinModalOpen, setPinModalOpen] = useState(false)

  return (
    <div className="px-6 pt-7 pb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <AvatarDisplay
          animal={child.avatarEmoji}
          hat={child.avatarHat}
          glasses={child.avatarGlasses}
          avatarConfig={child.avatarConfig}
          size="xl"
        />
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">{child.name}</h2>
          <ChangeChildPinButton
            childId={child.id}
            childName={child.name}
            open={pinModalOpen}
            onOpenChange={setPinModalOpen}
            hideTrigger
          />
          {/* Share and + Goal just below the name */}
          <div className="mt-2 flex flex-wrap gap-2">
            {actionRow}
          </div>
        </div>
      </div>
      <ChildCardMenu
        childId={child.id}
        childName={child.name}
        onEditPin={() => setPinModalOpen(true)}
      />
    </div>
  )
}
