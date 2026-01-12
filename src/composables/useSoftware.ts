import { ref } from "vue";
import { preloadSignedUrls } from "../services/localIconCache";
import { softwareService } from "../services/software";
import type { LicenseType, Software, SystemType } from "../types";
import logger from "../utils/logger";
import { useToast } from "./useToast";

export function useSoftware() {
	const softwares = ref<Software[]>([]);
	const isLoading = ref(false);
	const { showToast } = useToast();

	const fetchSoftwares = async () => {
		try {
			isLoading.value = true;
			logger.debug("开始加载软件列表...");

			const data = await softwareService.getAllSoftware();
			logger.debug("获取到的数据:", data);

			// 预加载所有图标的签名 URL（用于私有存储桶）
			// 在设置 softwares 之前预加载，确保渲染时签名 URL 已就绪
			const iconUrls = data
				.map((s) => s.icon)
				.filter((icon): icon is string => !!icon);
			if (iconUrls.length > 0) {
				try {
					await preloadSignedUrls(iconUrls);
					logger.debug("签名 URL 预加载完成");
				} catch (err) {
					logger.warn("预加载签名 URL 失败:", err);
					// 预加载失败不阻塞列表显示
				}
			}

			softwares.value = data;
			logger.debug("数据加载完成，总数:", data.length);
		} catch (error) {
			logger.error("获取数据失败:", error);
			showToast("获取数据失败", "error");
		} finally {
			isLoading.value = false;
		}
	};

	const addSoftware = async (software: Partial<Software>) => {
		try {
			const softwareData = {
				...software,
				license: software.license as LicenseType,
				systems: (software.systems || []) as SystemType[],
				pros: Array.isArray(software.pros) ? software.pros : [],
				cons: Array.isArray(software.cons) ? software.cons : [],
			};

			await softwareService.addSoftware(softwareData);
			showToast("添加成功", "success");
			await fetchSoftwares();
		} catch (error) {
			logger.error("添加软件失败:", error);
			showToast(error instanceof Error ? error.message : "添加失败", "error");
			throw error;
		}
	};

	const updateSoftware = async (id: number, software: Partial<Software>) => {
		try {
			const softwareData = {
				...software,
				license: software.license as LicenseType,
				systems: (software.systems || []) as SystemType[],
				pros: Array.isArray(software.pros) ? software.pros : [],
				cons: Array.isArray(software.cons) ? software.cons : [],
			};

			await softwareService.updateSoftware(id, softwareData);
			showToast("更新成功", "success");
			await fetchSoftwares();
		} catch (error) {
			logger.error("更新软件失败:", error);
			showToast(error instanceof Error ? error.message : "更新失败", "error");
			throw error;
		}
	};

	const deleteSoftware = async (id: number) => {
		try {
			await softwareService.deleteSoftware(id);
			showToast("删除成功", "success");
			await fetchSoftwares();
		} catch (error) {
			logger.error("删除软件失败:", error);
			showToast(error instanceof Error ? error.message : "删除失败", "error");
			throw error;
		}
	};

	return {
		softwares,
		isLoading,
		fetchSoftwares,
		addSoftware,
		updateSoftware,
		deleteSoftware,
	};
}
