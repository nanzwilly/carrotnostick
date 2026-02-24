import { db } from "@/lib/db"
import { coParents } from "@/lib/schema"
import { eq, and } from "drizzle-orm"

/**
 * Returns the "owner" user ID for the given userId.
 * - If userId is a co-parent, returns that co-parent's owner ID.
 * - If userId is a family owner (or unrelated), returns userId unchanged.
 */
export async function getOwnerIdForUser(userId: string): Promise<string> {
  const coParentRow = await db.query.coParents.findFirst({
    where: eq(coParents.coParentId, userId),
  })
  return coParentRow ? coParentRow.ownerId : userId
}

/**
 * Returns true if userId is allowed to act on the given owner's family.
 * Covers both: userId is the owner, or userId is a registered co-parent.
 */
export async function canAccessFamily(userId: string, ownerId: string): Promise<boolean> {
  if (userId === ownerId) return true
  const row = await db.query.coParents.findFirst({
    where: and(
      eq(coParents.ownerId, ownerId),
      eq(coParents.coParentId, userId)
    ),
  })
  return row !== null
}
