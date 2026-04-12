<template>
  <div class="relative w-36 sm:w-48 lg:w-56">
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      type="text"
      placeholder="搜索软件..."
      class="search-bar-input w-full px-3 sm:px-4 py-2 rounded-xl text-sm transition-all duration-200"
    />
    <button
      v-show="modelValue"
      @click="$emit('clear')"
      class="search-bar-clear absolute right-3 top-1/2 -translate-y-1/2"
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

<style scoped>
.search-bar-input {
  color: var(--home-text);
  background: var(--home-surface-soft);
  border: 1px solid color-mix(in srgb, var(--home-border) 82%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.18);
}

.search-bar-input::placeholder {
  color: var(--home-text-muted);
}

.search-bar-input:focus {
  outline: none;
  background: var(--home-surface-strong);
  border-color: var(--home-accent-border);
  box-shadow:
    0 0 0 4px rgb(30 215 96 / 0.1),
    0 18px 30px -24px rgb(18 18 18 / 0.32);
}

.search-bar-clear {
  color: var(--home-text-muted);
  transition: color 150ms var(--ease);
}

.search-bar-clear:hover {
  color: var(--home-text-strong);
}
</style>
