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
      (isDisabled && tag === 'a') ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
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

const baseClass = 'rounded-lg transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-100 ease-out focus:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 active:scale-[0.92] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

const sizeClass = computed(() => {
  if (props.size === 'xs') return 'p-1 text-xs'
  if (props.size === 'sm') return 'p-1.5'
  return 'px-3 py-2'
})

const isDisabled = computed(() => props.disabled || props.loading)

const variantClass = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'hover:bg-primary/10 dark:hover:bg-primary/[0.16] text-primary dark:text-primary focus-visible:ring-primary/50'
    case 'danger':
      return 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 focus-visible:ring-red-400/70'
    default:
      return 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-gray-700 dark:text-gray-300 focus-visible:ring-primary/35'
  }
})
</script>

<style scoped>
</style>


