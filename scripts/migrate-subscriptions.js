// 订阅推送功能的 DDL 迁移脚本
// 幂等：重复运行不会报错，仅补齐缺失的表与索引
import { pool } from "../server/database.js";

async function migrate() {
	try {
		console.log("开始创建订阅推送相关的表与索引...");

		// ========== 1. user_channels：通道配置表 ==========
		// config 为加密后的 JSON 字符串（AES-256-GCM），不存明文
		// is_primary 通过部分唯一索引保证每用户最多一个主通道
		await pool.query(`
			CREATE TABLE IF NOT EXISTS user_channels (
				id                SERIAL PRIMARY KEY,
				user_id           INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				channel_type      VARCHAR(32) NOT NULL,
				config            TEXT NOT NULL,
				label             VARCHAR(64) DEFAULT '',
				is_primary        BOOLEAN NOT NULL DEFAULT FALSE,
				enabled           BOOLEAN NOT NULL DEFAULT TRUE,
				last_test_at      TIMESTAMPTZ,
				last_test_status  VARCHAR(32),
				last_test_error   TEXT,
				created_at        TIMESTAMPTZ DEFAULT NOW(),
				updated_at        TIMESTAMPTZ DEFAULT NOW()
			);
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_user_channels_user
				ON user_channels(user_id);
		`);
		await pool.query(`
			CREATE UNIQUE INDEX IF NOT EXISTS idx_user_channels_primary
				ON user_channels(user_id) WHERE is_primary = TRUE;
		`);
		console.log("✅ user_channels 表已就绪");

		// ========== 2. subscriptions：订阅表 ==========
		// check_interval_minutes 五档：15 / 60 / 360 / 720 / 1440
		// channel_id NULL 表示走用户主通道
		// paused_reason NULL 表示正常运行
		await pool.query(`
			CREATE TABLE IF NOT EXISTS subscriptions (
				id                        SERIAL PRIMARY KEY,
				user_id                   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				software_id               INT NOT NULL REFERENCES softwares(id) ON DELETE CASCADE,
				channel_id                INT REFERENCES user_channels(id) ON DELETE SET NULL,
				check_interval_minutes    INT NOT NULL DEFAULT 60
					CHECK (check_interval_minutes IN (15, 60, 360, 720, 1440)),
				include_prerelease        BOOLEAN NOT NULL DEFAULT FALSE,
				last_notified_version     TEXT,
				last_notified_at          TIMESTAMPTZ,
				last_checked_at           TIMESTAMPTZ,
				next_check_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
				consecutive_failures      INT NOT NULL DEFAULT 0,
				paused_reason             VARCHAR(64),
				created_at                TIMESTAMPTZ DEFAULT NOW(),
				updated_at                TIMESTAMPTZ DEFAULT NOW(),
				UNIQUE(user_id, software_id)
			);
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_subscriptions_next_check
				ON subscriptions(next_check_at) WHERE paused_reason IS NULL;
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_subscriptions_software
				ON subscriptions(software_id);
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_subscriptions_user
				ON subscriptions(user_id);
		`);
		console.log("✅ subscriptions 表已就绪");

		// ========== 3. release_ai_summaries：按版本缓存的 AI 摘要 ==========
		// 同一个 release 全站只生成一次，所有订阅者共享
		await pool.query(`
			CREATE TABLE IF NOT EXISTS release_ai_summaries (
				software_id   INT NOT NULL REFERENCES softwares(id) ON DELETE CASCADE,
				tag_name      TEXT NOT NULL,
				summary       TEXT,
				highlights    JSONB DEFAULT '[]'::jsonb,
				breaking      BOOLEAN DEFAULT FALSE,
				provider      VARCHAR(64),
				model         VARCHAR(128),
				generated_at  TIMESTAMPTZ DEFAULT NOW(),
				PRIMARY KEY (software_id, tag_name)
			);
		`);
		console.log("✅ release_ai_summaries 表已就绪");

		// ========== 4. notification_logs：投递明细 ==========
		await pool.query(`
			CREATE TABLE IF NOT EXISTS notification_logs (
				id               SERIAL PRIMARY KEY,
				subscription_id  INT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
				channel_type     VARCHAR(32) NOT NULL,
				tag_name         TEXT,
				status           VARCHAR(32) NOT NULL,
				error            TEXT,
				http_status      INT,
				latency_ms       INT,
				sent_at          TIMESTAMPTZ DEFAULT NOW()
			);
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_notification_logs_sub
				ON notification_logs(subscription_id, sent_at DESC);
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_notification_logs_time
				ON notification_logs(sent_at DESC);
		`);
		console.log("✅ notification_logs 表已就绪");

		// 简单统计，确认迁移结果
		const stats = await pool.query(`
			SELECT
				(SELECT COUNT(*) FROM user_channels)         AS channels,
				(SELECT COUNT(*) FROM subscriptions)         AS subscriptions,
				(SELECT COUNT(*) FROM release_ai_summaries)  AS summaries,
				(SELECT COUNT(*) FROM notification_logs)     AS logs
		`);
		console.log("📊 当前统计:", stats.rows[0]);

		console.log("🎉 订阅推送迁移完成");
	} catch (error) {
		console.error("❌ 迁移失败:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

migrate();
