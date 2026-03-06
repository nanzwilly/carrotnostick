"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { starEvents, rewardRedemptions, goals, children, starRequests } from "@/lib/schema"
import { eq, and, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { canAccessFamily } from "@/lib/family"

export async function giveStar(goalId: string, note?: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Verify the goal belongs to a child of this parent
  const goal = await db.query.goals.findFirst({
    where: eq(goals.id, goalId),
    with: { child: true },
  })
  if (!goal || !(await canAccessFamily(session.user.id, goal.child.parentId)))
    throw new Error("Unauthorised")

  // Record the star
  await db.insert(starEvents).values({
    goalId,
    childId: goal.childId,
    note: note || null,
  })

  // Count unredeemed stars for this goal
  const [totalStars] = await db
    .select({ count: count() })
    .from(starEvents)
    .where(eq(starEvents.goalId, goalId))

  const [totalRedeemed] = await db
    .select({ count: count() })
    .from(rewardRedemptions)
    .where(eq(rewardRedemptions.goalId, goalId))

  const redeemedStars = (totalRedeemed?.count ?? 0) * goal.starThreshold
  const unredeemedStars = (totalStars?.count ?? 0) - redeemedStars
  const rewardReached = unredeemedStars >= goal.starThreshold

  revalidatePath("/dashboard")
  return { rewardReached, unredeemedStars, goal }
}

export async function redeemReward(goalId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const goal = await db.query.goals.findFirst({
    where: eq(goals.id, goalId),
    with: { child: true },
  })
  if (!goal || !(await canAccessFamily(session.user.id, goal.child.parentId)))
    throw new Error("Unauthorised")

  await db.insert(rewardRedemptions).values({
    goalId,
    childId: goal.childId,
    starsUsed: goal.starThreshold,
  })

  revalidatePath("/dashboard")
  return goal
}

// ─── Star request actions (kid nudges parent) ─────────────────────────────────

export async function createStarRequest(
  goalId: string,
  childId: string,
  message?: string
) {
  // No auth — kid-side action. Validate that the goal actually belongs to this child.
  if (message && message.trim().length > 500) throw new Error("Message must be 500 characters or less")

  const goal = await db.query.goals.findFirst({
    where: and(eq(goals.id, goalId), eq(goals.childId, childId)),
  })
  if (!goal) throw new Error("Invalid goal")

  const [request] = await db
    .insert(starRequests)
    .values({ goalId, childId, message: message?.trim() || null })
    .returning()

  return request
}

export async function approveStarRequest(requestId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Load the request and verify this parent owns the child
  const request = await db.query.starRequests.findFirst({
    where: eq(starRequests.id, requestId),
    with: { goal: { with: { child: true } } },
  })
  if (!request || !(await canAccessFamily(session.user.id, request.goal.child.parentId)))
    throw new Error("Unauthorised")

  // Give the star
  await db.insert(starEvents).values({
    goalId: request.goalId,
    childId: request.childId,
    note: request.message || null,
  })

  // Mark request as approved
  await db
    .update(starRequests)
    .set({ status: "approved" })
    .where(eq(starRequests.id, requestId))

  revalidatePath("/dashboard")
}

export async function dismissStarRequest(requestId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const request = await db.query.starRequests.findFirst({
    where: eq(starRequests.id, requestId),
    with: { goal: { with: { child: true } } },
  })
  if (!request || !(await canAccessFamily(session.user.id, request.goal.child.parentId)))
    throw new Error("Unauthorised")

  await db
    .update(starRequests)
    .set({ status: "dismissed" })
    .where(eq(starRequests.id, requestId))

  revalidatePath("/dashboard")
}
