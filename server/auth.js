import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { pool } from "./database.js";

const router = Router();

const JWT_SECRET =
	process.env.JWT_SECRET ||
	(process.env.APP_SECRET_KEY || "dev-jwt-secret-key")
		.padEnd(32, "0")
		.slice(0, 32);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// POST /api/auth/login
router.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body || {};

		if (!username || !password) {
			return res
				.status(400)
				.json({ error: "参数错误", message: "用户名和密码不能为空" });
		}

		const result = await pool.query(
			"SELECT id, username, password_hash, display_name, avatar FROM users WHERE username = $1",
			[username],
		);

		if (result.rows.length === 0) {
			return res
				.status(401)
				.json({ error: "认证失败", message: "用户名或密码错误" });
		}

		const userRow = result.rows[0];
		const passwordMatch = await bcrypt.compare(password, userRow.password_hash);

		if (!passwordMatch) {
			return res
				.status(401)
				.json({ error: "认证失败", message: "用户名或密码错误" });
		}

		const payload = {
			userId: userRow.id,
			username: userRow.username,
			displayName: userRow.display_name || userRow.username,
		};

		const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

		res.json({
			success: true,
			token,
			user: {
				id: userRow.id,
				username: userRow.username,
				displayName: userRow.display_name || userRow.username,
				avatar: userRow.avatar || "",
			},
		});
	} catch (error) {
		console.error("登录错误:", error);
		res.status(500).json({ error: "服务器错误", message: "登录处理失败" });
	}
});

// GET /api/auth/me — 验证 token 并返回当前用户信息
router.get("/me", async (req, res) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			return res.status(401).json({ error: "未授权", message: "缺少认证令牌" });
		}

		const token = authHeader.slice(7);
		let decoded;
		try {
			decoded = jwt.verify(token, JWT_SECRET);
		} catch (err) {
			const message =
				err.name === "TokenExpiredError"
					? "登录已过期，请重新登录"
					: "无效的认证令牌";
			return res.status(401).json({ error: "未授权", message });
		}

		// 确认用户仍然存在
		const result = await pool.query(
			"SELECT id, username, display_name, avatar FROM users WHERE id = $1",
			[decoded.userId],
		);

		if (result.rows.length === 0) {
			return res.status(401).json({ error: "未授权", message: "用户不存在" });
		}

		const userRow = result.rows[0];
		res.json({
			success: true,
			user: {
				id: userRow.id,
				username: userRow.username,
				displayName: userRow.display_name || userRow.username,
				avatar: userRow.avatar || "",
			},
		});
	} catch (error) {
		console.error("验证用户错误:", error);
		res.status(500).json({ error: "服务器错误", message: "验证处理失败" });
	}
});

// PUT /api/auth/password — 修改密码（需已登录）
router.put("/password", async (req, res) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			return res.status(401).json({ error: "未授权", message: "缺少认证令牌" });
		}

		let decoded;
		try {
			decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
		} catch (err) {
			const message =
				err.name === "TokenExpiredError"
					? "登录已过期，请重新登录"
					: "无效的认证令牌";
			return res.status(401).json({ error: "未授权", message });
		}

		const { oldPassword, newPassword } = req.body || {};

		if (!oldPassword || !newPassword) {
			return res
				.status(400)
				.json({ error: "参数错误", message: "旧密码和新密码不能为空" });
		}

		if (newPassword.length < 6) {
			return res
				.status(400)
				.json({ error: "参数错误", message: "新密码长度不能少于 6 位" });
		}

		const result = await pool.query(
			"SELECT id, password_hash FROM users WHERE id = $1",
			[decoded.userId],
		);

		if (result.rows.length === 0) {
			return res
				.status(404)
				.json({ error: "用户不存在", message: "当前用户已被删除" });
		}

		const userRow = result.rows[0];
		const passwordMatch = await bcrypt.compare(
			oldPassword,
			userRow.password_hash,
		);

		if (!passwordMatch) {
			return res
				.status(401)
				.json({ error: "认证失败", message: "旧密码不正确" });
		}

		const newHash = await bcrypt.hash(newPassword, 10);
		await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
			newHash,
			decoded.userId,
		]);

		res.json({ success: true, message: "密码修改成功" });
	} catch (error) {
		console.error("修改密码错误:", error);
		res.status(500).json({ error: "服务器错误", message: "修改密码处理失败" });
	}
});

// PUT /api/auth/profile — 修改用户资料（需已登录）
router.put("/profile", async (req, res) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader?.startsWith("Bearer ")) {
			return res.status(401).json({ error: "未授权", message: "缺少认证令牌" });
		}

		let decoded;
		try {
			decoded = jwt.verify(authHeader.slice(7), JWT_SECRET);
		} catch (err) {
			const message =
				err.name === "TokenExpiredError"
					? "登录已过期，请重新登录"
					: "无效的认证令牌";
			return res.status(401).json({ error: "未授权", message });
		}

		const { displayName, avatar } = req.body || {};

		if (displayName === undefined && avatar === undefined) {
			return res
				.status(400)
				.json({ error: "参数错误", message: "请提供要修改的资料" });
		}

		const updates = [];
		const values = [];
		let idx = 1;

		if (displayName !== undefined) {
			if (typeof displayName !== "string" || displayName.length > 100) {
				return res
					.status(400)
					.json({ error: "参数错误", message: "显示名称不能超过 100 个字符" });
			}
			updates.push(`display_name = $${idx++}`);
			values.push(displayName);
		}

		if (avatar !== undefined) {
			if (typeof avatar !== "string" || avatar.length > 2000) {
				return res
					.status(400)
					.json({ error: "参数错误", message: "头像地址无效" });
			}
			updates.push(`avatar = $${idx++}`);
			values.push(avatar);
		}

		values.push(decoded.userId);

		const result = await pool.query(
			`UPDATE users SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, username, display_name, avatar`,
			values,
		);

		if (result.rows.length === 0) {
			return res
				.status(404)
				.json({ error: "用户不存在", message: "当前用户已被删除" });
		}

		const userRow = result.rows[0];
		res.json({
			success: true,
			user: {
				id: userRow.id,
				username: userRow.username,
				displayName: userRow.display_name || userRow.username,
				avatar: userRow.avatar || "",
			},
		});
	} catch (error) {
		console.error("修改资料错误:", error);
		res.status(500).json({ error: "服务器错误", message: "修改资料处理失败" });
	}
});

export default router;
export { JWT_SECRET };
