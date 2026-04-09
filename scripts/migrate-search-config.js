import { pool } from "../server/database.js";

async function migrate() {
	try {
		console.log("正在检查 search_config 表...");

		const { rows } = await pool.query(`
			SELECT table_name FROM information_schema.tables
			WHERE table_schema = 'public' AND table_name = 'search_config'
		`);

		if (rows.length === 0) {
			console.log("正在创建 search_config 表...");
			await pool.query(`
				CREATE TABLE search_config (
					id SERIAL PRIMARY KEY,
					tavily_api_key_cipher TEXT,
					tavily_enabled BOOLEAN NOT NULL DEFAULT true,
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
				);
			`);
			console.log("✅ 成功创建 search_config 表");
		} else {
			console.log("ℹ️  search_config 表已存在，跳过迁移");
		}
	} catch (error) {
		console.error("❌ 迁移失败:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

migrate();
