import { z } from "zod";
import { ref, computed, unref, type Ref } from "vue";
import { LICENSES, SYSTEMS } from "@/types/constants";
import type { Software } from "@/types";

// Define schemas
export const downloadLinkSchema = z.object({
	id: z.string(),
	provider: z.string(),
	url: z
		.string()
		.min(1, "下载链接不能为空")
		.refine(
			(v: string) =>
				/^https?:\/\//i.test(v) ||
				v.startsWith("magnet:?") ||
				v.startsWith("ed2k://"),
			"URL 必须是 http(s) / magnet / ed2k",
		),
	code: z.string().optional(),
	password: z.string().optional(),
	versionLabel: z.string().optional(),
	notes: z.string().optional(),
	status: z.enum(["unknown", "alive", "dead"]).optional(),
	createdAt: z.string(),
	expiresAt: z.string().optional(),
});

export const softwareFormSchema = z.object({
	name: z.string().min(2, "名称至少 2 个字符"),
	category: z.string().min(1, "类别必选"),
	description: z.string().optional(),
	icon: z.any().refine((v) => {
		if (!v) return true;
		if (v instanceof File) return true;
		if (typeof v === "string") {
			return (
				v.startsWith("https://") &&
				v.includes("cos.") &&
				v.includes("myqcloud.com")
			);
		}
		return true;
	}, "图标必须上传到腾讯云COS"),
	license: z
		.enum(LICENSES)
		.optional()
		.transform((v) => v ?? "免费"),
	systems: z.array(z.enum(SYSTEMS)).min(1, "至少选择一个系统"),
	website: z
		.string()
		.optional()
		.refine(
			(v: string | undefined) => !v || /^https?:\/\//i.test(v),
			"请输入合法网址（http/https）",
		),
	pros: z.array(z.string()).optional(),
	cons: z.array(z.string()).optional(),
	download_links: z.array(downloadLinkSchema).optional(),
	secrets: z.any().optional(),
});

export type ValidationErrors = Record<string, string>;

export function useSoftwareValidation(
	formDataSource: Ref<Partial<Software>> | Partial<Software>,
	existingNames?: string[] | Ref<string[] | undefined>,
) {
	const errors = ref<ValidationErrors>({});

	const getFormData = () => unref(formDataSource);
	const getExistingNames = () => unref(existingNames);

	// Helper to set a specific error
	const setError = (field: string, message: string) => {
		errors.value[field] = message;
	};

	// Helper to clear a specific error
	const clearError = (field: string) => {
		delete errors.value[field];
	};

	const validateField = (field: keyof Software | string) => {
		const data = getFormData();

		// 1. Zod Schema Validation for single field (by parsing all and picking error)
		try {
			const result = softwareFormSchema.safeParse(data);

			clearError(field);

			if (!result.success) {
				const issue = result.error.issues.find(
					(i) => i.path.join(".") === field,
				);
				if (issue) {
					setError(field, issue.message);
				}
			}
		} catch (e) {
			console.error(e);
		}

		// 2. Custom Validations

		// Name Uniqueness
		if (field === "name" && data.name) {
			const inputName = data.name.trim();
			const names = getExistingNames();
			if (inputName && names && names.length > 0) {
				const lower = inputName.toLowerCase();
				const exists = names.some((n) => n.toLowerCase() === lower);
				if (exists) {
					setError("name", "已存在同名软件");
				}
			}
		}

		// File Validation for Icon
		if (field === "icon" && data.icon instanceof File) {
			const file = data.icon;
			const okType = /^(image\/(png|jpeg|webp|svg\+xml|x-icon))$/i.test(
				file.type,
			);
			if (!okType) {
				setError("icon", "仅支持 PNG/JPEG/WebP/SVG/ICO 格式");
			} else if (file.size > 1024 * 1024) {
				setError("icon", "图片过大，请控制在 1MB 以内");
			}
		}
	};

	const validateAll = () => {
		errors.value = {};
		const data = getFormData();

		// 1. Zod Validation
		const result = softwareFormSchema.safeParse(data);
		if (!result.success) {
			result.error.issues.forEach((issue) => {
				const path = issue.path.join(".");
				errors.value[path] = issue.message;
			});
		}

		// 2. Custom Validations
		// Name Uniqueness
		const names = getExistingNames();
		if (data.name && names) {
			const lower = data.name.trim().toLowerCase();
			if (names.some((n) => n.toLowerCase() === lower)) {
				errors.value.name = "已存在同名软件";
			}
		}

		// File Validation
		if (data.icon instanceof File) {
			const file = data.icon;
			const okType = /^(image\/(png|jpeg|webp|svg\+xml|x-icon))$/i.test(
				file.type,
			);
			if (!okType) errors.value.icon = "仅支持 PNG/JPEG/WebP/SVG/ICO 格式";
			else if (file.size > 1024 * 1024)
				errors.value.icon = "图片过大，请控制在 1MB 以内";
		}

		// Secrets Validation
		if (Array.isArray(data.secrets)) {
			data.secrets.forEach((sec, idx) => {
				const hasCipher = sec && typeof sec.value === "undefined";
				const valueFilled =
					typeof sec?.value === "string" && sec.value.trim().length > 0;
				if (!hasCipher && !valueFilled) {
					errors.value[`secrets.${idx}.value`] = "请填写值";
				}
			});
		}

		return Object.keys(errors.value).length === 0;
	};

	return {
		errors,
		validateField,
		validateAll,
		isValid: computed(() => Object.keys(errors.value).length === 0),
	};
}
