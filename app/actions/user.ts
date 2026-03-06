"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { pgTable, text } from "drizzle-orm/pg-core"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

const authUsersCore = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  password: text("password"),
})

export async function updateName(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")

  const name = (formData.get("name") as string)?.trim()
  if (!name) throw new Error("Name is required")

  await db.update(users).set({ name }).where(eq(users.id, session.user.id))
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Not authenticated")

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!currentPassword || !newPassword || !confirmPassword)
    throw new Error("All password fields are required")
  if (newPassword.length < 8)
    throw new Error("New password must be at least 8 characters")
  if (newPassword !== confirmPassword)
    throw new Error("New passwords don't match")

  const rows = await db
    .select({ id: authUsersCore.id, password: authUsersCore.password })
    .from(authUsersCore)
    .where(eq(authUsersCore.id, session.user.id))
    .limit(1)
  const user = rows[0]

  if (!user?.password)
    throw new Error("No password set - this account uses Google sign-in")

  const match = await bcrypt.compare(currentPassword, user.password)
  if (!match) throw new Error("Current password is incorrect")

  const hashed = await bcrypt.hash(newPassword, 12)
  await db.update(users).set({ password: hashed }).where(eq(users.id, session.user.id))
  return { success: true }
}
