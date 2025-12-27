#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// 彻底清理 node_modules
async function cleanNodeModules() {
	const nodeModulesPath = join(rootDir, "node_modules");
	const lockPath = join(rootDir, "package-lock.json");

	try {
		if (existsSync(nodeModulesPath)) {
			console.log("📦 清理 node_modules 目录...");
			const isWindows = process.platform === "win32";
			if (isWindows) {
				execSync(`rmdir /s /q "${nodeModulesPath}"`, {
					stdio: "inherit",
					cwd: rootDir,
					shell: true,
				});
			} else {
				execSync(`rm -rf "${nodeModulesPath}"`, {
					stdio: "inherit",
					cwd: rootDir,
					shell: true,
				});
			}
		}

		if (existsSync(lockPath)) {
			console.log("📦 清理 package-lock.json...");
			rmSync(lockPath, { force: true });
		}

		await new Promise((resolve) => setTimeout(resolve, 500));
	} catch (error) {
		console.warn("⚠️  清理警告:", error.message);
	}
}

async function main() {
	console.log("🚀 开始部署准备...\n");

	// 1. 清理
	await cleanNodeModules();

	// 2. 清理缓存
	console.log("🧹 清理 npm 缓存...");
	execSync("npm cache clean --force", { stdio: "inherit", cwd: rootDir });

	// 3. 安装完整依赖（包括 devDependencies，用于构建）
	// 使用 --ignore-scripts 防止递归调用（如果此脚本被配置为 prepare 钩子）
	console.log("📥 安装完整依赖（包括 devDependencies）...");
	execSync("npm install --no-audit --no-fund --ignore-scripts", {
		stdio: "inherit",
		cwd: rootDir,
	});

	// 4. 构建前端
	console.log("🏗️  构建前端...");
	execSync("npm run build", { stdio: "inherit", cwd: rootDir });

	// 5. 清理 devDependencies（可选，节省空间）
	console.log("🧹 清理 devDependencies（可选）...");
	try {
		execSync("npm prune --omit=dev", { stdio: "inherit", cwd: rootDir });
	} catch (error) {
		console.warn("⚠️  清理 devDependencies 失败，但不影响运行:", error.message);
	}

	console.log("\n✅ 部署准备完成！");
	console.log("   现在可以运行: npm start");
}

main().catch((error) => {
	console.error("❌ 部署准备失败:", error);
	process.exit(1);
});
