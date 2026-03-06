"use server"

import { db } from "@/lib/db"
import { verificationTokens } from "@/lib/schema"
import { sendPasswordResetEmail } from "@/lib/mailer"
import { and, eq, gt, lt } from "drizzle-orm"
import { pgTable, text } from "drizzle-orm/pg-core"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const authUsersCore = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email"),
  password: text("password"),
})

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

function appBaseUrl(): string {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://www.carrotnostick.com"
  )
}

export async function requestPasswordReset(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const emailRaw = (formData.get("email") as string | null)?.trim().toLowerCase()
  if (!emailRaw || !emailRaw.includes("@")) {
    return { ok: true, message: "If this email exists, a reset link has been sent." }
  }

  try {
    const users = await db
      .select({ id: authUsersCore.id, email: authUsersCore.email })
      .from(authUsersCore)
      .where(eq(authUsersCore.email, emailRaw))
      .limit(1)
    const user = users[0]

    // Never reveal whether an account exists.
    if (!user?.email) {
      return { ok: true, message: "If this email exists, a reset link has been sent." }
    }

    const token = crypto.randomBytes(32).toString("hex")
    const tokenHash = hashToken(token)
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    // Clean old tokens for this email.
    await db.delete(verificationTokens).where(
      and(
        eq(verificationTokens.identifier, emailRaw),
        lt(verificationTokens.expires, new Date())
      )
    )

    // Also keep only one active reset token per email.
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, emailRaw))

    await db.insert(verificationTokens).values({
      identifier: emailRaw,
      token: tokenHash,
      expires,
    })

    const url = `${appBaseUrl()}/reset-password/${token}`
    await sendPasswordResetEmail({ to: emailRaw, resetUrl: url })
  } catch (err) {
    console.error("requestPasswordReset failed", err)
    // Always return generic success to avoid account enumeration.
  }

  return { ok: true, message: "If this email exists, a reset link has been sent." }
}

export async function resetPasswordWithToken(formData: FormData): Promise<{ ok: boolean; message: string }> {
  const token = (formData.get("token") as string | null)?.trim()
  const password = formData.get("password") as string
  const confirm = formData.get("confirmPassword") as string

  if (!token) return { ok: false, message: "Invalid reset token." }
  if (!password || password.length < 8) return { ok: false, message: "Password must be at least 8 characters." }
  if (password !== confirm) return { ok: false, message: "Passwords do not match." }

  try {
    const tokenHash = hashToken(token)
    const rows = await db
      .select({
        identifier: verificationTokens.identifier,
        token: verificationTokens.token,
        expires: verificationTokens.expires,
      })
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.token, tokenHash),
          gt(verificationTokens.expires, new Date())
        )
      )
      .limit(1)

    const row = rows[0]
    if (!row) return { ok: false, message: "This reset link is invalid or expired." }

    const hash = await bcrypt.hash(password, 12)

    await db
      .update(authUsersCore)
      .set({ password: hash })
      .where(eq(authUsersCore.email, row.identifier))

    await db.delete(verificationTokens).where(eq(verificationTokens.token, tokenHash))
    return { ok: true, message: "Password updated. You can now sign in." }
  } catch (err) {
    console.error("resetPasswordWithToken failed", err)
    return { ok: false, message: "Could not reset password. Please request a new link." }
  }
}

