export type ChannelType = "meow";

export type TestStatus = "success" | "failed" | "pending";

export interface ChannelConfigMasked {
	nickname_masked?: string;
}

export interface UserChannel {
	id: number;
	channel_type: ChannelType;
	label: string;
	is_primary: boolean;
	enabled: boolean;
	config_masked: ChannelConfigMasked;
	last_test_at: string | null;
	last_test_status: TestStatus | null;
	last_test_error: string | null;
	created_at: string;
	updated_at: string;
}

export interface ChannelSnapshot {
	id: number;
	type: ChannelType;
	label: string;
	is_primary: boolean;
	is_default?: boolean;
}

export interface SoftwareSnapshot {
	name: string;
	icon: string;
	website: string;
}

export type CheckIntervalMinutes = 15 | 60 | 360 | 720 | 1440;

export type PausedReason =
	| "channel_error"
	| "no_channel"
	| "user_paused"
	| null;

export interface Subscription {
	id: number;
	software_id: number;
	software_snapshot: SoftwareSnapshot;
	channel_id: number | null;
	channel_snapshot: ChannelSnapshot | null;
	check_interval_minutes: CheckIntervalMinutes;
	include_prerelease: boolean;
	last_notified_version: string | null;
	last_notified_at: string | null;
	last_checked_at: string | null;
	next_check_at: string;
	consecutive_failures: number;
	paused_reason: PausedReason;
	created_at: string;
	updated_at: string;
}

export interface SubscriptionCreateInput {
	software_id: number;
	channel_id?: number | null;
	check_interval_minutes: CheckIntervalMinutes;
	include_prerelease: boolean;
}

export interface SubscriptionUpdateInput {
	channel_id?: number | null;
	check_interval_minutes?: CheckIntervalMinutes;
	include_prerelease?: boolean;
	resume?: boolean;
}

export interface ChannelCreateInput {
	channel_type: ChannelType;
	label?: string;
	config: Record<string, string>;
	is_primary?: boolean;
}

export interface ChannelUpdateInput {
	label?: string;
	enabled?: boolean;
	config?: Record<string, string>;
}

export interface NotificationLog {
	id: number;
	channel_type: string;
	tag_name: string | null;
	status: "success" | "failed" | "skipped";
	error: string | null;
	http_status: number | null;
	latency_ms: number | null;
	sent_at: string;
}

export interface IntervalPreset {
	value: CheckIntervalMinutes;
	label: string;
}

export const INTERVAL_PRESETS: readonly IntervalPreset[] = [
	{ value: 15, label: "15 分钟" },
	{ value: 60, label: "1 小时" },
	{ value: 360, label: "6 小时" },
	{ value: 720, label: "12 小时" },
	{ value: 1440, label: "1 天" },
] as const;

export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
	meow: "MeoW",
};

export function intervalLabel(minutes: number): string {
	return (
		INTERVAL_PRESETS.find((p) => p.value === minutes)?.label ||
		`${minutes} 分钟`
	);
}

export function pausedReasonLabel(reason: PausedReason): string | null {
	switch (reason) {
		case "channel_error":
			return "通道连续失败已暂停";
		case "no_channel":
			return "未找到可用通道";
		case "user_paused":
			return "已手动暂停";
		default:
			return null;
	}
}
