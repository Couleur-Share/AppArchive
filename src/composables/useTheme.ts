import { ref, watch } from "vue";

const THEME_STORAGE_KEY = "dark-mode";

const getInitialDarkMode = () => {
	if (typeof window === "undefined") return true;
	return localStorage.getItem(THEME_STORAGE_KEY) !== "false";
};

const isDark = ref(getInitialDarkMode());
let isThemeSyncStarted = false;

const applyTheme = (value: boolean) => {
	if (typeof document === "undefined") return;
	document.documentElement.classList.toggle("dark", value);
};

const persistTheme = (value: boolean) => {
	if (typeof window === "undefined") return;
	localStorage.setItem(THEME_STORAGE_KEY, value.toString());
};

const startThemeSync = () => {
	if (isThemeSyncStarted) return;
	isThemeSyncStarted = true;

	watch(
		isDark,
		(newValue) => {
			persistTheme(newValue);
			applyTheme(newValue);
		},
		{ immediate: true },
	);
};

export function useTheme() {
	startThemeSync();

	const toggleTheme = () => {
		isDark.value = !isDark.value;
	};

	return {
		isDark,
		toggleTheme,
	};
}
