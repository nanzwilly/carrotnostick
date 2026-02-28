import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users, accounts, sessions, verificationTokens } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import bcrypt from "bcryptjs"
import { getSubStatus } from "@/lib/subscription"

// Keep the Auth adapter mapped to the stable core columns only.
// This prevents OAuth callback failures when optional app columns
// (like last_login_at) are not yet present in a deployed database.
const authUsers = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: authUsers,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = (credentials.email as string).trim().toLowerCase()

        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        })

        if (!user || !user.password) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  // JWT strategy is required for Credentials provider to work
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user ID into the token on first sign-in; record last login
      if (user?.id) {
        token.id = user.id
        try {
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, user.id))
        } catch {
          // Ignore if the optional last_login_at column is not migrated yet.
        }
      }

      // Always refresh subscription status from DB on sign-in (and periodically via token refresh)
      if (token.id) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.id as string),
          columns: { email: true, isPremium: true, trialStartedAt: true },
        })
        if (dbUser) {
          // Backfill trialStartedAt for existing users who signed up before this feature
          if (!dbUser.trialStartedAt) {
            await db.update(users)
              .set({ trialStartedAt: new Date() })
              .where(eq(users.id, token.id as string))
            dbUser.trialStartedAt = new Date()
          }
          token.email = dbUser.email
          token.isPremium = dbUser.isPremium
          token.trialStartedAt = dbUser.trialStartedAt?.toISOString() ?? null
          const sub = getSubStatus({ email: dbUser.email, isPremium: dbUser.isPremium, trialStartedAt: dbUser.trialStartedAt })
          token.subStatus = sub.status
          token.subDaysLeft = sub.daysLeft ?? null
        }
      }

      return token
    },
    session({ session, token }) {
      // Expose user ID and subscription info from the token to the session
      session.user.id = token.id as string
      session.user.isPremium = token.isPremium as boolean
      session.user.trialStartedAt = token.trialStartedAt as string | null
      session.user.subStatus = token.subStatus as string
      session.user.subDaysLeft = token.subDaysLeft as number | null
      return session
    },
  },
})
