import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex")
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  )
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("x-razorpay-signature") ?? ""

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: { event: string; payload: { subscription: { entity: { id: string; notes?: { userId?: string } } } } }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const subscriptionId = event.payload?.subscription?.entity?.id
  if (!subscriptionId) {
    return NextResponse.json({ error: "No subscription ID" }, { status: 400 })
  }

  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged":
      // Payment received — activate premium
      await db.update(users)
        .set({ isPremium: true, razorpaySubscriptionId: subscriptionId })
        .where(eq(users.razorpaySubscriptionId, subscriptionId))
      break

    case "subscription.cancelled":
    case "subscription.halted":
      // Payment failed / cancelled — remove premium
      await db.update(users)
        .set({ isPremium: false })
        .where(eq(users.razorpaySubscriptionId, subscriptionId))
      break
  }

  return NextResponse.json({ received: true })
}
