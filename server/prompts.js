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
 *
 * options.websiteContext      - 官网爬取结果（来自 fetchWebsiteContext）
 * options.searchResults       - 网络搜索结果（来自 searchTavily）
 * options.safetySearchResults - 安全风险搜索结果（来自 searchTavilySafety）
 */
export function buildAnalyzeMessages(software = {}, options = {}) {
	const normalized = {
		name: sanitizeText(software.name) || "未命名软件",
		description: sanitizeText(software.description),
		category: sanitizeText(software.category),
		license: sanitizeText(software.license),
		website: sanitizeText(software.website),
	};
	const websiteContext = options?.websiteContext || null;
	const hasWebsiteContext = Boolean(websiteContext?.fetched);
	const searchResults = options?.searchResults || null;
	const hasSearchResults =
		Boolean(searchResults?.searched) &&
		Array.isArray(searchResults.results) &&
		searchResults.results.length > 0;
	const safetySearchResults = options?.safetySearchResults || null;
	const hasSafetyResults =
		Boolean(safetySearchResults?.searched) &&
		Array.isArray(safetySearchResults.results) &&
		safetySearchResults.results.length > 0;

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
			"安全风险审查：",
			"- 你必须审查该软件是否存在安全事件、供应链投毒、隐私争议、数据泄露、恶意行为等黑历史",
			"- 如果有相关信息（来自搜索结果或你自身知识），必须如实列入 warnings 字段",
			"- warnings 的内容必须基于真实事件，注明时间和事件概要，不要编造",
			"- 如果确实没有任何安全风险信息，warnings 输出空数组即可",
			"",
			"输出规范：",
			"- 必须输出纯JSON，不要任何额外文字、代码块标记或解释",
			"- 优缺点要具体、可感知，避免空泛表述（如「功能强大」「体验好」）",
			"- 不确定的信息宁可不写，不要编造",
		].join("\n"),
	};

	const hasWebsite = Boolean(normalized.website);

	// ---- 网络搜索补充信息段落 ----
	const searchSection = [];
	if (hasSearchResults) {
		searchSection.push("## 网络搜索补充信息（系统检索）");
		searchSection.push(`搜索查询：${sanitizeText(searchResults.query)}`);
		if (searchResults.answer) {
			searchSection.push(`搜索摘要：${sanitizeText(searchResults.answer)}`);
		}
		searchSection.push("");
		const topResults = searchResults.results.slice(0, 5);
		for (let i = 0; i < topResults.length; i++) {
			const r = topResults[i];
			searchSection.push(
				`来源${i + 1}：${sanitizeText(r.title)}（${sanitizeText(r.url)}）`,
			);
			if (r.content) {
				searchSection.push(
					`摘要：${sanitizeText(r.content).slice(0, 300)}`,
				);
			}
			searchSection.push("");
		}
	} else if (searchResults?.error) {
		searchSection.push("## 网络搜索补充信息（系统检索）");
		searchSection.push(`检索状态：${sanitizeText(searchResults.error)}`);
		searchSection.push("");
	}

	// ---- 安全风险搜索段落 ----
	const safetySection = [];
	if (hasSafetyResults) {
		safetySection.push("## 安全风险搜索结果（系统检索）");
		safetySection.push(
			`搜索查询：${sanitizeText(safetySearchResults.query)}`,
		);
		if (safetySearchResults.answer) {
			safetySection.push(
				`搜索摘要：${sanitizeText(safetySearchResults.answer)}`,
			);
		}
		safetySection.push("");
		const topResults = safetySearchResults.results.slice(0, 5);
		for (let i = 0; i < topResults.length; i++) {
			const r = topResults[i];
			safetySection.push(
				`来源${i + 1}：${sanitizeText(r.title)}（${sanitizeText(r.url)}）`,
			);
			if (r.content) {
				safetySection.push(
					`摘要：${sanitizeText(r.content).slice(0, 300)}`,
				);
			}
			safetySection.push("");
		}
	} else if (safetySearchResults?.error) {
		safetySection.push("## 安全风险搜索结果（系统检索）");
		safetySection.push(
			`检索状态：${sanitizeText(safetySearchResults.error)}`,
		);
		safetySection.push("");
	}

	// ---- 分析要求：根据可用信息源组合不同指令 ----
	const hasExternalContext = hasWebsiteContext || hasSearchResults;
	const analysisInstructions = [];
	if (hasWebsiteContext && hasSearchResults) {
		analysisInstructions.push(
			"必须综合「官网校验信息」和「网络搜索补充信息」来识别产品真实身份，避免同名误判；若与输入描述冲突，以官网信息和搜索结果为准。",
		);
		analysisInstructions.push(
			"优先采信官网信息，网络搜索作为交叉验证和补充；如果两者矛盾，以官网为准。",
		);
	} else if (hasWebsiteContext) {
		analysisInstructions.push(
			"必须优先依据「官网校验信息」识别产品身份，避免同名误判；若与输入描述冲突，以官网信息为准。",
		);
	} else if (hasSearchResults) {
		analysisInstructions.push(
			"请依据「网络搜索补充信息」识别产品身份，注意区分同名不同产品；只采用与目标软件明确相关的搜索结果。",
		);
	} else if (hasWebsite) {
		analysisInstructions.push(
			"请访问官网获取最新信息，结合网络上的真实用户评价进行分析。",
		);
	} else {
		analysisInstructions.push(
			"请搜索该软件的官方信息和真实用户评价进行分析。",
		);
	}
	if (hasExternalContext) {
		analysisInstructions.push(
			"如果外部信息不足以确认产品身份，请保守输出，不要将同名但不同产品的特征写入结果。",
		);
	}
	if (hasSafetyResults) {
		analysisInstructions.push(
			"请仔细审查「安全风险搜索结果」，如果包含与该软件直接相关的安全事件、投毒、隐私泄露等信息，必须提取到 warnings 字段中。注意区分同名软件，不要将无关产品的安全事件写入。",
		);
	} else {
		analysisInstructions.push(
			"请基于你自身的知识判断该软件是否有已知安全事件或争议历史，如有则列入 warnings 字段。",
		);
	}

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
			"## 官网校验信息（系统抓取）",
			hasWebsiteContext
				? `抓取地址：${sanitizeText(websiteContext.resolved_url || websiteContext.requested_url)}`
				: "",
			hasWebsiteContext && websiteContext.title
				? `页面标题：${sanitizeText(websiteContext.title)}`
				: "",
			hasWebsiteContext && websiteContext.description
				? `页面简介：${sanitizeText(websiteContext.description)}`
				: "",
			hasWebsiteContext && websiteContext.site_name
				? `站点名称：${sanitizeText(websiteContext.site_name)}`
				: "",
			hasWebsiteContext &&
			Array.isArray(websiteContext.headings) &&
			websiteContext.headings.length
				? `关键标题：${websiteContext.headings.slice(0, 6).join(" | ")}`
				: "",
			hasWebsiteContext && websiteContext.snippet
				? `正文摘录：${sanitizeText(websiteContext.snippet)}`
				: "",
			!hasWebsiteContext && websiteContext?.error
				? `抓取状态：${sanitizeText(websiteContext.error)}`
				: "",
			"",
			...searchSection,
			...safetySection,
			"## 分析要求",
			...analysisInstructions,
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
			"**warnings** (0-5条，每条15-50字)：",
			"该软件的安全风险、黑历史、争议事件，仅写有据可查的真实事件：",
			"✓ 好的写法：「2023年被发现在npm包中植入恶意代码，影响约5000名开发者」",
			"✓ 好的写法：「2024年用户反馈该软件未经授权收集剪贴板数据」",
			"✗ 差的写法：「可能存在安全风险」「软件不够安全」",
			"如果没有已知安全事件，输出空数组 []",
			"",
			"## 输出格式（严格JSON，无其他内容）",
			'{"description":"","pros":[],"cons":[],"systems":[],"warnings":[]}',
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
