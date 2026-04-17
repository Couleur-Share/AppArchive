<template>
	<!-- 加载态：骨架屏 -->
	<div
		v-if="state === 'loading'"
		class="release-markdown-skeleton"
		:class="containerClass"
	>
		<div class="skeleton-line skeleton-line-w1" />
		<div class="skeleton-line skeleton-line-w2" />
		<div class="skeleton-line skeleton-line-w3" />
		<div class="skeleton-line skeleton-line-w2" />
	</div>

	<!-- 错误态：降级为原始 Markdown 文本 -->
	<div
		v-else-if="state === 'error'"
		class="release-markdown release-markdown-fallback"
		:class="containerClass"
	>
		<p class="release-fallback-tip">内容渲染失败，已降级为纯文本显示。</p>
		<pre class="release-fallback-body">{{ source }}</pre>
	</div>

	<!-- 正常态：渲染后的 HTML -->
	<!-- 注：html 来自 release-markdown 管线的 rehype-sanitize 净化输出 -->
	<!-- eslint-disable-next-line vue/no-v-html -->
	<div
		v-else
		class="release-markdown"
		:class="containerClass"
		v-html="html"
	/>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import {
	type ReleaseMarkdownContext,
	renderReleaseMarkdown,
} from "../../utils/release-markdown";
import logger from "../../utils/logger";

interface Props {
	source: string;
	context?: ReleaseMarkdownContext;
	/** 额外透传到容器的 class，便于外层控制字号、边距等 */
	containerClass?: string | string[] | Record<string, boolean>;
}

const props = defineProps<Props>();

type RenderState = "loading" | "ready" | "error";

const state = ref<RenderState>("loading");
const html = shallowRef<string>("");

// 空内容直接置为 ready，避免闪烁骨架屏
const normalizedSource = computed(() => props.source ?? "");

let renderToken = 0;

async function doRender() {
	const token = ++renderToken;
	const body = normalizedSource.value;

	if (!body.trim()) {
		html.value = "";
		state.value = "ready";
		return;
	}

	state.value = "loading";
	try {
		const result = await renderReleaseMarkdown(body, props.context);
		// 竞态：若期间又触发过渲染，则丢弃旧结果
		if (token !== renderToken) return;
		html.value = result;
		state.value = "ready";
	} catch (err) {
		if (token !== renderToken) return;
		logger.warn("MarkdownRenderer 渲染失败，降级显示原文", err);
		html.value = "";
		state.value = "error";
	}
}

watch(
	() => [normalizedSource.value, props.context?.owner, props.context?.repo],
	() => {
		doRender();
	},
	{ immediate: true },
);
</script>

<style>
.release-markdown-skeleton {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 0.25rem 0;
}

.skeleton-line {
	height: 0.75rem;
	border-radius: 0.375rem;
	background: linear-gradient(
		90deg,
		rgba(0, 0, 0, 0.06) 0%,
		rgba(0, 0, 0, 0.1) 50%,
		rgba(0, 0, 0, 0.06) 100%
	);
	background-size: 200% 100%;
	animation: release-skeleton-shimmer 1.4s ease-in-out infinite;
}

html.dark .skeleton-line {
	background: linear-gradient(
		90deg,
		rgba(255, 255, 255, 0.06) 0%,
		rgba(255, 255, 255, 0.1) 50%,
		rgba(255, 255, 255, 0.06) 100%
	);
	background-size: 200% 100%;
}

.skeleton-line-w1 {
	width: 92%;
}
.skeleton-line-w2 {
	width: 78%;
}
.skeleton-line-w3 {
	width: 64%;
}

@keyframes release-skeleton-shimmer {
	0% {
		background-position: 200% 0;
	}
	100% {
		background-position: -200% 0;
	}
}

.release-fallback-tip {
	font-size: 0.75rem;
	color: rgb(239 68 68);
	margin-bottom: 0.5rem;
}

.release-fallback-body {
	white-space: pre-wrap;
	word-break: break-word;
	font-size: 0.8125rem;
	line-height: 1.6;
	padding: 0.75rem;
	border-radius: 0.5rem;
	background: rgba(0, 0, 0, 0.04);
	color: rgb(55 65 81);
}

html.dark .release-fallback-body {
	background: rgba(255, 255, 255, 0.04);
	color: rgb(209 213 219);
}
</style>
