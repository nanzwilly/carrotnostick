import dotenv from "dotenv"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

dotenv.config({ path: ".env.local" })

const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.error("Usage: node scripts/check-login.mjs <email> <password>")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)
const rows = await sql.query(
  `select id, email, name, password
   from "user"
   where lower(email) = lower($1)
     and password is not null
   order by id asc
   limit 1`,
  [email]
)

if (!rows[0]) {
  console.log(JSON.stringify({ found: false }, null, 2))
  process.exit(0)
}

const ok = await bcrypt.compare(password, rows[0].password)
console.log(
  JSON.stringify(
    {
      found: true,
      email: rows[0].email,
      id: rows[0].id,
      passwordMatches: ok,
    },
    null,
    2
  )
)
