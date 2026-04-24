import { pool } from "../server/database.js";

// 引入浏览器插件与用户脚本支持：为 softwares 表增加 kind 字段
// 取值：app（应用，默认）/ extension（浏览器插件）/ userscript（用户脚本）
// 存量数据全部默认归入 app，不影响现有行为
async function migrate() {
	try {
		console.log("正在检查 softwares 表 kind 字段...");
		const { rows } = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'softwares'
        AND column_name = 'kind'
    `);

		if (rows.length === 0) {
			console.log("正在添加 kind 列（VARCHAR(16)，默认 'app'）...");
			await pool.query(`
        ALTER TABLE softwares
        ADD COLUMN kind VARCHAR(16) NOT NULL DEFAULT 'app';
      `);
		} else {
			console.log("ℹ️ kind 列已存在，跳过 ADD COLUMN");
		}

		// 防御性回填：存量 NULL 或空字符串统一规整为 'app'
		const { rowCount } = await pool.query(`
      UPDATE softwares
      SET kind = 'app'
      WHERE kind IS NULL OR kind = ''
    `);
		if (rowCount > 0) {
			console.log(`已将 ${rowCount} 条存量记录的 kind 回填为 'app'`);
		}

		console.log("正在创建 kind 列索引（若不存在）...");
		await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_softwares_kind ON softwares(kind)
    `);

		console.log("✅ kind 字段迁移完成");
	} catch (error) {
		console.error("❌ 迁移失败:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

migrate();
