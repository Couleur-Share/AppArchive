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
 *
 * 输出为结构化 JSON，由前端自定义组件渲染。
 * 不再重复各软件自身的优缺点列表（软件详情页已展示），
 * 而是聚焦横向维度打分、核心差异、适用场景三类决策型信息。
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

	const nameList = normalizedList.map((s) => s.name).join("、");

	const system = {
		role: "system",
		content: [
			"你是一位资深软件选购顾问，专门帮助用户在多个同类软件中做出决策。",
			"",
			"你的对比风格：",
			"- 横向打分：为每个软件在若干关键维度上打分（1-5 分），直观呈现差距",
			"- 差异化聚焦：只说软件之间的本质区别，不重复各软件自身的优缺点清单",
			"- 场景化推荐：针对不同用户画像和使用场景给出明确选择",
			"- 决策导向：用户看完就能做出判断",
			"",
			"特别注意：",
			"- 用户已经在每款软件的详情页看过它们各自的优缺点，不要重复",
			"- 你的价值在于「横向比较」，请聚焦差异而非罗列",
			"- 维度名称要贴合该类软件的选型关注点（例如代理工具会关心：规则灵活度、协议支持、界面易用性、系统资源占用、生态完整度）",
			"",
			"输出规范：",
			"- 必须输出纯 JSON，不要任何额外文字、代码块标记或解释",
			"- 所有字符串字段必须是一行，严禁换行符",
			"- 评分必须是 1-5 的整数",
		].join("\n"),
	};

	const user = {
		role: "user",
		content: [
			`请对比以下软件，帮助用户选出最适合的一款：${nameList}`,
			"",
			"## 待对比软件",
			list,
			"",
			"## 输出字段说明",
			"",
			"**verdict** (30-60 字)：",
			"一句话给出综合结论或选型判断。",
			"例：「三款都属轻量代理工具，Clash Verge 在界面与可视化最均衡，另外两款更偏深度玩家」",
			"",
			"**dimensions** (4-6 个维度)：",
			"横向打分维度。每个维度对比所有软件，每个软件 1-5 分 + 10-25 字短评。",
			"- 维度名要贴合该类软件的选型关注点，避免空泛的「功能」「体验」",
			"- 短评要说清「这个分值的原因」，不是重复优缺点",
			"- ratings 的 key 必须严格使用软件名（与输入一致）",
			"",
			"**key_differences** (3-5 条)：",
			"每条描述一个本质差异（不是某款软件的优点/缺点，而是软件之间的差异点）。",
			"- title：差异主题短标题（6-14 字）",
			"- description：具体展开说明（30-80 字），要说清「A 怎样，B 怎样」",
			"",
			"**scenarios** (3-5 条)：",
			"针对不同用户画像和使用场景给出明确推荐。",
			"- scenario：场景或人群描述（10-20 字）",
			"- recommendation：推荐的软件名（必须是输入列表中的名称之一）",
			"- reason：一句话推荐理由（15-40 字）",
			"",
			"## 输出格式（严格 JSON，无其他内容）",
			"",
			"{",
			'  "verdict": "",',
			'  "dimensions": [',
			"    {",
			'      "name": "",',
			'      "ratings": {',
			...normalizedList.map(
				(s, i) =>
					`        "${s.name}": { "score": 0, "comment": "" }${i === normalizedList.length - 1 ? "" : ","}`,
			),
			"      }",
			"    }",
			"  ],",
			'  "key_differences": [',
			'    { "title": "", "description": "" }',
			"  ],",
			'  "scenarios": [',
			'    { "scenario": "", "recommendation": "", "reason": "" }',
			"  ]",
			"}",
		].join("\n"),
	};

	return [system, user];
}
