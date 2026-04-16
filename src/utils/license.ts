import type { LicenseType } from "../types";

export type LicenseTagVariant =
	| "neutral"
	| "primary"
	| "info"
	| "success"
	| "warning"
	| "violet";

export const getLicenseTagVariant = (
	license?: LicenseType | string | null,
): LicenseTagVariant => {
	switch (license) {
		case "免费":
			return "success";
		case "收费":
			return "warning";
		case "开源":
			return "info";
		case "已购":
			return "violet";
		default:
			return "neutral";
	}
};
