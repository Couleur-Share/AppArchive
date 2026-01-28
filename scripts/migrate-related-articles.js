import { pool } from "../server/database.js";

async function migrate() {
  try {
    console.log("正在检查 softwares 表结构...");
    const { rows } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'softwares' AND column_name = 'related_articles'
    `);

    if (rows.length === 0) {
      console.log("正在添加 related_articles 列...");
      await pool.query(`
        ALTER TABLE softwares ADD COLUMN related_articles JSONB DEFAULT '[]'::jsonb;
      `);
      console.log("✅ 成功添加 related_articles 列");
    } else {
      console.log("ℹ️ related_articles 列已存在，跳过迁移");
    }
  } catch (error) {
    console.error("❌ 迁移失败:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
