import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import IconsResolver from "unplugin-icons/resolver";
import Icons from "unplugin-icons/vite";
// 自动按需引入组件与图标
import Components from "unplugin-vue-components/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		vue(),
		Components({
			resolvers: [
				IconsResolver({
					prefix: "i",
					enabledCollections: ["simple-icons", "logos", "uil"],
				}),
			],
		}),
		Icons({
			compiler: "vue3",
			autoInstall: true,
		}),
	],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	// 开发服务器配置
	server: {
		host: "0.0.0.0",
		port: 5000,
		strictPort: false,
		open: false,
		allowedHosts: true,
		proxy: {
			"/api": {
				target: "http://localhost:3001",
				changeOrigin: true,
			},
		},
	},
	build: {
		rollupOptions: {
			output: {
				// 分包策略：
				//   - markdown：shiki + unified/remark/rehype 管线（仅 release tab 用到，懒加载）
				//   - icons：lucide-vue-next 图标库
				//   - vendor：vue 运行时 + headlessui
				manualChunks(id) {
					if (!id.includes("node_modules")) return;

					// 为 shiki 每种语言/主题生成独立 chunk（Vite 对动态 import 默认会合并小 chunk）
					// 真实语法/主题数据实际在 @shikijs/langs 与 @shikijs/themes 子包
					const shikiLang = id.match(
						/[\\/]@shikijs[\\/]langs[\\/]dist[\\/]([^\\/]+?)\.m?js/,
					);
					if (shikiLang) return `shiki-lang-${shikiLang[1]}`;

					const shikiTheme = id.match(
						/[\\/]@shikijs[\\/]themes[\\/]dist[\\/]([^\\/]+?)\.m?js/,
					);
					if (shikiTheme) return `shiki-theme-${shikiTheme[1]}`;

					// shiki 主包 langs/themes 代理文件本身很小，归入 markdown 核心 chunk
					if (/[\\/]shiki[\\/]dist[\\/](langs|themes)[\\/]/.test(id)) {
						return "markdown";
					}

					// markdown 渲染管线：unified/remark/rehype + shiki 核心运行时
					if (
						/[\\/]node_modules[\\/](shiki|@shikijs[\\/]|unified[\\/]|remark-[^\\/]+[\\/]|rehype-[^\\/]+[\\/]|mdast-[^\\/]+[\\/]|hast-[^\\/]+[\\/]|micromark[^\\/]*[\\/]|unist-[^\\/]+[\\/]|vfile[^\\/]*[\\/]|bail[\\/]|trough[\\/]|decode-named-character-reference[\\/]|property-information[\\/]|zwitch[\\/]|stringify-entities[\\/]|parse-entities[\\/]|character-entities[^\\/]*[\\/]|ccount[\\/]|markdown-table[\\/]|is-plain-obj[\\/])/.test(
							id,
						)
					) {
						return "markdown";
					}

					if (id.includes("/lucide-vue-next/")) return "icons";

					if (
						/[\\/]node_modules[\\/](vue|@vue[\\/]|@headlessui[\\/])/.test(id)
					) {
						return "vendor";
					}
				},
			},
		},
		chunkSizeWarningLimit: 1000,
		cssCodeSplit: true,
		minify: "terser",
		terserOptions: {
			compress: {
				// 移除调试器并将非错误日志作为纯函数移除，保留 console.error
				drop_debugger: true,
				pure_funcs: [
					"console.log",
					"console.info",
					"console.debug",
					"console.warn",
				],
			},
		},
	},
});
