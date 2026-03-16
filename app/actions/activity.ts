"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { starEvents, rewardRedemptions, starRequests, children, goals } from "@/lib/schema"
import { eq, desc, and, or } from "drizzle-orm"
import { getOwnerIdForUser } from "@/lib/family"

export type ActivityItem = {
  id: string
  type: "star" | "redemption" | "nudge"
  childName: string
  childColor: string
  goalName: string
  goalEmoji: string
  note?: string | null
  quantity?: number
  status?: string
  timestamp: Date
}

export async function getActivityFeed(limit = 50, offset = 0): Promise<ActivityItem[]> {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const ownerId = await getOwnerIdForUser(session.user.id)

  // Get all children IDs for this parent
  const parentChildren = await db.query.children.findMany({
    where: eq(children.parentId, ownerId),
    columns: { id: true, name: true, color: true },
  })
  if (parentChildren.length === 0) return []

  const childIds = parentChildren.map((c) => c.id)
  const childMap = new Map(parentChildren.map((c) => [c.id, c]))

  // Fetch star events
  const stars = await db.query.starEvents.findMany({
    where: or(...childIds.map((id) => eq(starEvents.childId, id))),
    with: { goal: { columns: { name: true, emoji: true } } },
    orderBy: [desc(starEvents.awardedAt)],
    limit: limit + offset,
  })

  // Fetch redemptions
  const redemptions = await db.query.rewardRedemptions.findMany({
    where: or(...childIds.map((id) => eq(rewardRedemptions.childId, id))),
    with: { goal: { columns: { name: true, emoji: true, rewardDescription: true } } },
    orderBy: [desc(rewardRedemptions.redeemedAt)],
    limit: limit + offset,
  })

  // Fetch nudges (all statuses)
  const nudges = await db.query.starRequests.findMany({
    where: or(...childIds.map((id) => eq(starRequests.childId, id))),
    with: { goal: { columns: { name: true, emoji: true } } },
    orderBy: [desc(starRequests.createdAt)],
    limit: limit + offset,
  })

  // Merge and sort
  const items: ActivityItem[] = [
    ...stars.map((s) => ({
      id: s.id,
      type: "star" as const,
      childName: childMap.get(s.childId)?.name ?? "Unknown",
      childColor: childMap.get(s.childId)?.color ?? "#f97316",
      goalName: s.goal.name,
      goalEmoji: s.goal.emoji,
      note: s.note,
      quantity: s.quantity ?? 1,
      timestamp: s.awardedAt,
    })),
    ...redemptions.map((r) => ({
      id: r.id,
      type: "redemption" as const,
      childName: childMap.get(r.childId)?.name ?? "Unknown",
      childColor: childMap.get(r.childId)?.color ?? "#f97316",
      goalName: r.goal.name,
      goalEmoji: r.goal.emoji,
      note: r.goal.rewardDescription,
      timestamp: r.redeemedAt,
    })),
    ...nudges.map((n) => ({
      id: n.id,
      type: "nudge" as const,
      childName: childMap.get(n.childId)?.name ?? "Unknown",
      childColor: childMap.get(n.childId)?.color ?? "#f97316",
      goalName: n.goal.name,
      goalEmoji: n.goal.emoji,
      note: n.message,
      status: n.status,
      timestamp: n.createdAt,
    })),
  ]

  items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return items.slice(offset, offset + limit)
}
