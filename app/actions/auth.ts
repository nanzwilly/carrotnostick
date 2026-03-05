"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { sql } from "drizzle-orm"
import bcrypt from "bcryptjs"

export type RegisterResult = { success: true } | { success: false; error: string }
export type LoginHint = "use_google" | "invalid_credentials"

function toErrorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function isMissingPasswordColumnError(err: unknown): boolean {
  const msg = toErrorText(err).toLowerCase()
  return (
    msg.includes("password") &&
    msg.includes("column") &&
    (msg.includes("does not exist") || msg.includes("unknown"))
  )
}

async function ensurePasswordColumnExists(): Promise<void> {
  await db.execute(sql.raw('ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "password" text;'))
}

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  try {
    const name = (formData.get("name") as string)?.trim()
    const email = (formData.get("email") as string)?.trim().toLowerCase()
    const password = formData.get("password") as string

    if (!email || !password) return { success: false, error: "Email and password are required" }
    if (password.length < 8) return { success: false, error: "Password must be at least 8 characters" }
    if (!email.includes("@")) return { success: false, error: "Please enter a valid email address" }

    // Check if user already exists. Fallback if production schema is behind.
    let existing: { id: string; password: string | null } | { id: string } | undefined
    try {
      existing = await db.query.users.findFirst({
        where: sql`lower(${users.email}) = ${email}`,
        columns: { id: true, password: true },
      })
    } catch (err) {
      if (!isMissingPasswordColumnError(err)) throw err
      existing = await db.query.users.findFirst({
        where: sql`lower(${users.email}) = ${email}`,
        columns: { id: true },
      })
    }

    if (existing) {
      if ("password" in existing && !existing.password) {
        return {
          success: false,
          error: 'An account with this email already exists via Google. Please use "Continue with Google".',
        }
      }
      return { success: false, error: "An account with that email already exists. Please sign in." }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    try {
      await db.insert(users).values({
        id: crypto.randomUUID(),
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
      })
    } catch (err) {
      if (!isMissingPasswordColumnError(err)) throw err

      // Emergency self-heal for production if password column migration was missed.
      await ensurePasswordColumnExists()
      await db.insert(users).values({
        id: crypto.randomUUID(),
        email,
        name: name || email.split("@")[0],
        password: hashedPassword,
      })
    }

    return { success: true }
  } catch (err) {
    const message = toErrorText(err)
    const lower = message.toLowerCase()
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: unknown }).code ?? "")
        : ""

    console.error("registerUser failed", { code, message })

    if (code === "23505" || lower.includes("already exists") || lower.includes("unique") || lower.includes("duplicate")) {
      return { success: false, error: "An account with that email already exists. Please sign in." }
    }
    if (lower.includes("not-null") || lower.includes("null value") || lower.includes("column") || lower.includes("does not exist")) {
      return { success: false, error: "Server setup issue while creating account. Please contact support." }
    }
    if (lower.includes("fetch failed") || lower.includes("connect") || lower.includes("timeout") || lower.includes("econn")) {
      return { success: false, error: "Cannot reach database right now. Please try again in a minute." }
    }
    return { success: false, error: "Something went wrong. Please try again or contact support." }
  }
}

export async function getLoginHint(emailInput: string): Promise<LoginHint> {
  try {
    const email = emailInput.trim().toLowerCase()
    if (!email || !email.includes("@")) return "invalid_credentials"

    const user = await db.query.users.findFirst({
      where: sql`lower(${users.email}) = ${email}`,
      columns: { id: true, password: true },
    })

    if (user && !user.password) return "use_google"
    return "invalid_credentials"
  } catch {
    return "invalid_credentials"
  }
}
