import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  primaryKey,
  jsonb,
  index,
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
}, (t) => [
  index("idx_children_parent_id").on(t.parentId),
])

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
}, (t) => [
  index("idx_goals_child_id_is_active").on(t.childId, t.isActive),
])

export const starEvents = pgTable("star_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  note: text("note"),
  quantity: integer("quantity").notNull().default(1),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
}, (t) => [
  index("idx_star_events_goal_id").on(t.goalId),
])

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
}, (t) => [
  index("idx_reward_redemptions_goal_id").on(t.goalId),
])

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
}, (t) => [
  index("idx_star_requests_goal_id").on(t.goalId),
  index("idx_star_requests_child_id_status").on(t.childId, t.status),
])

export const coParentInvites = pgTable("co_parent_invites", {
  id:        uuid("id").primaryKey().defaultRandom(),
  token:     text("token").notNull().unique(),
  ownerId:   text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt:    timestamp("used_at"),
  usedBy:    text("used_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_co_parent_invites_owner_id").on(t.ownerId),
])

export const coParents = pgTable(
  "co_parents",
  {
    ownerId:    text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    coParentId: text("co_parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt:  timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.ownerId, t.coParentId] }),
    index("idx_co_parents_co_parent_id").on(t.coParentId),
  ]
)

// ─── Streaks (per goal) ──────────────────────────────────────────────────────

export const streaks = pgTable("streaks", {
  id: uuid("id").primaryKey().defaultRandom(),
  goalId: uuid("goal_id")
    .notNull()
    .references(() => goals.id, { onDelete: "cascade" }),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastStarDate: text("last_star_date"), // YYYY-MM-DD to avoid timezone issues
}, (t) => [
  index("idx_streaks_goal_id").on(t.goalId),
  index("idx_streaks_child_id").on(t.childId),
])

// ─── Reward shop ─────────────────────────────────────────────────────────────

export const rewardShopItems = pgTable("reward_shop_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: text("parent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("🎁"),
  starCost: integer("star_cost").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_reward_shop_items_parent_id").on(t.parentId),
])

export const shopPurchases = pgTable("shop_purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id")
    .notNull()
    .references(() => children.id, { onDelete: "cascade" }),
  shopItemId: uuid("shop_item_id")
    .notNull()
    .references(() => rewardShopItems.id, { onDelete: "cascade" }),
  starCost: integer("star_cost").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
}, (t) => [
  index("idx_shop_purchases_child_id").on(t.childId),
])

// ─── Notifications ───────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // nudge | star_earned | reward_reached | streak_milestone | shop_purchase
  title: text("title").notNull(),
  body: text("body"),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }),
  goalId: uuid("goal_id").references(() => goals.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("idx_notifications_user_id_is_read").on(t.userId, t.isRead),
])

// ─── Relations ────────────────────────────────────────────────────────────────

export const childrenRelations = relations(children, ({ many }) => ({
  goals: many(goals),
  starRequests: many(starRequests),
  streaks: many(streaks),
  shopPurchases: many(shopPurchases),
  notifications: many(notifications),
}))

export const goalsRelations = relations(goals, ({ one, many }) => ({
  child: one(children, { fields: [goals.childId], references: [children.id] }),
  starEvents: many(starEvents),
  rewardRedemptions: many(rewardRedemptions),
  starRequests: many(starRequests),
  streaks: many(streaks),
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

export const streaksRelations = relations(streaks, ({ one }) => ({
  goal: one(goals, { fields: [streaks.goalId], references: [goals.id] }),
  child: one(children, { fields: [streaks.childId], references: [children.id] }),
}))

export const rewardShopItemsRelations = relations(rewardShopItems, ({ one, many }) => ({
  parent: one(users, { fields: [rewardShopItems.parentId], references: [users.id] }),
  purchases: many(shopPurchases),
}))

export const shopPurchasesRelations = relations(shopPurchases, ({ one }) => ({
  child: one(children, { fields: [shopPurchases.childId], references: [children.id] }),
  shopItem: one(rewardShopItems, { fields: [shopPurchases.shopItemId], references: [rewardShopItems.id] }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  child: one(children, { fields: [notifications.childId], references: [children.id] }),
  goal: one(goals, { fields: [notifications.goalId], references: [goals.id] }),
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
export type Streak = typeof streaks.$inferSelect
export type RewardShopItem = typeof rewardShopItems.$inferSelect
export type ShopPurchase = typeof shopPurchases.$inferSelect
export type Notification = typeof notifications.$inferSelect
