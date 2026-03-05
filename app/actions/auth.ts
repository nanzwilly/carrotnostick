"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { sql } from "drizzle-orm"
import bcrypt from "bcryptjs"

export type RegisterResult = { success: true } | { success: false; error: string }
export type LoginHint = "use_google" | "invalid_credentials"

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  try {
    const name = (formData.get("name") as string)?.trim()
    const email = (formData.get("email") as string)?.trim().toLowerCase()
    const password = formData.get("password") as string

    if (!email || !password) return { success: false, error: "Email and password are required" }
    if (password.length < 8) return { success: false, error: "Password must be at least 8 characters" }
    if (!email.includes("@")) return { success: false, error: "Please enter a valid email address" }

    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: sql`lower(${users.email}) = ${email}`,
      columns: { id: true, password: true },
    })
    if (existing) {
      if (!existing.password) {
        return {
          success: false,
          error: 'An account with this email already exists via Google. Please use "Continue with Google".',
        }
      }
      return { success: false, error: "An account with that email already exists. Please sign in." }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      name: name || email.split("@")[0],
      password: hashedPassword,
    })

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const lower = message.toLowerCase()
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: unknown }).code ?? "")
        : ""

    if (code === "23505" || lower.includes("already exists") || lower.includes("unique") || lower.includes("duplicate")) {
      return { success: false, error: "An account with that email already exists. Please sign in." }
    }
    if (lower.includes("not-null") || lower.includes("null value") || lower.includes("column") || lower.includes("does not exist")) {
      return { success: false, error: "Server setup issue while creating account. Please contact support." }
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
