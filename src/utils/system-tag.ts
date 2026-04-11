import type { SystemType } from "../types";

const neutralTagClass =
	"bg-slate-100/80 text-slate-700 border-slate-300/65 dark:bg-slate-800/72 dark:text-slate-200 dark:border-slate-600/70";

const fallbackIdleCardClass =
	"border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-slate-300 dark:hover:border-slate-600";

const fallbackSelectedCardClass =
	"border-slate-500 bg-slate-50 dark:bg-slate-900/20 dark:border-slate-500/50 shadow-sm";

const fallbackSelectionDotClass = "bg-slate-500";

const systemTagClassMap: Record<SystemType, string> = {
	Windows:
		"bg-blue-50/85 text-blue-700 border-blue-200/80 dark:bg-blue-950/35 dark:text-blue-200 dark:border-blue-800/70",
	macOS:
		"bg-indigo-50/85 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/35 dark:text-indigo-200 dark:border-indigo-800/70",
	Linux:
		"bg-amber-50/85 text-amber-700 border-amber-200/80 dark:bg-amber-950/35 dark:text-amber-200 dark:border-amber-800/70",
	Android:
		"bg-emerald-50/85 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/35 dark:text-emerald-200 dark:border-emerald-800/70",
	iOS:
		"bg-cyan-50/85 text-cyan-700 border-cyan-200/80 dark:bg-cyan-950/35 dark:text-cyan-200 dark:border-cyan-800/70",
	HarmonyOS:
		"bg-violet-50/85 text-violet-700 border-violet-200/80 dark:bg-violet-950/35 dark:text-violet-200 dark:border-violet-800/70",
};

const systemIdleCardClassMap: Record<SystemType, string> = {
	Windows:
		"border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700",
	macOS:
		"border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700",
	Linux:
		"border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-amber-300 dark:hover:border-amber-700",
	Android:
		"border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700",
	iOS:
		"border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-cyan-300 dark:hover:border-cyan-700",
	HarmonyOS:
		"border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-300 dark:hover:border-violet-700",
};

const systemSelectedCardClassMap: Record<SystemType, string> = {
	Windows:
		"border-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-500/50 shadow-sm",
	macOS:
		"border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 dark:border-indigo-500/50 shadow-sm",
	Linux:
		"border-amber-500 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-500/50 shadow-sm",
	Android:
		"border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500/50 shadow-sm",
	iOS:
		"border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20 dark:border-cyan-500/50 shadow-sm",
	HarmonyOS:
		"border-violet-500 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-500/50 shadow-sm",
};

const systemSelectionDotClassMap: Record<SystemType, string> = {
	Windows: "bg-blue-500",
	macOS: "bg-indigo-500",
	Linux: "bg-amber-500",
	Android: "bg-emerald-500",
	iOS: "bg-cyan-500",
	HarmonyOS: "bg-violet-500",
};

export const getSystemTagClass = (
	system?: SystemType | string | null,
): string => {
	if (!system) {
		return neutralTagClass;
	}

	return systemTagClassMap[system as SystemType] ?? neutralTagClass;
};

export const getSystemCardClass = (
	system?: SystemType | string | null,
	selected = false,
): string => {
	if (!system) {
		return selected ? fallbackSelectedCardClass : fallbackIdleCardClass;
	}

	return selected
		? (systemSelectedCardClassMap[system as SystemType] ??
				fallbackSelectedCardClass)
		: (systemIdleCardClassMap[system as SystemType] ?? fallbackIdleCardClass);
};

export const getSystemSelectionDotClass = (
	system?: SystemType | string | null,
): string => {
	if (!system) {
		return fallbackSelectionDotClass;
	}

	return (
		systemSelectionDotClassMap[system as SystemType] ??
		fallbackSelectionDotClass
	);
};
