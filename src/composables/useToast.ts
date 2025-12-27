import { ref } from "vue";

interface Toast {
	id: number;
	message: string;
	type: "success" | "error" | "info";
}

const toasts = ref<Toast[]>([]);
let toastId = 0;

export function useToast() {
	const showToast = (message: string, type: Toast["type"] = "info") => {
		const id = toastId++;
		toasts.value.push({ id, message, type });
		setTimeout(() => {
			toasts.value = toasts.value.filter((t) => t.id !== id);
		}, 3000);
	};

	return {
		toasts,
		showToast,
	};
}
