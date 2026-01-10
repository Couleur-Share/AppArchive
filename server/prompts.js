// 统一的后端提示词构造模块
// 核心目标：帮助用户快速决策是否安装某款软件

const sanitizeText = (value) => {
	if (value == null) return "";
	const text = typeof value === "string" ? value : String(value);
	return text.trim();
};

/**
 * 构造"单软件分析"对话消息
 * 定位：软件选购顾问，提供有决策价值的信息
 */
export function buildAnalyzeMessages(software = {}) {
	const normalized = {
		name: sanitizeText(software.name) || "未命名软件",
		description: sanitizeText(software.description),
		category: sanitizeText(software.category),
		license: sanitizeText(software.license),
		website: sanitizeText(software.website),
	};

	const system = {
		role: "system",
		content: [
			"你是一位资深软件选购顾问，专门帮助用户判断「这款软件是否值得安装」。",
			"",
			"你的分析风格：",
			"- 直击要害：只说对决策有用的信息，不说正确的废话",
			"- 真实体验视角：像一个真正用过这款软件的人在分享心得",
			"- 差异化洞察：指出这款软件与同类产品相比的独特之处",
			"- 场景化建议：明确告诉用户「什么情况下该用它，什么情况下别用它」",
			"",
			"输出规范：",
			"- 必须输出纯JSON，不要任何额外文字、代码块标记或解释",
			"- 优缺点要具体、可感知，避免空泛表述（如「功能强大」「体验好」）",
			"- 不确定的信息宁可不写，不要编造",
		].join("\n"),
	};

	const hasWebsite = Boolean(normalized.website);

	const user = {
		role: "user",
		content: [
			`请分析软件「${normalized.name}」，帮助用户判断是否值得安装。`,
			"",
			"## 已知信息",
			normalized.description ? `描述：${normalized.description}` : "",
			normalized.category ? `类别：${normalized.category}` : "",
			normalized.license ? `授权：${normalized.license}` : "",
			normalized.website ? `官网：${normalized.website}` : "",
			"",
			"## 分析要求",
			hasWebsite
				? "请访问官网获取最新信息，结合网络上的真实用户评价进行分析。"
				: "请搜索该软件的官方信息和真实用户评价进行分析。",
			"",
			"## 输出字段说明",
			"",
			"**description** (40-90字)：",
			"用一句话说清楚「这软件是干什么的 + 最大特色是什么」",
			"示例：「一款专注代码片段管理的工具，支持云同步和智能搜索，适合需要跨设备管理代码的开发者」",
			"",
			"**pros** (1-5条，每条10-25字)：",
			"写出让用户心动的真实优点，要具体可感知：",
			"✓ 好的写法：「启动速度0.5秒内，无需等待」「支持50+语言语法高亮」",
			"✗ 差的写法：「速度快」「功能强大」「体验好」",
			"",
			"**cons** (1-5条，每条10-25字)：",
			"写出用户可能踩的坑，帮助他们提前避雷：",
			"✓ 好的写法：「免费版限制3个项目，个人够用但团队不够」「中文界面翻译不完整」",
			"✗ 差的写法：「有些功能要付费」「不够完美」",
			"",
			"**systems** (数组)：",
			"从 Windows、macOS、Linux、Android、iOS、HarmonyOS 中选择支持的平台",
			"只写确定支持的，不确定就不要写",
			"",
			"## 输出格式（严格JSON，无其他内容）",
			'{"description":"","pros":[],"cons":[],"systems":[]}',
		]
			.filter(Boolean)
			.join("\n"),
	};

	return [system, user];
}

/**
 * 构造"多软件对比"对话消息
 * 定位：帮助用户在多个同类软件中做出选择
 */
export function buildCompareMessages(softwares = []) {
	const normalizedList = softwares.map((s = {}) => {
		const name = sanitizeText(s.name) || "未命名软件";
		const description = sanitizeText(s.description);
		return { name, description };
	});

	const list = normalizedList
		.map((s, index) => {
			const idx = `${index + 1}. ${s.name}`;
			return s.description ? `${idx}：${s.description}` : idx;
		})
		.join("\n");

	const system = {
		role: "system",
		content: [
			"你是一位软件选购顾问，专门帮助用户在多个同类软件中做出最佳选择。",
			"",
			"你的对比风格：",
			"- 差异化对比：重点说每款软件的独特卖点和致命缺点",
			"- 场景化推荐：针对不同使用场景给出明确建议",
			"- 决策导向：让用户看完就知道该选哪个",
			"",
			"输出规范：",
			"- 使用 Markdown 格式，标题+列表结构",
			"- 严禁将多行内容压缩为一行，必须正确使用换行符",
			"- 每款软件的优缺点要有差异性，不要重复套话",
			"- 选择建议要覆盖不同用户画像和使用场景",
		].join("\n"),
	};

	const user = {
		role: "user",
		content: [
			"请对比以下软件，帮助用户选择最适合的那一款。",
			"",
			"## 待对比软件",
			list,
			"",
			"## 输出格式（严格遵循）",
			"",
			"### 对比要点",
			"- **软件名称**",
			"  - 优点：[独特优势1]；[独特优势2]；[独特优势3]",
			"  - 缺点：[主要短板1]；[主要短板2]",
			"",
			"（每款软件都按此格式列出）",
			"",
			"### 选择建议",
			"- [具体场景/人群]：选**软件名**，因为[一句话理由]",
			"- [具体场景/人群]：选**软件名**，因为[一句话理由]",
			"- [具体场景/人群]：选**软件名**，因为[一句话理由]",
			"",
			"## 写作要求",
			"- 优缺点各2-4条，每条6-20字，用分号分隔",
			"- 优点要体现差异化（这款有而别的没有的）",
			"- 缺点要说真正影响使用的问题",
			"- 选择建议3-5条，覆盖不同使用场景",
			"- 重点词用 **加粗** 标识",
		].join("\n"),
	};

	return [system, user];
}
