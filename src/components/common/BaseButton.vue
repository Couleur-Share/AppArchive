<template>
  <component
    :is="tag"
    v-bind="tag === 'a' ? { href, target, rel } : { type }"
    :disabled="tag === 'button' ? isDisabled : undefined"
    :aria-busy="loading ? 'true' : undefined"
    :class="[
      baseClass,
      sizeClass,
      variantClass,
      block ? 'w-full' : '',
      (isDisabled && tag === 'a') ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
    ]"
  >
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
    <slot />
  </component>
  
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
type Size = 'md' | 'sm' | 'xs'
type TagName = 'button' | 'a'

const props = withDefaults(defineProps<{
  variant?: Variant
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  disabled?: boolean
  loading?: boolean
  tag?: TagName
  href?: string
  target?: string
  rel?: string
}>(), {
  variant: 'secondary',
  size: 'md',
  type: 'button',
  block: false,
  disabled: false,
  loading: false,
  tag: 'button',
  target: '_self',
  rel: 'noopener noreferrer'
})

const baseClass = 'inline-flex items-center justify-center gap-2 rounded-lg text-sm transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-150 ease-out focus:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

const sizeClass = computed(() => {
  if (props.size === 'xs') return 'px-2.5 py-1 text-xs'
  if (props.size === 'sm') return 'px-3 py-1.5'
  return 'px-4 py-2'
})

const isDisabled = computed(() => props.disabled || props.loading)

const variantClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-primary text-[rgb(18_18_18)] hover:bg-[#1db954] shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 focus-visible:ring-primary/70'
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400 shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 focus-visible:ring-red-500/70'
    case 'ghost':
      return 'bg-transparent text-gray-800 dark:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] focus-visible:ring-primary/35'
    case 'link':
      return 'bg-transparent text-primary hover:text-[#169c46] hover:underline focus-visible:ring-primary/50'
    default:
      return 'border border-gray-200 dark:border-gray-700 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-gray-800 dark:text-gray-200 focus-visible:ring-primary/35'
  }
})
</script>

<style scoped>
</style>


