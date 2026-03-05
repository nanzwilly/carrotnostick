import dotenv from "dotenv"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import crypto from "node:crypto"

dotenv.config({ path: ".env.local" })

const email = process.argv[2]
if (!email) {
  console.error("Usage: node scripts/test-register.mjs <email>")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const id = crypto.randomUUID()
const passwordHash = await bcrypt.hash("TempPass123!", 12)

await sql.query(
  `insert into "user" (id, email, name, password)
   values ($1, $2, $3, $4)
   on conflict (email) do update set password = excluded.password`,
  [id, email, "Nancy Seby", passwordHash]
)

const rows = await sql.query(
  `select id, email, name, password is not null as has_password
   from "user" where lower(email)=lower($1)`,
  [email]
)

console.log(JSON.stringify(rows, null, 2))
