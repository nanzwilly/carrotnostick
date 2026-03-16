"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { childWishlistItems, children, rewardShopItems } from "@/lib/schema"
import { eq, and, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getOwnerIdForUser } from "@/lib/family"
import { createNotification } from "./notifications"

// ─── Child actions ──────────────────────────────────────────────────────────

export async function addWishlistItem(childId: string, name: string, emoji: string) {
  const trimmed = name.trim()
  if (!trimmed || trimmed.length === 0) throw new Error("Name is required")
  if (trimmed.length > 100) throw new Error("Name must be 100 characters or less")

  // Verify child exists
  const child = await db.query.children.findFirst({
    where: eq(children.id, childId),
    columns: { id: true, parentId: true, name: true },
  })
  if (!child) throw new Error("Child not found")

  const [item] = await db
    .insert(childWishlistItems)
    .values({ childId, name: trimmed, emoji: emoji || "🎁" })
    .returning()

  // Notify parent
  await createNotification({
    userId: child.parentId,
    type: "wishlist",
    title: `${child.name} added a wish!`,
    body: `${emoji || "🎁"} ${trimmed}`,
    childId,
  })

  return item
}

export async function removeWishlistItem(childId: string, itemId: string) {
  // Ensure item belongs to this child
  const item = await db.query.childWishlistItems.findFirst({
    where: and(eq(childWishlistItems.id, itemId), eq(childWishlistItems.childId, childId)),
  })
  if (!item) throw new Error("Wish not found")

  await db.delete(childWishlistItems).where(eq(childWishlistItems.id, itemId))
}

export async function getChildWishlist(childId: string) {
  return db.query.childWishlistItems.findMany({
    where: eq(childWishlistItems.childId, childId),
    orderBy: [desc(childWishlistItems.createdAt)],
  })
}

// ─── Parent actions ─────────────────────────────────────────────────────────

export async function getWishlistsForParent() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const ownerId = await getOwnerIdForUser(session.user.id)

  // Get all children for this parent
  const parentChildren = await db.query.children.findMany({
    where: eq(children.parentId, ownerId),
    columns: { id: true, name: true },
  })

  if (parentChildren.length === 0) return []

  // Get all wishlist items for these children
  const results = await Promise.all(
    parentChildren.map(async (child) => {
      const items = await db.query.childWishlistItems.findMany({
        where: eq(childWishlistItems.childId, child.id),
        orderBy: [desc(childWishlistItems.createdAt)],
      })
      return { childId: child.id, childName: child.name, items }
    })
  )

  // Only return children that have wishlist items
  return results.filter((r) => r.items.length > 0)
}

export async function approveWishlistItem(itemId: string, starCost: number) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const ownerId = await getOwnerIdForUser(session.user.id)

  if (starCost < 1 || starCost > 1000) throw new Error("Star cost must be between 1 and 1000")

  // Get the item and verify parent owns the child
  const item = await db.query.childWishlistItems.findFirst({
    where: eq(childWishlistItems.id, itemId),
    with: { child: { columns: { parentId: true } } },
  })
  if (!item || item.child.parentId !== ownerId) throw new Error("Item not found")

  // Create the shop item
  await db.insert(rewardShopItems).values({
    parentId: ownerId,
    name: item.name,
    emoji: item.emoji,
    starCost,
  })

  // Mark wishlist item as approved
  await db
    .update(childWishlistItems)
    .set({ status: "approved", approvedStarCost: starCost })
    .where(eq(childWishlistItems.id, itemId))

  revalidatePath("/dashboard/shop")
  revalidatePath("/dashboard/wishlist")
}

export async function dismissWishlistItem(itemId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const ownerId = await getOwnerIdForUser(session.user.id)

  const item = await db.query.childWishlistItems.findFirst({
    where: eq(childWishlistItems.id, itemId),
    with: { child: { columns: { parentId: true } } },
  })
  if (!item || item.child.parentId !== ownerId) throw new Error("Item not found")

  await db
    .update(childWishlistItems)
    .set({ status: "dismissed" })
    .where(eq(childWishlistItems.id, itemId))

  revalidatePath("/dashboard/wishlist")
}
