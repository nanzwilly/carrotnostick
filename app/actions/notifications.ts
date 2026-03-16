"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { notifications, children, users } from "@/lib/schema"
import { eq, and, desc, count } from "drizzle-orm"
import { getOwnerIdForUser } from "@/lib/family"
import { revalidatePath } from "next/cache"
import { sendNudgeNotificationEmail } from "@/lib/mailer"

// ─── Create notifications ────────────────────────────────────────────────────

export async function createNotification(opts: {
  userId: string
  type: string
  title: string
  body?: string
  childId?: string
  goalId?: string
}) {
  await db.insert(notifications).values({
    userId: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body ?? null,
    childId: opts.childId ?? null,
    goalId: opts.goalId ?? null,
  })
}

// Notify parent when child sends a nudge
export async function notifyParentOfNudge(childId: string, childName: string, goalName: string, message?: string | null) {
  const child = await db.query.children.findFirst({
    where: eq(children.id, childId),
    columns: { parentId: true },
  })
  if (!child) return

  await createNotification({
    userId: child.parentId,
    type: "nudge",
    title: `${childName} sent a nudge!`,
    body: `"I did it!" — for ${goalName}`,
    childId,
  })

  // Send email notification (fire-and-forget)
  const parent = await db.query.users.findFirst({
    where: eq(users.id, child.parentId),
    columns: { email: true },
  })
  if (parent?.email) {
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      : "https://www.carrotnostick.com/dashboard"
    sendNudgeNotificationEmail({
      to: parent.email,
      childName,
      goalName,
      message,
      dashboardUrl,
    }).catch(() => {}) // fire-and-forget
  }
}

// Notify about star earned (for child's parent to see)
export async function notifyStarEarned(
  parentId: string,
  childName: string,
  goalName: string,
  quantity: number,
  childId: string,
  goalId: string,
) {
  await createNotification({
    userId: parentId,
    type: "star_earned",
    title: `${childName} earned ${quantity > 1 ? quantity + " stars" : "a star"}!`,
    body: `For: ${goalName}`,
    childId,
    goalId,
  })
}

// Notify about streak milestone
export async function notifyStreakMilestone(
  parentId: string,
  childName: string,
  goalName: string,
  streakDays: number,
  childId: string,
  goalId: string,
) {
  if (![3, 7, 14, 30, 50, 100].includes(streakDays)) return // only notify at milestones
  await createNotification({
    userId: parentId,
    type: "streak_milestone",
    title: `🔥 ${childName} hit a ${streakDays}-day streak!`,
    body: `For: ${goalName}`,
    childId,
    goalId,
  })
}

// ─── Read notifications ──────────────────────────────────────────────────────

export async function getNotifications(limit = 30) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  return db.query.notifications.findMany({
    where: eq(notifications.userId, session.user.id),
    orderBy: [desc(notifications.createdAt)],
    limit,
  })
}

export async function getUnreadCount() {
  const session = await auth()
  if (!session?.user?.id) return 0

  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false)))

  return result?.count ?? 0
}

export async function markAllRead() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false)))

  revalidatePath("/dashboard")
}

export async function markRead(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)))
}
