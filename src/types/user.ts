import type { BaseEntity } from "./base";

export interface User extends BaseEntity {
	email: string;
	name?: string;
	avatar_url?: string;
	preferences?: UserPreferences;
}

export interface UserPreferences {
	theme: "light" | "dark" | "system";
	language: "zh" | "en";
	notifications: boolean;
}
