"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { goals, children } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { canAccessFamily, getOwnerIdForUser } from "@/lib/family"

// ── Helper: verify goal belongs to the calling parent (or co-parent) ─────────
async function verifyGoalOwnership(goalId: string, userId: string) {
  const goal = await db.query.goals.findFirst({
    where: eq(goals.id, goalId),
    with: { child: true },
  })
  if (!goal || !(await canAccessFamily(userId, goal.child.parentId)))
    throw new Error("Unauthorised")
  return goal
}

export async function archiveGoal(goalId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")
  await verifyGoalOwnership(goalId, session.user.id)

  await db.update(goals).set({ isActive: false }).where(eq(goals.id, goalId))
  revalidatePath("/dashboard")
}

export async function deleteGoal(goalId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")
  await verifyGoalOwnership(goalId, session.user.id)

  await db.delete(goals).where(eq(goals.id, goalId))
  revalidatePath("/dashboard")
}

export async function updateGoal(goalId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")
  await verifyGoalOwnership(goalId, session.user.id)

  const name = formData.get("name") as string
  const emoji = (formData.get("emoji") as string) || "🎯"
  const starThreshold = parseInt(formData.get("starThreshold") as string) || 5
  const rewardDescription = formData.get("rewardDescription") as string

  if (!name || name.trim().length === 0) throw new Error("Goal name is required")
  if (name.length > 100) throw new Error("Goal name must be 100 characters or less")
  if (emoji.length > 10) throw new Error("Emoji too long")
  if (starThreshold < 1 || starThreshold > 100) throw new Error("Star target must be between 1 and 100")
  if (rewardDescription && rewardDescription.length > 200) throw new Error("Reward description must be 200 characters or less")

  await db
    .update(goals)
    .set({ name, emoji, starThreshold, rewardDescription })
    .where(eq(goals.id, goalId))

  revalidatePath("/dashboard")
}

export async function getArchivedGoals(childId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const child = await db.query.children.findFirst({ where: eq(children.id, childId) })
  if (!child || !(await canAccessFamily(session.user.id, child.parentId)))
    throw new Error("Unauthorised")

  return db.query.goals.findMany({
    where: (g, { and, eq }) => and(eq(g.childId, childId), eq(g.isActive, false)),
    with: { starEvents: true, rewardRedemptions: true },
    orderBy: (g, { desc }) => [desc(g.createdAt)],
  })
}

export async function unarchiveGoal(goalId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")
  await verifyGoalOwnership(goalId, session.user.id)

  await db.update(goals).set({ isActive: true }).where(eq(goals.id, goalId))
  revalidatePath("/dashboard")
}

export async function createGoal(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const childId = formData.get("childId") as string
  const name = formData.get("name") as string
  const emoji = (formData.get("emoji") as string) || "⭐"
  const starThreshold = parseInt(formData.get("starThreshold") as string) || 5
  const rewardDescription = formData.get("rewardDescription") as string

  if (!name || name.trim().length === 0) throw new Error("Goal name is required")
  if (name.length > 100) throw new Error("Goal name must be 100 characters or less")
  if (emoji.length > 10) throw new Error("Emoji too long")
  if (starThreshold < 1 || starThreshold > 100) throw new Error("Star target must be between 1 and 100")
  if (rewardDescription && rewardDescription.length > 200) throw new Error("Reward description must be 200 characters or less")

  // Verify child belongs to this parent (or the parent they're a co-parent of)
  const child = await db.query.children.findFirst({
    where: eq(children.id, childId),
  })
  if (!child || !(await canAccessFamily(session.user.id, child.parentId)))
    throw new Error("Unauthorised")

  const [goal] = await db
    .insert(goals)
    .values({ childId, name, emoji, starThreshold, rewardDescription })
    .returning()

  revalidatePath("/dashboard")
  return goal
}
