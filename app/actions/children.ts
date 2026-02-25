"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { children } from "@/lib/schema"
import { eq, and, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getOwnerIdForUser } from "@/lib/family"
import type { BigHeadConfig } from "@/components/BigHeadAvatar"
import bcrypt from "bcryptjs"

/** Check if a stored PIN value is a bcrypt hash (legacy plaintext PINs are not) */
function isBcryptHash(value: string) {
  return value.startsWith("$2b$") || value.startsWith("$2a$")
}

export async function createChild(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const name = formData.get("name") as string
  const pin = formData.get("pin") as string
  const avatarEmoji = (formData.get("avatarEmoji") as string) || "🌟"
  const color = (formData.get("color") as string) || "#f97316"

  if (!name || !pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    throw new Error("PIN must be exactly 6 digits")
  }

  // Always attach the new child to the family owner (not the co-parent's own ID)
  const ownerId = await getOwnerIdForUser(session.user.id)

  const hashedPin = await bcrypt.hash(pin, 10)

  const [child] = await db
    .insert(children)
    .values({ parentId: ownerId, name, pin: hashedPin, avatarEmoji, color })
    .returning()

  revalidatePath("/dashboard")
  return child
}

export async function updateChildPin(childId: string, pin: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    throw new Error("PIN must be exactly 6 digits")
  }

  // Verify the child belongs to this parent's family
  const ownerId = await getOwnerIdForUser(session.user.id)
  const child = await db.query.children.findFirst({
    where: and(eq(children.id, childId), eq(children.parentId, ownerId)),
    columns: { id: true },
  })
  if (!child) throw new Error("Child not found")

  const hashedPin = await bcrypt.hash(pin, 10)
  await db.update(children).set({ pin: hashedPin }).where(eq(children.id, childId))
  revalidatePath("/dashboard")
}

export async function getChildrenForParent() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const ownerId = await getOwnerIdForUser(session.user.id)

  return db.query.children.findMany({
    where: eq(children.parentId, ownerId),
    with: {
      goals: {
        where: (goals, { eq }) => eq(goals.isActive, true),
        with: {
          starEvents: true,
          rewardRedemptions: true,
        },
      },
    },
    orderBy: (children, { asc }) => [asc(children.createdAt)],
  })
}

const MAX_PIN_ATTEMPTS = 5
const LOCK_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export type VerifyPinResult =
  | { status: "ok"; child: NonNullable<Awaited<ReturnType<typeof fetchChildWithGoals>>> }
  | { status: "locked"; minutesLeft: number }
  | { status: "invalid"; attemptsLeft: number }

async function fetchChildWithGoals(childId: string) {
  return db.query.children.findFirst({
    where: eq(children.id, childId),
    with: {
      goals: {
        where: (goals, { eq }) => eq(goals.isActive, true),
        with: {
          starEvents: true,
          rewardRedemptions: true,
          starRequests: {
            where: (sr, { eq }) => eq(sr.status, "pending"),
          },
        },
      },
    },
  })
}

export async function verifyChildPin(childId: string, pin: string): Promise<VerifyPinResult | null> {
  const child = await fetchChildWithGoals(childId)
  if (!child) return null

  // Check if account is locked
  if (child.pinLockedUntil && child.pinLockedUntil > new Date()) {
    const minutesLeft = Math.ceil((child.pinLockedUntil.getTime() - Date.now()) / 60_000)
    return { status: "locked", minutesLeft }
  }

  // Verify PIN — dual-mode: bcrypt for new PINs, plaintext fallback for legacy
  const valid = isBcryptHash(child.pin)
    ? await bcrypt.compare(pin, child.pin)
    : child.pin === pin

  if (valid) {
    // Reset counter on success
    if (child.pinFailedAttempts > 0 || child.pinLockedUntil) {
      await db.update(children)
        .set({ pinFailedAttempts: 0, pinLockedUntil: null })
        .where(eq(children.id, childId))
    }
    return { status: "ok", child }
  }

  // Wrong PIN — increment counter, lock if limit reached
  const newAttempts = child.pinFailedAttempts + 1
  const shouldLock = newAttempts >= MAX_PIN_ATTEMPTS
  await db.update(children)
    .set({
      pinFailedAttempts: newAttempts,
      pinLockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
    })
    .where(eq(children.id, childId))

  if (shouldLock) {
    return { status: "locked", minutesLeft: 24 * 60 }
  }
  return { status: "invalid", attemptsLeft: MAX_PIN_ATTEMPTS - newAttempts }
}

export async function updateChildAvatar(
  childId: string,
  avatarEmoji: string,
  avatarHat: string | null,
  avatarGlasses: string | null
) {
  // No parent auth — child updates their own avatar from the kid page.
  // childId is a UUID (not guessable), safe for a family app.
  await db
    .update(children)
    .set({ avatarEmoji, avatarHat, avatarGlasses })
    .where(eq(children.id, childId))
}

export async function saveBigHeadConfig(childId: string, config: BigHeadConfig) {
  // No parent auth — child saves their BigHead avatar from the kid page.
  // childId is a UUID (not guessable), safe for a family app.
  await db
    .update(children)
    .set({ avatarConfig: config })
    .where(eq(children.id, childId))
}

export async function getPendingRequests() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const ownerId = await getOwnerIdForUser(session.user.id)

  const parentChildren = await db.query.children.findMany({
    where: eq(children.parentId, ownerId),
    with: {
      starRequests: {
        where: (sr, { eq }) => eq(sr.status, "pending"),
        with: { goal: true },
        orderBy: (sr, { desc }) => [desc(sr.createdAt)],
      },
    },
  })

  // Flatten into a list with child info attached, newest first
  return parentChildren
    .flatMap((child) =>
      child.starRequests.map((req) => ({
        ...req,
        child: {
          id: child.id,
          name: child.name,
          avatarEmoji: child.avatarEmoji,
          color: child.color,
        },
      }))
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getChildByIdNoPin(childId: string) {
  // No auth, no PIN — childId is a UUID (not guessable), safe for a family app.
  // Used to restore a 30-day localStorage session without re-entering the PIN.
  const child = await db.query.children.findFirst({
    where: eq(children.id, childId),
    with: {
      goals: {
        where: (goals, { eq }) => eq(goals.isActive, true),
        with: {
          starEvents: true,
          rewardRedemptions: true,
          starRequests: {
            where: (sr, { eq }) => eq(sr.status, "pending"),
          },
        },
      },
    },
  })
  return child ?? null
}

export async function getSiblings(childId: string) {
  // No parent auth — childId is a UUID (not guessable), safe for a family app.
  const me = await db.query.children.findFirst({
    where: eq(children.id, childId),
    columns: { parentId: true },
  })
  if (!me) return []

  return db.query.children.findMany({
    where: and(eq(children.parentId, me.parentId), ne(children.id, childId)),
    with: {
      goals: {
        where: (g, { eq }) => eq(g.isActive, true),
        with: { starEvents: true, rewardRedemptions: true },
      },
    },
    orderBy: (c, { asc }) => [asc(c.createdAt)],
  })
}
