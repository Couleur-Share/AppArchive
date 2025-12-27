export const comparisonUi = {
	// 右栏宽度默认值（px）
	rightPanelDefaultWidth: 320,
	// 右栏最小/最大宽度限制（px）
	rightPanelMinWidth: 260,
	rightPanelMaxWidth: 480,
	// localStorage 键名
	storageKeys: {
		collapsed: "comparison:rightCollapsed",
		width: "comparison:rightWidth",
	},
} as const;

export type ComparisonUi = typeof comparisonUi;
