// 通用复制到剪贴板工具：优先使用现代 API（安全上下文），否则回退到 textarea + execCommand
export async function copyToClipboard(text: string): Promise<void> {
	// 现代 API：仅在安全上下文中可用（HTTPS、localhost等）
	try {
		const anyNavigator: any =
			typeof navigator !== "undefined" ? navigator : undefined;
		if (
			typeof window !== "undefined" &&
			window.isSecureContext &&
			anyNavigator &&
			anyNavigator.clipboard &&
			typeof anyNavigator.clipboard.writeText === "function"
		) {
			await anyNavigator.clipboard.writeText(String(text ?? ""));
			return;
		}
	} catch {
		// 忽略错误，尝试降级方案
	}

	// 降级方案：创建隐藏 textarea，使用 document.execCommand('copy')
	return new Promise<void>((resolve, reject) => {
		try {
			const textarea = document.createElement("textarea");
			textarea.value = String(text ?? "");
			textarea.setAttribute("readonly", "true");
			textarea.style.position = "fixed";
			textarea.style.left = "-9999px";
			textarea.style.top = "0";
			document.body.appendChild(textarea);

			textarea.focus();
			textarea.select();
			textarea.setSelectionRange(0, textarea.value.length);

			const ok = document.execCommand("copy");
			document.body.removeChild(textarea);
			if (ok) {
				resolve();
			} else {
				reject(new Error("execCommand copy failed"));
			}
		} catch (err) {
			reject(err instanceof Error ? err : new Error("复制失败"));
		}
	});
}
