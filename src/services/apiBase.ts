export const getApiBase = () => {
	if (import.meta.env.VITE_API_BASE_URL) {
		return import.meta.env.VITE_API_BASE_URL;
	}

	if (typeof window !== "undefined") {
		const host = window.location.hostname;
		if (host !== "localhost" && host !== "127.0.0.1") {
			return `http://${host}:3001/api`;
		}
	}

	return "http://localhost:3001/api";
};

export const buildApiUrl = (endpoint: string) => `${getApiBase()}${endpoint}`;
