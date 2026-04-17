export const getApiBase = () => {
	if (import.meta.env.VITE_API_BASE_URL) {
		return import.meta.env.VITE_API_BASE_URL;
	}

	return "/api";
};

export const buildApiUrl = (endpoint: string) => `${getApiBase()}${endpoint}`;
