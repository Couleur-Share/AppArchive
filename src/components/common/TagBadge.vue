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
      return 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-900/35 dark:text-blue-300 dark:border-blue-700/70'
    case 'info':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200/80 dark:bg-cyan-900/35 dark:text-cyan-200 dark:border-cyan-700/70'
    case 'success':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-900/35 dark:text-emerald-300 dark:border-emerald-700/70'
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-900/35 dark:text-amber-300 dark:border-amber-700/70'
    case 'danger':
      return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-900/35 dark:text-rose-300 dark:border-rose-700/70'
    case 'violet':
      return 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-900/35 dark:text-violet-300 dark:border-violet-700/70'
    case 'fuchsia':
      return 'bg-fuchsia-100/75 text-fuchsia-700 border-fuchsia-200/80 dark:bg-fuchsia-900/40 dark:text-fuchsia-200 dark:border-fuchsia-700/70'
    default:
      return 'bg-gray-100/80 text-gray-700 border-gray-200/80 dark:bg-gray-800/80 dark:text-gray-300 dark:border-gray-700/80'
  }
})

const klass = computed(() => props.class)
</script>

<style scoped>
</style>


