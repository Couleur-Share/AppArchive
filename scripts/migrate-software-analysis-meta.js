import { pool } from "../server/database.js";

async function migrate() {
	try {
		console.log("正在检查 softwares 表分析元数据字段...");
		const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'softwares'
        AND column_name IN ('analysis_provider', 'analysis_model', 'analysis_at', 'analysis_sources', 'warnings')
    `);

		const existing = new Set(rows.map((r) => r.column_name));
		const allColumns = [
			"analysis_provider",
			"analysis_model",
			"analysis_at",
			"analysis_sources",
			"warnings",
		];
		const missing = allColumns.filter((column) => !existing.has(column));

		if (missing.length === 0) {
			console.log("ℹ️ 分析元数据字段已全部存在，跳过迁移");
			return;
		}

		for (const column of missing) {
			if (column === "analysis_provider") {
				console.log("正在添加 analysis_provider 列...");
				await pool.query(`
          ALTER TABLE softwares
          ADD COLUMN analysis_provider VARCHAR(50);
        `);
			}

			if (column === "analysis_model") {
				console.log("正在添加 analysis_model 列...");
				await pool.query(`
          ALTER TABLE softwares
          ADD COLUMN analysis_model VARCHAR(120);
        `);
			}

			if (column === "analysis_at") {
				console.log("正在添加 analysis_at 列...");
				await pool.query(`
          ALTER TABLE softwares
          ADD COLUMN analysis_at TIMESTAMP WITH TIME ZONE;
        `);
			}

			if (column === "analysis_sources") {
				console.log("正在添加 analysis_sources 列（text[]）...");
				await pool.query(`
          ALTER TABLE softwares
          ADD COLUMN analysis_sources TEXT[] DEFAULT '{}';
        `);
			}

			if (column === "warnings") {
				console.log("正在添加 warnings 列（text[]）...");
				await pool.query(`
          ALTER TABLE softwares
          ADD COLUMN warnings TEXT[] DEFAULT '{}';
        `);
			}
		}

		console.log("✅ 软件分析元数据字段迁移完成");
	} catch (error) {
		console.error("❌ 迁移失败:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

migrate();
