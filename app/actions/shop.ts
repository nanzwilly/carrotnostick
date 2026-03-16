"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { rewardShopItems, shopPurchases, starEvents, children } from "@/lib/schema"
import { eq, and, sum } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getOwnerIdForUser } from "@/lib/family"

// ─── Parent actions ──────────────────────────────────────────────────────────

export async function createShopItem(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const ownerId = await getOwnerIdForUser(session.user.id)

  const name = (formData.get("name") as string)?.trim()
  const emoji = (formData.get("emoji") as string) || "🎁"
  const starCost = parseInt(formData.get("starCost") as string) || 1

  if (!name || name.length === 0) throw new Error("Item name is required")
  if (name.length > 100) throw new Error("Name must be 100 characters or less")
  if (emoji.length > 10) throw new Error("Emoji too long")
  if (starCost < 1 || starCost > 1000) throw new Error("Star cost must be between 1 and 1000")

  const [item] = await db
    .insert(rewardShopItems)
    .values({ parentId: ownerId, name, emoji, starCost })
    .returning()

  revalidatePath("/dashboard/shop")
  return item
}

export async function updateShopItem(itemId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const ownerId = await getOwnerIdForUser(session.user.id)

  const item = await db.query.rewardShopItems.findFirst({
    where: and(eq(rewardShopItems.id, itemId), eq(rewardShopItems.parentId, ownerId)),
  })
  if (!item) throw new Error("Item not found")

  const name = (formData.get("name") as string)?.trim()
  const emoji = (formData.get("emoji") as string) || "🎁"
  const starCost = parseInt(formData.get("starCost") as string) || 1

  if (!name || name.length === 0) throw new Error("Item name is required")
  if (name.length > 100) throw new Error("Name must be 100 characters or less")
  if (starCost < 1 || starCost > 1000) throw new Error("Star cost must be between 1 and 1000")

  await db
    .update(rewardShopItems)
    .set({ name, emoji, starCost })
    .where(eq(rewardShopItems.id, itemId))

  revalidatePath("/dashboard/shop")
}

export async function deleteShopItem(itemId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const ownerId = await getOwnerIdForUser(session.user.id)

  const item = await db.query.rewardShopItems.findFirst({
    where: and(eq(rewardShopItems.id, itemId), eq(rewardShopItems.parentId, ownerId)),
  })
  if (!item) throw new Error("Item not found")

  await db.delete(rewardShopItems).where(eq(rewardShopItems.id, itemId))
  revalidatePath("/dashboard/shop")
}

export async function getShopItems() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const ownerId = await getOwnerIdForUser(session.user.id)

  return db.query.rewardShopItems.findMany({
    where: and(eq(rewardShopItems.parentId, ownerId), eq(rewardShopItems.isActive, true)),
    orderBy: (items, { asc }) => [asc(items.starCost)],
  })
}

// ─── Child actions ───────────────────────────────────────────────────────────

export async function getShopBalance(childId: string): Promise<number> {
  // Total stars earned (sum of quantities)
  const [earned] = await db
    .select({ total: sum(starEvents.quantity) })
    .from(starEvents)
    .where(eq(starEvents.childId, childId))

  // Total stars spent in shop
  const [spent] = await db
    .select({ total: sum(shopPurchases.starCost) })
    .from(shopPurchases)
    .where(eq(shopPurchases.childId, childId))

  return Number(earned?.total ?? 0) - Number(spent?.total ?? 0)
}

export async function getShopItemsForChild(childId: string) {
  // Get parent ID for this child
  const child = await db.query.children.findFirst({
    where: eq(children.id, childId),
    columns: { parentId: true },
  })
  if (!child) return []

  return db.query.rewardShopItems.findMany({
    where: and(eq(rewardShopItems.parentId, child.parentId), eq(rewardShopItems.isActive, true)),
    orderBy: (items, { asc }) => [asc(items.starCost)],
  })
}

export async function purchaseShopItem(childId: string, itemId: string) {
  // Get the item
  const child = await db.query.children.findFirst({
    where: eq(children.id, childId),
    columns: { id: true, parentId: true },
  })
  if (!child) throw new Error("Child not found")

  const item = await db.query.rewardShopItems.findFirst({
    where: and(eq(rewardShopItems.id, itemId), eq(rewardShopItems.parentId, child.parentId)),
  })
  if (!item) throw new Error("Item not found")

  // Check balance
  const balance = await getShopBalance(childId)
  if (balance < item.starCost) throw new Error("Not enough stars!")

  const [purchase] = await db
    .insert(shopPurchases)
    .values({ childId, shopItemId: itemId, starCost: item.starCost })
    .returning()

  return purchase
}

export async function getChildPurchases(childId: string) {
  return db.query.shopPurchases.findMany({
    where: eq(shopPurchases.childId, childId),
    with: { shopItem: true },
    orderBy: (p, { desc }) => [desc(p.purchasedAt)],
    limit: 50,
  })
}
