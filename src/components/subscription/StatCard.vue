<template>
  <div
    :class="[
      'px-4 py-3 rounded-lg border',
      variantClass,
    ]"
  >
    <div class="text-xs font-medium" :class="labelColorClass">
      {{ label }}
    </div>
    <div class="mt-1 flex items-baseline gap-1">
      <span class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ value }}
      </span>
      <span v-if="max" class="text-xs text-gray-400">/ {{ max }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'neutral' | 'success' | 'warning' | 'info'

const props = withDefaults(
  defineProps<{
    label: string
    value: number
    max?: number
    variant?: Variant
  }>(),
  { variant: 'neutral' },
)

const variantClass = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'border-green-200 dark:border-green-900/50 bg-green-50/60 dark:bg-green-900/10'
    case 'warning':
      return 'border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-900/10'
    case 'info':
      return 'border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-900/10'
    default:
      return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
  }
})

const labelColorClass = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'text-green-600 dark:text-green-400'
    case 'warning':
      return 'text-amber-600 dark:text-amber-400'
    case 'info':
      return 'text-blue-600 dark:text-blue-400'
    default:
      return 'text-gray-500 dark:text-gray-400'
  }
})
</script>
