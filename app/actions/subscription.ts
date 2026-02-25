"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import Razorpay from "razorpay"

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

export async function createRazorpaySubscription() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { email: true, razorpaySubscriptionId: true, isPremium: true },
  })
  if (!dbUser) throw new Error("User not found")

  // If already subscribed, return the existing subscription
  if (dbUser.isPremium && dbUser.razorpaySubscriptionId) {
    return {
      subscriptionId: dbUser.razorpaySubscriptionId,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    }
  }

  const razorpay = getRazorpay()
  const subscription = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID!,
    customer_notify: 1,
    total_count: 120, // 10 years max
    notes: {
      userId: session.user.id,
      email: dbUser.email ?? "",
    },
  })

  // Store the subscription ID on the user record
  await db.update(users)
    .set({ razorpaySubscriptionId: subscription.id })
    .where(eq(users.id, session.user.id))

  return {
    subscriptionId: subscription.id,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  }
}

export async function cancelSubscription() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorised")

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { razorpaySubscriptionId: true },
  })

  if (!dbUser?.razorpaySubscriptionId) {
    throw new Error("No active subscription found")
  }

  const razorpay = getRazorpay()
  await razorpay.subscriptions.cancel(dbUser.razorpaySubscriptionId, false)

  return { success: true }
}
