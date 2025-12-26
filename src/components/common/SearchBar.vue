<template>
  <div class="relative w-48">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      type="text"
      placeholder="搜索软件..."
      class="w-full px-4 py-2 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
    />
    <button
      v-show="modelValue"
      @click="$emit('clear')"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
    >
      <XCircle class="h-4 w-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { XCircle } from 'lucide-vue-next'

defineProps<{
  modelValue: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'clear'): void
}>()
</script> 