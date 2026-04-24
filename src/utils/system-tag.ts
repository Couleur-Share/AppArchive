import type { SystemType } from "../types";

const neutralTagClass =
	"bg-gray-100/85 text-gray-700 border-gray-200/80 dark:bg-[#252525] dark:text-gray-300 dark:border-white/10";

const fallbackIdleCardClass =
	"border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/35 dark:hover:border-primary/35";

const fallbackSelectedCardClass =
	"border-primary bg-primary/10 dark:bg-primary/[0.14] dark:border-primary/45 shadow-sm shadow-primary/10";

const fallbackSelectionDotClass = "bg-primary";

const systemTagClassMap: Record<SystemType, string> = {
	Windows: neutralTagClass,
	macOS: neutralTagClass,
	Linux: neutralTagClass,
	Android: neutralTagClass,
	iOS: neutralTagClass,
	HarmonyOS: neutralTagClass,
	Chrome: neutralTagClass,
	Edge: neutralTagClass,
	Firefox: neutralTagClass,
	Safari: neutralTagClass,
	Tampermonkey: neutralTagClass,
	Violentmonkey: neutralTagClass,
	ScriptCat: neutralTagClass,
};

const systemIdleCardClassMap: Record<SystemType, string> = {
	Windows: fallbackIdleCardClass,
	macOS: fallbackIdleCardClass,
	Linux: fallbackIdleCardClass,
	Android: fallbackIdleCardClass,
	iOS: fallbackIdleCardClass,
	HarmonyOS: fallbackIdleCardClass,
	Chrome: fallbackIdleCardClass,
	Edge: fallbackIdleCardClass,
	Firefox: fallbackIdleCardClass,
	Safari: fallbackIdleCardClass,
	Tampermonkey: fallbackIdleCardClass,
	Violentmonkey: fallbackIdleCardClass,
	ScriptCat: fallbackIdleCardClass,
};

const systemSelectedCardClassMap: Record<SystemType, string> = {
	Windows: fallbackSelectedCardClass,
	macOS: fallbackSelectedCardClass,
	Linux: fallbackSelectedCardClass,
	Android: fallbackSelectedCardClass,
	iOS: fallbackSelectedCardClass,
	HarmonyOS: fallbackSelectedCardClass,
	Chrome: fallbackSelectedCardClass,
	Edge: fallbackSelectedCardClass,
	Firefox: fallbackSelectedCardClass,
	Safari: fallbackSelectedCardClass,
	Tampermonkey: fallbackSelectedCardClass,
	Violentmonkey: fallbackSelectedCardClass,
	ScriptCat: fallbackSelectedCardClass,
};

const systemSelectionDotClassMap: Record<SystemType, string> = {
	Windows: fallbackSelectionDotClass,
	macOS: fallbackSelectionDotClass,
	Linux: fallbackSelectionDotClass,
	Android: fallbackSelectionDotClass,
	iOS: fallbackSelectionDotClass,
	HarmonyOS: fallbackSelectionDotClass,
	Chrome: fallbackSelectionDotClass,
	Edge: fallbackSelectionDotClass,
	Firefox: fallbackSelectionDotClass,
	Safari: fallbackSelectionDotClass,
	Tampermonkey: fallbackSelectionDotClass,
	Violentmonkey: fallbackSelectionDotClass,
	ScriptCat: fallbackSelectionDotClass,
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
