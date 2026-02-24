"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export async function registerUser(formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string

  if (!email || !password) throw new Error("Email and password are required")
  if (password.length < 8) throw new Error("Password must be at least 8 characters")
  if (!email.includes("@")) throw new Error("Please enter a valid email address")

  // Check if user already exists
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  })
  if (existing) throw new Error("An account with that email already exists")

  const hashedPassword = await bcrypt.hash(password, 12)

  await db.insert(users).values({
    id: crypto.randomUUID(),
    email,
    name: name || email.split("@")[0],
    password: hashedPassword,
  })

  return { success: true }
}
