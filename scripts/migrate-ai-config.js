import { pool } from "../server/database.js";

async function migrate() {
	try {
		console.log("正在检查 ai_config 表...");

		const { rows } = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'ai_config'
    `);

		if (rows.length === 0) {
			console.log("正在创建 ai_config 表...");
			await pool.query(`
        CREATE TABLE ai_config (
          id SERIAL PRIMARY KEY,
          provider VARCHAR(50) NOT NULL,
          api_base VARCHAR(500) NOT NULL,
          api_key_cipher TEXT NOT NULL,
          model VARCHAR(100) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
			console.log("✅ 成功创建 ai_config 表");
		} else {
			console.log("ℹ️ ai_config 表已存在，跳过迁移");
		}
	} catch (error) {
		console.error("❌ 迁移失败:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

migrate();
