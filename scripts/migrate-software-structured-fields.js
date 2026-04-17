import { pool } from "../server/database.js";

async function migrate() {
	try {
		console.log("正在检查 softwares 表结构化字段...");
		const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'softwares'
        AND column_name IN ('tagline', 'highlights', 'best_for', 'avoid_if')
    `);

		const existing = new Set(rows.map((r) => r.column_name));
		const allColumns = ["tagline", "highlights", "best_for", "avoid_if"];
		const missing = allColumns.filter((column) => !existing.has(column));

		if (missing.length === 0) {
			console.log("ℹ️ 结构化字段已全部存在，跳过迁移");
			return;
		}

		for (const column of missing) {
			if (column === "tagline") {
				console.log("正在添加 tagline 列（TEXT）...");
				await pool.query(`
          ALTER TABLE softwares
          ADD COLUMN tagline TEXT DEFAULT '';
        `);
			}

			if (column === "highlights") {
				console.log("正在添加 highlights 列（JSONB 数组）...");
				await pool.query(`
          ALTER TABLE softwares
          ADD COLUMN highlights JSONB DEFAULT '[]'::jsonb;
        `);
			}

			if (column === "best_for") {
				console.log("正在添加 best_for 列（JSONB 数组）...");
				await pool.query(`
          ALTER TABLE softwares
          ADD COLUMN best_for JSONB DEFAULT '[]'::jsonb;
        `);
			}

			if (column === "avoid_if") {
				console.log("正在添加 avoid_if 列（JSONB 数组）...");
				await pool.query(`
          ALTER TABLE softwares
          ADD COLUMN avoid_if JSONB DEFAULT '[]'::jsonb;
        `);
			}
		}

		console.log("✅ 软件结构化字段迁移完成");
	} catch (error) {
		console.error("❌ 迁移失败:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

migrate();
