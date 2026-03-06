import dotenv from "dotenv"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

dotenv.config({ path: ".env.local" })

const email = process.argv[2]
const newPassword = process.argv[3]

if (!email || !newPassword) {
  console.error("Usage: node scripts/reset-password.mjs <email> <newPassword>")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const hash = await bcrypt.hash(newPassword, 12)

await sql.query(`update "user" set password = $1 where lower(email) = lower($2)`, [
  hash,
  email,
])

const rows = await sql.query(
  `select id, email, password
   from "user"
   where lower(email) = lower($1)
   limit 1`,
  [email]
)

if (!rows[0]) {
  console.error("No user found for that email.")
  process.exit(2)
}

const matches = await bcrypt.compare(newPassword, rows[0].password)
console.log(
  JSON.stringify(
    {
      id: rows[0].id,
      email: rows[0].email,
      passwordUpdated: true,
      passwordMatchesHash: matches,
    },
    null,
    2
  )
)
