
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ===== 配置区域 =====
const CONFIG = {
	host: "43.139.148.215",
	port: "55555",
	user: "root",
	remotePath: "/data/projects/AppArchive",
	// 如果你的 SSH key 不是默认的 ~/.ssh/id_rsa，可以在这里指定路径，例如： "C:/Users/You/.ssh/my_key"
	// 留空则使用系统默认（推荐配置 .ssh/config 或使用 ssh-agent）
	identityFile: "", 
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

function runCommand(command, description) {
	console.log(`\n👉 [${description}]`);
	console.log(`   $ ${command}`);
	try {
		execSync(command, { stdio: "inherit", cwd: rootDir });
		return true;
	} catch (error) {
		console.error(`❌ [${description}] 失败`);
		return false;
	}
}

async function main() {
	console.log("🚀 开始自动部署流程 (本地构建 -> 远程上传)");
	console.log(`Target: ${CONFIG.user}@${CONFIG.host}:${CONFIG.port} ${CONFIG.remotePath}\n`);

	// 1. 本地构建
	if (!runCommand("npm run build", "执行本地构建")) {
		process.exit(1);
	}

	// 检查构建产物
	if (!existsSync(join(rootDir, "dist"))) {
		console.error("❌ 未找到 dist 目录，构建可能失败");
		process.exit(1);
	}

	// 2. 准备 SSH/SCP 基础参数
	const sshArgs = `-P ${CONFIG.port}`; // SCP 使用 -P 指定端口
	const auth = CONFIG.identityFile ? `-i "${CONFIG.identityFile}"` : "";
	const remoteDest = `${CONFIG.user}@${CONFIG.host}:${CONFIG.remotePath}`;

	console.log("\n📤 开始上传文件到服务器...");

	// 3. 上传 dist 目录
	// 注意：Windows 下 scp 可能不支持通配符或 exclude，所以分步上传比较稳妥
	const cmdUploadDist = `scp ${sshArgs} ${auth} -r dist ${remoteDest}/`;
	if (!runCommand(cmdUploadDist, "上传 dist 目录 (前端静态资源)")) {
		process.exit(1);
	}

	// 4. 上传 server 目录
	const cmdUploadServer = `scp ${sshArgs} ${auth} -r server ${remoteDest}/`;
	if (!runCommand(cmdUploadServer, "上传 server 目录 (后端代码)")) {
		process.exit(1);
	}

	// 5. 上传 package.json
	const cmdUploadPkg = `scp ${sshArgs} ${auth} package.json ${remoteDest}/`;
	if (!runCommand(cmdUploadPkg, "上传 package.json")) {
		process.exit(1);
	}

	// 6. 上传 scripts 目录 (可选，为了以后能在服务器用 npm run deploy)
    // 但不需要上传 node_modules，也不需要上传 .git 等
    // 简单起见，这里不再上传其他文件，因为上面三个是最核心的

	console.log("\n✅ 文件上传完成！");
	
	console.log("\n� 尝试更新依赖并重启服务...");
	try {
		// 构造远程重启脚本
		// 1. 安装依赖
		// 2. 尝试查找占用 3001 端口的进程并杀掉 (lsof -t -i:3001) 或者 pkill node
		// 3. 使用 nohup 启动新进程
		const remoteScript = `
			cd ${CONFIG.remotePath} && \
			echo "📦 更新依赖..." && \
			npm install --omit=dev && \
			echo "🔄 重启服务..." && \
			(pkill -f "server/index.js" || true) && \
			(lsof -t -i:3001 | xargs -r kill) && \
			nohup npm start > app.log 2>&1 & \
			echo "✅ 服务已在后台启动 (日志: app.log)"
		`.replace(/\n/g, " "); // 压缩为一行

		const restartCmd = `ssh -p ${CONFIG.port} ${auth} ${CONFIG.user}@${CONFIG.host} "${remoteScript}"`;
		
		execSync(restartCmd, { stdio: "inherit" });
		console.log("\n✅ 部署完成！服务已重启。");
	} catch (e) {
		console.log("⚠️  自动重启失败，请手动登录服务器查看:");
		console.log(`   ssh -p ${CONFIG.port} ${CONFIG.user}@${CONFIG.host}`);
	}
}

main().catch(console.error);
