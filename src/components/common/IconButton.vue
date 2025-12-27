<template>
  <component
    :is="tag"
    v-bind="tag === 'a' ? { href, target, rel } : { type }"
    :disabled="tag === 'button' ? isDisabled : undefined"
    :aria-label="ariaLabel"
    :title="title"
    :class="[
      baseClass,
      sizeClass,
      variantClass,
      (isDisabled && tag === 'a') ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
    ]"
  >
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
    <slot />
  </component>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { computed } from 'vue'

type Size = 'md' | 'sm' | 'xs'
type TagName = 'button' | 'a'

type Variant = 'default' | 'primary' | 'danger'

const props = withDefaults(defineProps<{
  size?: Size
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  ariaLabel?: string
  title?: string
  tag?: TagName
  variant?: Variant
  href?: string
  target?: string
  rel?: string
}>(), {
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  tag: 'button',
  target: '_self',
  rel: 'noopener noreferrer',
  variant: 'default'
})

const baseClass = 'rounded-lg transition-colors duration-100 focus:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-white/60 dark:ring-offset-gray-900/60'

const sizeClass = computed(() => {
  if (props.size === 'xs') return 'p-1 text-xs'
  if (props.size === 'sm') return 'p-1.5'
  return 'px-3 py-2'
})

const isDisabled = computed(() => props.disabled || props.loading)

const variantClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-300'
    case 'danger':
      return 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
    default:
      return 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
  }
})
</script>

<style scoped>
</style>


