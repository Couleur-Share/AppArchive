import { describe, it, expect } from "vitest";
import { ref } from "vue";
import { useSoftwareValidation } from "../useSoftwareValidation";

describe("useSoftwareValidation", () => {
	it("should validate required fields", () => {
		const formData = ref({});
		const { validateAll, errors, isValid } = useSoftwareValidation(formData);

		expect(validateAll()).toBe(false);
		expect(errors.value.name).toBeTruthy();
		expect(errors.value.category).toBeTruthy();
		expect(errors.value.systems).toBeTruthy();
		expect(isValid.value).toBe(false);
	});

	it("should validate name length", () => {
		const formData = ref({ name: "a" });
		const { validateField, errors } = useSoftwareValidation(formData);

		validateField("name");
		expect(errors.value.name).toContain("至少 2 个字符");

		formData.value.name = "Valid Name";
		validateField("name");
		expect(errors.value.name).toBeUndefined();
	});

	it("should validate website url", () => {
		const formData = ref({ website: "invalid-url" });
		const { validateField, errors } = useSoftwareValidation(formData);

		validateField("website");
		expect(errors.value.website).toContain("合法网址");

		formData.value.website = "https://example.com";
		validateField("website");
		expect(errors.value.website).toBeUndefined();
	});

	it("should validate duplicate names", () => {
		const formData = ref({ name: "Chrome" });
		const existingNames = ref(["chrome", "firefox"]);
		const { validateField, errors } = useSoftwareValidation(
			formData,
			existingNames,
		);

		validateField("name");
		expect(errors.value.name).toContain("已存在同名软件");

		formData.value.name = "Safari";
		validateField("name");
		expect(errors.value.name).toBeUndefined();
	});

	it("should validate icons correctly", () => {
		// String URL validation (COS)
		const formData = ref({ icon: "https://other-domain.com/icon.png" });
		const { validateAll, errors } = useSoftwareValidation(formData);

		validateAll();
		expect(errors.value.icon).toContain("腾讯云COS");

		formData.value.icon = "https://cos.ap-guangzhou.myqcloud.com/icon.png";
		validateAll();
		expect(errors.value.icon).toBeUndefined();

		// File validation (mocking File)
		const largeFile = { size: 2 * 1024 * 1024, type: "image/png" } as File; // 2MB
		formData.value.icon = largeFile;
		validateAll();
		expect(errors.value.icon).toContain("1MB");
	});
});
