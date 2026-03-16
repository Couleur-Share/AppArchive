import { AppError, ErrorCode } from "../types/error";

const TOKEN_KEY = "auth_token";

export const getAuthHeaders = () => {
	const token = localStorage.getItem(TOKEN_KEY);
	if (!token) {
		throw new AppError("请先登录后再进行操作", ErrorCode.UNAUTHORIZED);
	}
	return { Authorization: `Bearer ${token}` };
};
