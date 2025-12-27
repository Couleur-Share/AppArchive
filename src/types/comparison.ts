import type { Software } from "./index";

export interface ComparisonGroup {
	id: number;
	name: string;
	description: string;
	created_at: string;
	updated_at: string;
}

export interface ComparisonTarget {
	id: number;
	target_id: number;
	group_id: number;
	created_at: string;
	target: Software;
	group: ComparisonGroup;
}
