import type { ComparisonGroup, Software, User } from "../types";

export const typeGuards = {
	isSoftware(obj: unknown): obj is Software {
		return (
			typeof obj === "object" &&
			obj !== null &&
			"id" in obj &&
			"name" in obj &&
			"category" in obj &&
			"status" in obj
		);
	},

	isComparisonGroup(obj: unknown): obj is ComparisonGroup {
		return (
			typeof obj === "object" &&
			obj !== null &&
			"id" in obj &&
			"title" in obj &&
			"software_ids" in obj &&
			"status" in obj
		);
	},

	isUser(obj: unknown): obj is User {
		return (
			typeof obj === "object" && obj !== null && "id" in obj && "email" in obj
		);
	},
};
