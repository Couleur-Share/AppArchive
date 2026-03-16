import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ override: true });
dotenv.config({ path: ".env.local", override: true });

const useConnectionString = process.env.DATABASE_URL;

const databaseConfig = useConnectionString
	? {
			connectionString: useConnectionString,
			ssl:
				process.env.PGSSL?.toLowerCase() === "true"
					? { rejectUnauthorized: false }
					: undefined,
		}
	: {
			host: process.env.PGHOST || "localhost",
			port: Number(process.env.PGPORT || 5432),
			database: process.env.PGDATABASE || "Softwares",
			user: process.env.PGUSER || "postgres",
			password: process.env.PGPASSWORD || "",
			ssl:
				process.env.PGSSL?.toLowerCase() === "true"
					? { rejectUnauthorized: false }
					: undefined,
		};

const pool = new Pool(databaseConfig);

async function migrate() {
	const client = await pool.connect();
	try {
		console.log("开始创建 users 表...");

		await client.query(`
			CREATE TABLE IF NOT EXISTS users (
				id SERIAL PRIMARY KEY,
				username VARCHAR(50) UNIQUE NOT NULL,
				password_hash VARCHAR(255) NOT NULL,
				display_name VARCHAR(100) DEFAULT '',
				avatar TEXT DEFAULT '',
				created_at TIMESTAMP DEFAULT NOW()
			);
		`);
		console.log("✅ users 表创建成功（或已存在）");

		// 兼容旧表：补充 avatar 列
		await client.query(`
			ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';
		`);
		console.log("✅ avatar 列已就绪");

		// 创建初始管理员账户
		const adminUsername = process.env.ADMIN_USERNAME || "admin";
		const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

		const existing = await client.query(
			"SELECT id FROM users WHERE username = $1",
			[adminUsername],
		);

		if (existing.rows.length === 0) {
			const saltRounds = 10;
			const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

			await client.query(
				"INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3)",
				[adminUsername, passwordHash, "管理员"],
			);
			console.log(`✅ 初始管理员账户已创建: ${adminUsername}`);
		} else {
			console.log(`ℹ️  管理员账户已存在: ${adminUsername}，跳过创建`);
		}

		console.log("迁移完成！");
	} catch (error) {
		console.error("❌ 迁移失败:", error);
		process.exit(1);
	} finally {
		client.release();
		await pool.end();
	}
}

migrate();
