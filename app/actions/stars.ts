"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { starEvents, rewardRedemptions, goals, children, starRequests, streaks } from "@/lib/schema"
import { eq, and, count, sum } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { canAccessFamily } from "@/lib/family"
import { notifyParentOfNudge, notifyStreakMilestone } from "./notifications"

export async function giveStar(goalId: string, note?: string, quantity: number = 1) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  // Validate quantity
  const qty = Math.max(1, Math.min(Math.floor(quantity), 10))

  // Verify the goal belongs to a child of this parent
  const goal = await db.query.goals.findFirst({
    where: eq(goals.id, goalId),
    with: { child: true },
  })
  if (!goal || !(await canAccessFamily(session.user.id, goal.child.parentId)))
    throw new Error("Unauthorised")

  // Record the star(s)
  await db.insert(starEvents).values({
    goalId,
    childId: goal.childId,
    note: note || null,
    quantity: qty,
  })

  // Count unredeemed stars for this goal (using sum of quantities)
  const [totalStars] = await db
    .select({ total: sum(starEvents.quantity) })
    .from(starEvents)
    .where(eq(starEvents.goalId, goalId))

  const [totalRedeemed] = await db
    .select({ count: count() })
    .from(rewardRedemptions)
    .where(eq(rewardRedemptions.goalId, goalId))

  const redeemedStars = (totalRedeemed?.count ?? 0) * goal.starThreshold
  const unredeemedStars = Number(totalStars?.total ?? 0) - redeemedStars
  const rewardReached = unredeemedStars >= goal.starThreshold

  // Update streak
  const streakInfo = await updateStreak(goalId, goal.childId)

  // Notify parent about streak milestones (fire-and-forget)
  if (streakInfo && "currentStreak" in streakInfo) {
    notifyStreakMilestone(
      goal.child.parentId, goal.child.name, goal.name,
      streakInfo.currentStreak, goal.childId, goalId,
    ).catch(() => {})
  }

  revalidatePath("/dashboard")
  return { rewardReached, unredeemedStars, goal, streak: streakInfo }
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

// ─── Streak tracking ────────────────────────────────────────────────────────

async function updateStreak(goalId: string, childId: string) {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  const existing = await db.query.streaks.findFirst({
    where: and(eq(streaks.goalId, goalId), eq(streaks.childId, childId)),
  })

  if (!existing) {
    // First star ever for this goal
    const [s] = await db.insert(streaks).values({
      goalId,
      childId,
      currentStreak: 1,
      longestStreak: 1,
      lastStarDate: today,
    }).returning()
    return s
  }

  if (existing.lastStarDate === today) {
    // Already got a star today — no streak change
    return existing
  }

  const lastDate = existing.lastStarDate ? new Date(existing.lastStarDate) : null
  const todayDate = new Date(today)
  const diffDays = lastDate
    ? Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999

  let newStreak: number
  if (diffDays === 1) {
    // Consecutive day — extend streak
    newStreak = existing.currentStreak + 1
  } else {
    // Gap — reset streak
    newStreak = 1
  }

  const newLongest = Math.max(existing.longestStreak, newStreak)

  await db
    .update(streaks)
    .set({ currentStreak: newStreak, longestStreak: newLongest, lastStarDate: today })
    .where(eq(streaks.id, existing.id))

  return { ...existing, currentStreak: newStreak, longestStreak: newLongest, lastStarDate: today }
}

export async function getStreaksForChild(childId: string) {
  return db.query.streaks.findMany({
    where: eq(streaks.childId, childId),
  })
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

  // Get child name for notification
  const child = await db.query.children.findFirst({
    where: eq(children.id, childId),
    columns: { name: true },
  })
  if (child) {
    notifyParentOfNudge(childId, child.name, goal.name).catch(() => {})
  }

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
    quantity: 1,
  })

  // Update streak
  await updateStreak(request.goalId, request.childId)

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
