import dotenv from "dotenv"
import { neon } from "@neondatabase/serverless"

dotenv.config({ path: ".env.local" })

const email = process.argv[2]
if (!email) {
  console.error("Usage: node scripts/debug-user.mjs <email>")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const rows = await sql.query(
  `select id, email, password, name
   from "user"
   where lower(email) = lower($1)
   limit 5`,
  [email]
)

console.log(JSON.stringify(rows, null, 2))
