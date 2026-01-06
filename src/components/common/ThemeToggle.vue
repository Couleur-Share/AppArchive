<template>
  <button
    @click="$emit('update:modelValue', !modelValue)"
    class="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100 focus:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-white/60 dark:ring-offset-gray-900/60"
  >
    <div class="relative w-5 h-5">
      <Sun
        class="h-5 w-5 text-amber-500 dark:text-gray-400 absolute transform transition-transform duration-500 rotate-0 dark:-rotate-180 dark:opacity-0"
      />
      <Moon
        class="h-5 w-5 text-gray-700 dark:text-blue-300 absolute transform transition-transform duration-500 rotate-180 opacity-0 dark:rotate-0 dark:opacity-100"
      />
    </div>
  </button>
</template>

<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

defineProps<{
  modelValue: boolean
}>()

defineEmits<(e: 'update:modelValue', value: boolean) => void>()
</script> 