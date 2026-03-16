import type { App } from "vue";
import { ref } from "vue";
import { getApiBase } from "../services/apiBase";
import logger from "../utils/logger";

const API_BASE = getApiBase();
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export interface AuthUser {
	id: number;
	username: string;
	displayName: string;
	avatar: string;
}

export const isSignedIn = ref(false);
export const user = ref<AuthUser | null>(null);
export const showLoginDialog = ref(false);
export const showPasswordDialog = ref(false);

function getStoredToken(): string | null {
	return localStorage.getItem(TOKEN_KEY);
}

function storeAuth(token: string, userData: AuthUser) {
	localStorage.setItem(TOKEN_KEY, token);
	localStorage.setItem(USER_KEY, JSON.stringify(userData));
	isSignedIn.value = true;
	user.value = userData;
}

function clearAuth() {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
	isSignedIn.value = false;
	user.value = null;
}

export async function login(
	username: string,
	password: string,
): Promise<AuthUser> {
	const res = await fetch(`${API_BASE}/auth/login`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, password }),
	});

	if (!res.ok) {
		const data = await res.json().catch(() => ({ message: "登录失败" }));
		throw new Error(data.message || "登录失败");
	}

	const data = await res.json();
	storeAuth(data.token, data.user);
	return data.user;
}

export function logout() {
	clearAuth();
}

export function openLoginDialog() {
	showLoginDialog.value = true;
}

export function closeLoginDialog() {
	showLoginDialog.value = false;
}

export function openPasswordDialog() {
	showPasswordDialog.value = true;
}

export function closePasswordDialog() {
	showPasswordDialog.value = false;
}

export async function changePassword(
	oldPassword: string,
	newPassword: string,
): Promise<void> {
	const token = getStoredToken();
	if (!token) throw new Error("请先登录");

	const res = await fetch(`${API_BASE}/auth/password`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ oldPassword, newPassword }),
	});

	if (!res.ok) {
		const data = await res.json().catch(() => ({ message: "修改密码失败" }));
		throw new Error(data.message || "修改密码失败");
	}
}

export async function updateProfile(data: {
	displayName?: string;
	avatar?: string;
}): Promise<AuthUser> {
	const token = getStoredToken();
	if (!token) throw new Error("请先登录");

	const res = await fetch(`${API_BASE}/auth/profile`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		const errData = await res.json().catch(() => ({ message: "更新资料失败" }));
		throw new Error(errData.message || "更新资料失败");
	}

	const result = await res.json();
	user.value = result.user;
	localStorage.setItem(USER_KEY, JSON.stringify(result.user));
	return result.user;
}

// 兼容旧的 signOut 名称（App.vue 中使用）
export const signOut = logout;
// 兼容旧的 openSignIn 名称
export const openSignIn = openLoginDialog;

async function restoreSession() {
	const token = getStoredToken();
	if (!token) return;

	// 先从本地缓存恢复，避免白屏
	const cachedUser = localStorage.getItem(USER_KEY);
	if (cachedUser) {
		try {
			const parsed = JSON.parse(cachedUser);
			user.value = parsed;
			isSignedIn.value = true;
		} catch {
			// 缓存无效，忽略
		}
	}

	try {
		const res = await fetch(`${API_BASE}/auth/me`, {
			headers: { Authorization: `Bearer ${token}` },
		});

		if (!res.ok) {
			clearAuth();
			return;
		}

		const data = await res.json();
		user.value = data.user;
		isSignedIn.value = true;
		localStorage.setItem(USER_KEY, JSON.stringify(data.user));
	} catch (err) {
		logger.warn("恢复登录状态失败:", err);
		clearAuth();
	}
}

export async function initAuth(app: App) {
	await restoreSession();

	app.config.globalProperties.$auth = {
		openLoginDialog,
		closeLoginDialog,
		logout,
		user,
		isSignedIn,
	};
}

declare module "@vue/runtime-core" {
	interface ComponentCustomProperties {
		$auth: {
			openLoginDialog: () => void;
			closeLoginDialog: () => void;
			logout: () => void;
			user: typeof user;
			isSignedIn: typeof isSignedIn;
		};
	}
}
