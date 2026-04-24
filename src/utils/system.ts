import type { SystemType } from "@/types";

export const normalizeSystem = (s: string): SystemType | null => {
	const v = (s || "").trim().toLowerCase();
	if (!v) return null;
	// 操作系统
	if (/(^|\b)win(dows)?(\b|\d)/.test(v)) return "Windows";
	if (/macos|mac\s?os\s?x?|osx|darwin/.test(v)) return "macOS";
	if (/linux|ubuntu|debian|fedora|arch|manjaro/.test(v)) return "Linux";
	if (/android|安卓/.test(v)) return "Android";
	if (/ios|iphone|ipad|ipados/.test(v)) return "iOS";
	if (/harmonyos|鸿蒙/.test(v)) return "HarmonyOS";
	// 浏览器
	if (/microsoft\s?edge|\bedge\b/.test(v)) return "Edge";
	if (/\bchrome\b|chromium/.test(v)) return "Chrome";
	if (/firefox|mozilla/.test(v)) return "Firefox";
	if (/safari/.test(v)) return "Safari";
	// 脚本宿主
	if (/tampermonkey|油猴/.test(v)) return "Tampermonkey";
	if (/violentmonkey|暴力猴/.test(v)) return "Violentmonkey";
	if (/scriptcat|脚本猫/.test(v)) return "ScriptCat";
	return null;
};

export const inferSupportedSystemsFromText = (text: string): SystemType[] => {
	const candidates = new Set<SystemType>();
	const t = (text || "").toLowerCase();
	// 操作系统
	if (/\bwindows\b|\bwin10\b|\bwin11\b/.test(t)) candidates.add("Windows");
	if (
		/\bmacos\b|\bmac\s?os\b|\bosx\b|\bos\s?x\b|\.dmg\b|\bhomebrew\b|\bbrew\b/.test(
			t,
		)
	)
		candidates.add("macOS");
	if (/\blinux\b|ubuntu|debian|fedora|arch|manjaro/.test(t))
		candidates.add("Linux");
	if (/android|安卓|apk|google\s?play|play\s?store/.test(t))
		candidates.add("Android");
	if (/ios|iphone|ipad|app\s?store|testflight|ipados/.test(t))
		candidates.add("iOS");
	if (/harmonyos|鸿蒙|appgallery|华为应用市场/.test(t))
		candidates.add("HarmonyOS");
	// 浏览器
	if (/microsoft\s?edge|edge\s?add-?ons/.test(t)) candidates.add("Edge");
	if (
		/\bchrome\b|chromium|chrome\s?web\s?store|chromewebstore\.google\.com/.test(
			t,
		)
	)
		candidates.add("Chrome");
	if (/firefox|addons\.mozilla\.org|\bamo\b/.test(t))
		candidates.add("Firefox");
	if (/\bsafari\b/.test(t)) candidates.add("Safari");
	// 脚本宿主
	if (/tampermonkey|油猴/.test(t)) candidates.add("Tampermonkey");
	if (/violentmonkey|暴力猴/.test(t)) candidates.add("Violentmonkey");
	if (/scriptcat|脚本猫/.test(t)) candidates.add("ScriptCat");
	return Array.from(candidates);
};

export const inferFromWebsite = (url?: string): SystemType[] => {
	if (!url) return [];
	const u = url.toLowerCase();
	const found = new Set<SystemType>();
	// 应用商店 → 操作系统
	if (u.includes("play.google.com")) found.add("Android");
	if (u.includes("apps.apple.com") || u.includes("itunes.apple.com"))
		found.add("iOS");
	if (u.includes("formulae.brew.sh") || u.includes("homebrew"))
		found.add("macOS");
	if (u.includes("appgallery.huawei.com") || u.includes("appgallery"))
		found.add("HarmonyOS");
	if (
		u.includes("snapcraft.io") ||
		u.includes("flathub.org") ||
		u.includes("gnu.org")
	)
		found.add("Linux");
	if (
		u.includes("microsoft.com") &&
		(u.includes("/store") || u.includes("apps"))
	)
		found.add("Windows");
	// 浏览器扩展商店
	if (
		u.includes("chromewebstore.google.com") ||
		u.includes("chrome.google.com/webstore")
	)
		found.add("Chrome");
	if (u.includes("microsoftedge.microsoft.com/addons")) found.add("Edge");
	if (u.includes("addons.mozilla.org")) found.add("Firefox");
	if (u.includes("apps.apple.com") && u.includes("safari-extension"))
		found.add("Safari");
	// 用户脚本托管平台 → 默认三宿主都兼容
	if (
		u.includes("greasyfork.org") ||
		u.includes("openuserjs.org") ||
		u.includes("sleazyfork.org") ||
		u.includes("scriptcat.org")
	) {
		found.add("Tampermonkey");
		found.add("Violentmonkey");
		found.add("ScriptCat");
	}
	return Array.from(found);
};
