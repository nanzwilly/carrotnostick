"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export type RegisterResult = { success: true } | { success: false; error: string }

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
      where: eq(users.email, email),
      columns: { id: true },
    })
    if (existing) return { success: false, error: "An account with that email already exists" }

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
    if (message.includes("already exists") || message.includes("unique") || message.includes("duplicate")) {
      return { success: false, error: "An account with that email already exists" }
    }
    return { success: false, error: "Something went wrong. Please try again or contact support." }
  }
}
