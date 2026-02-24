"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { goals, children } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

// ── Helper: verify goal belongs to the calling parent ────────────────────────
async function verifyGoalOwnership(goalId: string, parentId: string) {
  const goal = await db.query.goals.findFirst({
    where: eq(goals.id, goalId),
    with: { child: true },
  })
  if (!goal || goal.child.parentId !== parentId) throw new Error("Unauthorised")
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

export async function createGoal(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const childId = formData.get("childId") as string
  const name = formData.get("name") as string
  const emoji = (formData.get("emoji") as string) || "⭐"
  const starThreshold = parseInt(formData.get("starThreshold") as string) || 5
  const rewardDescription = formData.get("rewardDescription") as string

  // Verify child belongs to this parent
  const child = await db.query.children.findFirst({
    where: eq(children.id, childId),
  })
  if (!child || child.parentId !== session.user.id) throw new Error("Unauthorised")

  const [goal] = await db
    .insert(goals)
    .values({ childId, name, emoji, starThreshold, rewardDescription })
    .returning()

  revalidatePath("/dashboard")
  return goal
}
