"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { children } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getOwnerIdForUser } from "@/lib/family"

export async function createChild(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const name = formData.get("name") as string
  const pin = formData.get("pin") as string
  const avatarEmoji = (formData.get("avatarEmoji") as string) || "🌟"
  const color = (formData.get("color") as string) || "#f97316"

  if (!name || !pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    throw new Error("Invalid name or PIN")
  }

  // Always attach the new child to the family owner (not the co-parent's own ID)
  const ownerId = await getOwnerIdForUser(session.user.id)

  const [child] = await db
    .insert(children)
    .values({ parentId: ownerId, name, pin, avatarEmoji, color })
    .returning()

  revalidatePath("/dashboard")
  return child
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

export async function verifyChildPin(childId: string, pin: string) {
  const child = await db.query.children.findFirst({
    where: and(eq(children.id, childId), eq(children.pin, pin)),
    with: {
      goals: {
        where: (goals, { eq }) => eq(goals.isActive, true),
        with: {
          starEvents: true,
          rewardRedemptions: true,
          // Include pending nudges so the kid page knows which goals are already nudged
          starRequests: {
            where: (sr, { eq }) => eq(sr.status, "pending"),
          },
        },
      },
    },
  })
  return child ?? null
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
