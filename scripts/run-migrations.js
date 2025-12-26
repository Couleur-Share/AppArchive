import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config({ override: true })
dotenv.config({ path: '.env.local', override: true })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsDir = path.resolve(__dirname, '..', 'database', 'migrations')

const direction = process.argv[2] === 'down' ? 'down' : 'up'
const fileSuffix = `.${direction}.sql`

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'Softwares',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  ssl: process.env.PGSSL?.toLowerCase() === 'true' ? { rejectUnauthorized: false } : undefined
})

const run = async () => {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(fileSuffix))
    .sort()

  if (direction === 'down') {
    files.reverse()
  }

  if (!files.length) {
    console.log(`[migrate] 没有找到 ${direction} 脚本`)
    await pool.end()
    return
  }

  console.log(`[migrate] 开始执行 ${direction} (${files.length} 个文件)`)

  for (const file of files) {
    const fullPath = path.join(migrationsDir, file)
    const sql = fs.readFileSync(fullPath, 'utf8')
    console.log(`[migrate] 运行 ${file}`)
    await pool.query(sql)
  }

  await pool.end()
  console.log('[migrate] 完成')
}

run().catch(async (err) => {
  console.error('[migrate] 失败:', err)
  await pool.end()
  process.exit(1)
})

