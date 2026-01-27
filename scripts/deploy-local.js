
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG = {
	host: "43.139.148.215",
	port: "55555",
	user: "root",
	remotePath: "/data/projects/AppArchive",
	identityFile: "E:/Tools/腾讯云服务器SSH密钥/Pass", 
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

function runCommand(bin, args, description, cwd = rootDir) {
	console.log(`\n👉 [${description}]`);
	console.log(`   $ ${bin} ${args.join(" ")}`);
	const result = spawnSync(bin, args, { stdio: "inherit", cwd, shell: true });
	if (result.status !== 0) {
		console.error(`❌ [${description}] 失败`);
		if (result.error) {
			console.error(result.error);
		}
		return false;
	}
	return true;
}

function buildSshOptionsArgs() {
	const args = [
		"-o",
		"StrictHostKeyChecking=accept-new",
		"-o",
		"IdentitiesOnly=yes",
		"-o",
		"AddKeysToAgent=yes",
	];
	if (CONFIG.identityFile) {
		args.push("-i", CONFIG.identityFile);
	}
	return args;
}

async function main() {
	console.log("🚀 开始自动部署流程 (本地构建 -> 远程上传)");
	console.log(`Target: ${CONFIG.user}@${CONFIG.host}:${CONFIG.port} ${CONFIG.remotePath}\n`);

	// 1. 本地构建
	if (!runCommand("npm", ["run", "build"], "执行本地构建")) {
		process.exit(1);
	}

	// 检查构建产物
	if (!existsSync(join(rootDir, "dist"))) {
		console.error("❌ 未找到 dist 目录，构建可能失败");
		process.exit(1);
	}

	console.log("\n📤 开始上传文件到服务器...");
	const sshOptionsArgs = buildSshOptionsArgs();
	const sshHost = `${CONFIG.user}@${CONFIG.host}`;
	const scpBaseArgs = ["-P", CONFIG.port, ...sshOptionsArgs];
	const remoteDest = `${sshHost}:${CONFIG.remotePath}`;

	// 3. 一次性上传所有文件 (dist, server, package.json)
	// 使用 -r 递归上传目录，同时指定多个源文件，只需要建立一次连接，输入一次密码
	const sources = ["dist", "server", "package.json"];
	if (!runCommand("scp", [...scpBaseArgs, "-r", ...sources, `${remoteDest}/`], "上传项目文件 (dist, server, package.json)")) {
		process.exit(1);
	}

	console.log("\n✅ 文件上传完成！");

	console.log("\n� 下一步（在 1Panel 中手动操作）");
	console.log("1) 如果依赖有改动：在服务器项目目录执行 npm install --omit=dev");
	console.log("2) 在 1Panel 的运行环境里点击“重启”即可");
}

main().catch(console.error);
