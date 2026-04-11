<template>
  <div
    v-show="isVisible"
    :id="id"
    :aria-live="variant === 'info' ? undefined : 'polite'"
    :class="containerClass"
  >
    <span class="min-w-0 leading-[1.35rem]">
      <slot>{{ message }}</slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  id?: string
  message?: string | null
  show?: boolean
  variant?: 'error' | 'info' | 'success' | 'warning'
  size?: 'sm' | 'md'
}>(), {
  variant: 'info',
  size: 'sm',
})

const normalizedMessage = computed(() => (props.message ?? '').trim())
const isVisible = computed(() => props.show ?? Boolean(normalizedMessage.value))

const containerClass = computed(() => {
  const sizeClass = props.size === 'md'
    ? 'rounded-xl px-3.5 py-2.5 text-[13px]'
    : 'rounded-lg px-3 py-2 text-[12px]'

  const baseClass = `w-full border transition-colors ${sizeClass}`

  if (props.variant === 'error') {
    return `${baseClass} border-rose-500/20 bg-rose-500/[0.08] text-rose-600 dark:border-rose-400/20 dark:bg-rose-400/[0.10] dark:text-rose-300`
  }

  if (props.variant === 'success') {
    return `${baseClass} border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/[0.10] dark:text-emerald-300`
  }

  if (props.variant === 'warning') {
    return `${baseClass} border-amber-500/20 bg-amber-500/[0.08] text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/[0.10] dark:text-amber-200`
  }

  return `${baseClass} border-slate-200/80 bg-slate-50/90 text-slate-600 dark:border-slate-700/70 dark:bg-slate-800/45 dark:text-slate-300`
})
</script>
