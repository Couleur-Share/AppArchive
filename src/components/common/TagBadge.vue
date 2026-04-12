<template>
  <span :class="[
    'inline-flex items-center gap-1 whitespace-nowrap border select-none transition-[background-color,border-color,color,box-shadow] duration-200 ease-out',
    sizeClass,
    radiusClass,
    weightClass,
    variantClass,
    klass
  ]">
    <slot>{{ label }}</slot>
  </span>
  
</template>

<script setup lang="ts">
import { computed } from 'vue'

type TagVariant =
  | 'neutral'
  | 'primary'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'violet'
  | 'fuchsia'

type TagSize = 'xs' | 'sm' | 'md'
type TagRadius = 'md' | 'full'

const props = withDefaults(defineProps<{
  label?: string
  class?: string
  variant?: TagVariant
  size?: TagSize
  radius?: TagRadius
  strong?: boolean
}>(), {
  label: '',
  class: '',
  variant: 'neutral',
  size: 'sm',
  radius: 'md',
  strong: false
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'h-5 px-2 text-xs leading-none'
    case 'md':
      return 'h-7 px-3 text-sm leading-none'
    default:
      return 'h-6 px-2.5 text-xs leading-none'
  }
})

const radiusClass = computed(() => (props.radius === 'full' ? 'rounded-full' : 'rounded-md'))
const weightClass = computed(() => (props.strong ? 'font-semibold' : 'font-medium'))

const variantClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-primary/12 text-[hsl(var(--primary-h)_72%_28%)] border-primary/25 dark:bg-primary/[0.16] dark:text-[hsl(var(--primary-h)_74%_82%)] dark:border-primary/[0.28]'
    case 'info':
      return 'bg-[#539df5]/10 text-[#2c66b6] border-[#539df5]/20 dark:bg-[#539df5]/16 dark:text-[#a8c9ff] dark:border-[#539df5]/28'
    case 'success':
      return 'bg-[#1db954]/10 text-[#16783d] border-[#1db954]/20 dark:bg-[#1db954]/16 dark:text-[#9be6b7] dark:border-[#1db954]/28'
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-900/35 dark:text-amber-300 dark:border-amber-700/70'
    case 'danger':
      return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-900/35 dark:text-rose-300 dark:border-rose-700/70'
    case 'violet':
      return 'bg-stone-100/85 text-stone-700 border-stone-200/80 dark:bg-[#252525] dark:text-stone-200 dark:border-white/10'
    case 'fuchsia':
      return 'bg-zinc-100/85 text-zinc-700 border-zinc-200/80 dark:bg-[#252525] dark:text-zinc-200 dark:border-white/10'
    default:
      return 'bg-gray-100/85 text-gray-700 border-gray-200/80 dark:bg-[#252525] dark:text-gray-300 dark:border-white/10'
  }
})

const klass = computed(() => props.class)
</script>

<style scoped>
</style>


