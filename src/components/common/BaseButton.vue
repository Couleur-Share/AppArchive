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
      (isDisabled && tag === 'a') ? 'opacity-70 cursor-not-allowed pointer-events-none' : '',
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

const baseClass = 'inline-flex items-center justify-center gap-2 rounded-lg text-sm transition-colors duration-150 focus:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-white/60 dark:ring-offset-gray-900/60'

const sizeClass = computed(() => {
  if (props.size === 'xs') return 'px-2.5 py-1 text-xs'
  if (props.size === 'sm') return 'px-3 py-1.5'
  return 'px-4 py-2'
})

const isDisabled = computed(() => props.disabled || props.loading)

const variantClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 shadow-lg shadow-blue-500/20'
    case 'danger':
      return 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-400 shadow-lg shadow-red-500/20'
    case 'ghost':
      return 'bg-transparent text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
    case 'link':
      return 'bg-transparent text-blue-600 dark:text-blue-300 hover:underline'
    default:
      return 'border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
  }
})
</script>

<style scoped>
</style>


