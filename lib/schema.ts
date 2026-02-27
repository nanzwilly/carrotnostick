import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  primaryKey,
  jsonb,
} from "drizzle-orm/pg-core"
import type { BigHeadConfig } from "@/components/BigHeadAvatar"
import { relations } from "drizzle-orm"
import type { AdapterAccountType } from "next-auth/adapters"

// ─── NextAuth required tables ────────────────────────────────────────────────

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"), // null for OAuth-only users
  trialStartedAt: timestamp("trial_started_at").defaultNow(),
  isPremium: boolean("is_premium").notNull().default(false),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
})

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
)

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
)

// ─── App tables ───────────────────────────────────────────────────────────────

export const children = pgTable("children", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: text("parent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  pin: text("pin").notNull(), // bcrypt hash (6-digit PIN)
  color: text("color").notNull().default("#f97316"), // tailwind orange-500
  avatarEmoji: text("avatar_emoji").notNull().default("🌟"), // animal base (legacy fallback)
  avatarHat: text("avatar_hat"),          // optional hat accessory (legacy fallback)
  avatarGlasses: text("avatar_glasses"),  // optional glasses accessory (legacy fallback)
  avatarConfig: jsonb("avatar_config").$type<BigHeadConfig>(), // BigHead config (takes precedence)
  pinFailedAttempts: integer("pin_failed_attempts").notNull().default(0),
  pinLockedUntil: timestamp("pin_locked_until"),    // null = not locked
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🎯"),
  starThreshold: integer("star_threshold").notNull().default(5),
  rewardDescription: text("reward_description").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const starEvents = pgTable("star_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  note: text("note"),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
})

export const rewardRedemptions = pgTable("reward_redemptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  starsUsed: integer("stars_used").notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
})

export const starRequests = pgTable("star_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  message: text("message"), // optional note from the kid
  status: text("status").notNull().default("pending"), // pending | approved | dismissed
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const coParentInvites = pgTable("co_parent_invites", {
  id:        uuid("id").primaryKey().defaultRandom(),
  token:     text("token").notNull().unique(),
  ownerId:   text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt:    timestamp("used_at"),
  usedBy:    text("used_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const coParents = pgTable(
  "co_parents",
  {
    ownerId:    text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    coParentId: text("co_parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt:  timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.ownerId, t.coParentId] })]
)

// ─── Relations ────────────────────────────────────────────────────────────────

export const childrenRelations = relations(children, ({ many }) => ({
  goals: many(goals),
  starRequests: many(starRequests),
}))

export const goalsRelations = relations(goals, ({ one, many }) => ({
  child: one(children, { fields: [goals.childId], references: [children.id] }),
  starEvents: many(starEvents),
  rewardRedemptions: many(rewardRedemptions),
  starRequests: many(starRequests),
}))

export const starRequestsRelations = relations(starRequests, ({ one }) => ({
  goal: one(goals, { fields: [starRequests.goalId], references: [goals.id] }),
  child: one(children, { fields: [starRequests.childId], references: [children.id] }),
}))

export const starEventsRelations = relations(starEvents, ({ one }) => ({
  goal: one(goals, { fields: [starEvents.goalId], references: [goals.id] }),
  child: one(children, { fields: [starEvents.childId], references: [children.id] }),
}))

export const rewardRedemptionsRelations = relations(rewardRedemptions, ({ one }) => ({
  goal: one(goals, { fields: [rewardRedemptions.goalId], references: [goals.id] }),
  child: one(children, { fields: [rewardRedemptions.childId], references: [children.id] }),
}))

export const coParentInvitesRelations = relations(coParentInvites, ({ one }) => ({
  owner: one(users, { fields: [coParentInvites.ownerId], references: [users.id] }),
}))

export const coParentsRelations = relations(coParents, ({ one }) => ({
  owner:     one(users, { fields: [coParents.ownerId],    references: [users.id], relationName: "owner" }),
  coParent:  one(users, { fields: [coParents.coParentId], references: [users.id], relationName: "coParent" }),
}))

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Child = typeof children.$inferSelect
export type Goal = typeof goals.$inferSelect
export type StarEvent = typeof starEvents.$inferSelect
export type RewardRedemption = typeof rewardRedemptions.$inferSelect
export type StarRequest = typeof starRequests.$inferSelect
export type CoParentInvite = typeof coParentInvites.$inferSelect
export type CoParent = typeof coParents.$inferSelect
