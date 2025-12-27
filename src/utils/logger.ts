export type LogLevel = "debug" | "info" | "warn" | "error";

const isDev = import.meta.env.DEV === true;

function formatMessage(level: LogLevel, args: unknown[]) {
	const time = new Date().toISOString();
	return [`[${time}] [${level.toUpperCase()}]`, ...args];
}

export const logger = {
	debug: (...args: unknown[]) => {
		if (isDev) {
			// 仅开发环境输出
			// eslint-disable-next-line no-console
			console.log(...formatMessage("debug", args));
		}
	},
	info: (...args: unknown[]) => {
		if (isDev) {
			// eslint-disable-next-line no-console
			console.info(...formatMessage("info", args));
		}
	},
	warn: (...args: unknown[]) => {
		if (isDev) {
			// 仅开发环境提示告警，避免生产环境噪音
			// eslint-disable-next-line no-console
			console.warn(...formatMessage("warn", args));
		}
	},
	error: (...args: unknown[]) => {
		// 错误始终输出，便于排障
		// eslint-disable-next-line no-console
		console.error(...formatMessage("error", args));
	},
};

export default logger;
