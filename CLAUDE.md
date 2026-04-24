# CarrotNoStick — Claude Code Context

## What This App Does
CarrotNoStick is a parenting rewards app. Parents set goals for their children, give stars for effort, and stars convert into rewards. Children have their own PIN-protected page to see their progress. Built to replace punishment-based parenting with positive reinforcement.

Live at: https://www.carrotnostick.com  
Repo: https://github.com/nanzwilly/carrotnostick  
Deployed via: Vercel (auto-deploy on push to `master`)

## Git Account
Push as GitHub user: **`nanzwilly`** (nanzwilly@gmail.com).
If a push is rejected with a different username (e.g. `nancy-df`), the
credential manager is using the wrong account — tell the user rather
than retrying blindly.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router) + React 19
- **Auth**: NextAuth v5 (beta) — credentials + Google OAuth, JWT strategy
- **Database**: Neon (PostgreSQL 17, serverless) via `@neondatabase/serverless`
- **ORM**: Drizzle ORM — schema at `lib/schema.ts`, migrations in `drizzle/`
- **Styling**: Tailwind CSS v4
- **Email**: Nodemailer (`lib/mailer.ts`)
- **Payments**: Razorpay (pending approval — currently dormant)
- **Avatars**: BigHeads (`@bigheads/core`)

---

## Project Structure
```
app/
  actions/          # Server actions (auth, children, goals, stars, invites, user, subscription)
  api/              # API routes (NextAuth, Razorpay webhook)
  dashboard/        # Parent dashboard (children, goals, stats, preferences)
  child/[childId]/  # Child's PIN-protected public page
  login/ register/ forgot-password/ reset-password/
  invite/           # Co-parent invite acceptance
  pricing/ upgrade/ # Subscription pages
lib/
  schema.ts         # Drizzle schema (single source of truth for DB shape)
  db.ts             # Neon DB connection
  subscription.ts   # Subscription status logic (currently returns "active" for all)
  stats-access.ts   # canViewStats() — only nanzwilly@gmail.com
  mailer.ts         # Nodemailer email sending
  family.ts         # Family data helpers
components/         # Shared UI components
types/
  next-auth.d.ts    # REQUIRED — NextAuth JWT + Session type augmentations
drizzle/            # Migration SQL files + meta/_journal.json
auth.ts             # NextAuth config (root level)
```

---

## ⚠️ Critical Rules

### Database Migrations — READ THIS FIRST
The project uses `drizzle-kit push` (NOT `drizzle-kit migrate`). There is **no `__drizzle_migrations` table** in the DB.

**When adding a new column or table:**
1. Update `lib/schema.ts` first
2. Run `npm run db:generate` to create the SQL migration file in `drizzle/`
3. Run `npm run db:push` (or apply the SQL manually via Neon MCP) to update production
4. Commit BOTH `lib/schema.ts` AND the new migration file AND `drizzle/meta/_journal.json` together

**Never:**
- Add columns to the DB without updating `lib/schema.ts`
- Update `lib/schema.ts` without applying to the DB
- Let tools (Codex, Cursor, etc.) make DB changes that aren't reflected in committed code

### Auth / NextAuth
- `types/next-auth.d.ts` MUST exist — it augments the JWT and Session types for custom fields (`id`, `isPremium`, `trialStartedAt`, `subStatus`, `subDaysLeft`)
- `auth.ts` uses a **minimal `authUsers` table** (basic columns only) for the DrizzleAdapter to avoid schema drift issues
- JWT strategy is required for Credentials provider
- The `authorize()` function queries `authUsers` (not the full `users` table)

### Subscription / Razorpay
- Razorpay is **not yet live** (pending approval)
- `lib/subscription.ts` currently returns `{ status: "active" }` for everyone — this is intentional
- `nanzwilly@gmail.com` is the founder account — always has free/active access via `FOUNDER_EMAILS`
- When Razorpay is approved: add env vars to Vercel and restore the trial logic

### Founder / Admin Access
- `nanzwilly@gmail.com` — founder, free account, can view `/dashboard/stats`
- Stats access controlled by `lib/stats-access.ts` → `canViewStats(email)`

### Git Commits — Always Commit Everything
**Before making any targeted commit, always run `git status` first.**
If there are other modified or untracked files outside the intended change, include them in the same commit (or a follow-up commit in the same push) — never leave them behind.

Leaving files uncommitted while pushing other changes causes features to silently disappear from production (Vercel deploys what's in git, not what's on disk).

**Rule:** Every push to `master` should leave `git status` clean.

---

## Environment Variables (Vercel)
```
DATABASE_URL          # Neon connection string
NEXTAUTH_SECRET       # NextAuth JWT secret
GOOGLE_CLIENT_ID      # Google OAuth
GOOGLE_CLIENT_SECRET  # Google OAuth
EMAIL_FROM            # Sender email for Nodemailer
EMAIL_SERVER_*        # SMTP config for Nodemailer
RAZORPAY_KEY_ID       # (dormant — add when approved)
RAZORPAY_KEY_SECRET   # (dormant — add when approved)
RAZORPAY_WEBHOOK_SECRET # (dormant — add when approved)
```

---

## Deployment
- Push to `master` → Vercel auto-deploys
- Build command: `next build` (no migration scripts run automatically)
- DB migrations must be applied **separately** before or after deploying code that depends on them

---

## Pricing
- Current pricing: ₹69/month (shown on `/upgrade` page)
- Free during early access ("Free while we are improving the app")

---

## Known Issues / History
- `last_login_at` column was added via migration 0007 — must stay in `lib/schema.ts` and `drizzle/meta/_journal.json`
- Do not use multiple AI tools (Codex + Claude) for DB changes simultaneously — they don't share state and cause schema drift
