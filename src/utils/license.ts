import type { LicenseType } from "../types";

export type LicenseTagVariant =
	| "neutral"
	| "primary"
	| "info"
	| "success"
	| "violet";

export const getLicenseTagVariant = (
	license?: LicenseType | string | null,
): LicenseTagVariant => {
	switch (license) {
		case "免费":
			return "info";
		case "收费":
			return "primary";
		case "开源":
			return "success";
		case "已购":
			return "violet";
		default:
			return "neutral";
	}
};
