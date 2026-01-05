export const getApiBase = () => {
	if (import.meta.env.VITE_API_BASE_URL) {
		return import.meta.env.VITE_API_BASE_URL;
	}

	if (typeof window !== "undefined") {
		const { hostname } = window.location;

		// 本地开发：前端通常跑在 5173，后端跑在 3001
		if (hostname === "localhost" || hostname === "127.0.0.1") {
			return "http://localhost:3001/api";
		}

		// 线上默认走同源（避免 https 页面去请求 http 导致 Mixed Content）
		return `${window.location.origin}/api`;
	}

	return "http://localhost:3001/api";
};

export const buildApiUrl = (endpoint: string) => `${getApiBase()}${endpoint}`;
