import type { SoftwareCategory } from "../types";

const neutralTagClass =
	"bg-slate-100/80 text-slate-700 border-slate-300/65 dark:bg-slate-800/72 dark:text-slate-200 dark:border-slate-600/70";

const categoryTagClassMap: Record<SoftwareCategory, string> = {
	社交:
		"bg-sky-50/85 text-sky-700 border-sky-200/80 dark:bg-sky-950/35 dark:text-sky-200 dark:border-sky-800/70",
	生活:
		"bg-emerald-50/85 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/35 dark:text-emerald-200 dark:border-emerald-800/70",
	购物:
		"bg-amber-50/85 text-amber-700 border-amber-200/80 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-800/70",
	影音:
		"bg-violet-50/85 text-violet-700 border-violet-200/80 dark:bg-violet-950/35 dark:text-violet-200 dark:border-violet-800/70",
	阅读:
		"bg-cyan-50/85 text-cyan-700 border-cyan-200/80 dark:bg-cyan-950/35 dark:text-cyan-200 dark:border-cyan-800/70",
	休闲:
		"bg-fuchsia-50/85 text-fuchsia-700 border-fuchsia-200/80 dark:bg-fuchsia-950/35 dark:text-fuchsia-200 dark:border-fuchsia-800/70",
	旅行:
		"bg-teal-50/85 text-teal-700 border-teal-200/80 dark:bg-teal-950/35 dark:text-teal-200 dark:border-teal-800/70",
	办公:
		"bg-indigo-50/85 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/35 dark:text-indigo-200 dark:border-indigo-800/70",
	工具:
		"bg-primary/14 text-[hsl(var(--primary-h)_66%_28%)] border-primary/30 dark:bg-primary/25 dark:text-[hsl(var(--primary-h)_82%_82%)] dark:border-primary/50",
	编程:
		"bg-blue-50/85 text-blue-700 border-blue-200/80 dark:bg-blue-950/35 dark:text-blue-200 dark:border-blue-800/70",
};

export const getCategoryTagClass = (
	category?: SoftwareCategory | string | null,
): string => {
	if (!category) {
		return neutralTagClass;
	}

	return categoryTagClassMap[category as SoftwareCategory] ?? neutralTagClass;
};
