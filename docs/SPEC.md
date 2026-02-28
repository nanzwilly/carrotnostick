## CarrotNoStick — Spec (Product + Technical)

### Status
- **Doc owner**: Project repo
- **Last updated**: 2026-02-27
- **Version**: v0 (living document)

### Summary
CarrotNoStick helps parents and kids turn daily struggles (habits/chores) into simple, motivating rewards using goals and stars, with co-parent access and kid-friendly participation (name + PIN).

### Goals
- **Fast setup**: parent can create a child and a first goal in a couple minutes.
- **Kid engagement**: kids can request stars and see progress.
- **Co-parenting**: shared view and ability to award stars.
- **Low friction auth**: Google OAuth and credentials sign-in work reliably.

### Non-goals (for now)
- Payments/subscriptions enforcement (pricing is communicated, not enforced).
- Complex gamification (leaderboards, streaks, etc.) unless validated by users.
- School/teacher multi-tenant support.

---

## Personas

### Parent (primary)
- Wants quick, calm routines; minimal admin; can manage multiple kids.

### Co-parent (secondary)
- Needs shared visibility and ability to award stars consistently.

### Kid (participant)
- Joins with **name + PIN** (no account) and interacts with goals and star requests.

---

## Core User Flows

### Parent onboarding
- Visit landing → Register (email/password or Google) → Dashboard.
- Create child (name + 6-digit PIN) → Create goal → Start awarding stars.

### Login
- `/login`
- Options:
  - **Google OAuth**
  - **Email/password** (credentials)

### Invite / co-parent join
- Parent shares an invite link containing a token.
- Recipient opens link:
  - If not logged in → sign in/register → accept invite → redirected to dashboard.
  - If logged in → accept invite directly.

### Kid usage
- Kid enters name + PIN (no account) to access their view.
- Kid can request stars for completed tasks (parent approves/awards).

---

## Screens (high level)
- **Login**: Google + credentials; clear value proposition.
- **Register**: create account (credentials) and/or use Google.
- **Dashboard**: list children, goals, star progress; actions to share/invite and create goals.
- **Child page**: goals and progress; star requests.
- **Preferences**: profile and auth-related actions (sign out, password changes, etc.).
- **Pricing**: early access free; displays future monthly price.

---

## Data Model (conceptual)

### Auth (NextAuth / Auth.js)
- **User**
- **Account** (OAuth linkage)
- **Session** (if session strategy used)
- **VerificationToken** (email flows if enabled)

### App domain (typical)
- **Child**
  - owner user id
  - PIN (hashed)
- **Goal**
  - child id
  - target stars, reward description
- **Star / StarEvent**
  - child id, goal id (optional), timestamp, actor (parent/co-parent)
- **Invite**
  - token, owner user id, expiry, accepted by user id

---

## Authentication & Security

### Methods
- **Google OAuth** (OIDC)
- **Credentials** (email/password)

### Session strategy
- JWT-based sessions.

### Required environment variables
- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL` (recommended; important for server-side helpers)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Google OAuth redirect URIs
- `http://localhost:3000/api/auth/callback/google` (add additional ports if you run on them)

### Notes
- Child PINs must be hashed (bcrypt) and rate-limited to prevent brute force.

---

## Tech Stack
- **Next.js (App Router)**
- **React**
- **NextAuth/Auth.js v5**
- **Drizzle ORM**
- **Postgres (Neon)**
- **Tailwind**

---

## Key Routes / Integration Points

### Auth API
- `app/api/auth/[...nextauth]/route.ts` → NextAuth handlers

### App pages (representative)
- `app/login/page.tsx`
- `app/register/page.tsx`
- `app/dashboard/*`
- `app/child/[childId]/*`
- `app/invite/[token]/*`
- `app/pricing/page.tsx`

---

## Pricing (current messaging)
- Early access: **Free**
- Future pricing: **Rs. 69 / month**

---

## Analytics (recommended for validation)

### Funnel events (minimum)
- **page_view**: landing, login, register, pricing
- **auth_start**: google, credentials
- **auth_success**
- **child_created**
- **goal_created**
- **first_star_awarded**
- **invite_created**
- **invite_accepted**

### Activation definition (suggested)
- “Activated” = user creates **at least 1 child** and **1 goal** (and ideally awards 1 star).

---

## Deployment
- **Source of truth**: `origin/master` (adjust if you later adopt `main`)
- Ensure production environment has:
  - `AUTH_URL` set to production base URL (e.g. `https://www.carrotnostick.com`)
  - Google OAuth authorized redirect URI includes production callback:
    - `https://www.carrotnostick.com/api/auth/callback/google`

---

## Open Questions / Next Decisions
- Should credentials registration remain, or is Google-only acceptable for early traction?
- Do you want a dedicated “kid login” landing page (QR-friendly) for faster use?
- What is the primary “aha moment” to optimize (first goal created vs first star awarded)?

