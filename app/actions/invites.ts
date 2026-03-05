"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { coParentInvites, coParents } from "@/lib/schema"
import { eq, and, gt, isNull } from "drizzle-orm"
import { getOwnerIdForUser } from "@/lib/family"

/** Generate an invite token for the current user's family. Invalidates any prior unused token. */
export async function createInviteToken(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const ownerId = await getOwnerIdForUser(session.user.id)
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  // Soft-invalidate any previous unused token for this owner
  await db
    .update(coParentInvites)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(coParentInvites.ownerId, ownerId),
        isNull(coParentInvites.usedAt)
      )
    )

  await db.insert(coParentInvites).values({ token, ownerId, expiresAt })
  return token
}

/** Load invite info for the acceptance page (public — no auth required). */
export async function getInviteByToken(token: string) {
  try {
    const invite = await db.query.coParentInvites.findFirst({
      where: eq(coParentInvites.token, token),
      with: { owner: true },
    })
    if (!invite) return null
    const expired = !!invite.usedAt || invite.expiresAt < new Date()
    return { ...invite, expired }
  } catch {
    // Public invite pages should fail closed and render an "expired" state,
    // not surface a 500 to visitors.
    return null
  }
}

/** Consume the invite after the co-parent has authenticated. */
export async function acceptInvite(token: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const invite = await db.query.coParentInvites.findFirst({
    where: and(
      eq(coParentInvites.token, token),
      isNull(coParentInvites.usedAt),
      gt(coParentInvites.expiresAt, new Date())
    ),
  })
  if (!invite) throw new Error("Invite not found or already used")
  if (invite.ownerId === session.user.id) throw new Error("You cannot join your own family")

  // Idempotent: skip insert if already a co-parent
  const existing = await db.query.coParents.findFirst({
    where: and(
      eq(coParents.ownerId, invite.ownerId),
      eq(coParents.coParentId, session.user.id)
    ),
  })
  if (!existing) {
    await db.insert(coParents).values({
      ownerId: invite.ownerId,
      coParentId: session.user.id,
    })
  }

  // Mark invite as used
  await db
    .update(coParentInvites)
    .set({ usedAt: new Date(), usedBy: session.user.id })
    .where(eq(coParentInvites.token, token))
}
