<template>
  <button
    @click="$emit('update:modelValue', !modelValue)"
    class="theme-toggle-btn px-3 py-2 rounded-lg focus:outline-none"
  >
    <div class="relative w-5 h-5">
      <Sun
        class="theme-toggle-sun h-5 w-5 absolute transform transition-transform duration-500 rotate-0 dark:-rotate-180 dark:opacity-0"
      />
      <Moon
        class="theme-toggle-moon h-5 w-5 absolute transform transition-transform duration-500 rotate-180 opacity-0 dark:rotate-0 dark:opacity-100"
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

<style scoped>
.theme-toggle-btn {
  color: var(--home-text);
  border: 1px solid transparent;
  transition:
    color 150ms var(--ease),
    background-color 150ms var(--ease),
    border-color 150ms var(--ease),
    box-shadow 150ms var(--ease);
}

.theme-toggle-btn:hover {
  color: var(--home-text-strong);
  background: var(--home-surface-hover);
  border-color: var(--home-border);
  box-shadow: 0 14px 28px -24px rgb(15 23 42 / 0.38);
}

.theme-toggle-btn:focus-visible {
  border-color: var(--home-accent-border);
  box-shadow: 0 0 0 4px rgb(0 220 130 / 0.12);
}

.theme-toggle-sun {
  color: color-mix(in srgb, var(--theme-primary-600) 64%, var(--home-text-muted));
}

.theme-toggle-moon {
  color: var(--home-text);
}

.dark .theme-toggle-moon {
  color: var(--theme-primary-400);
}
</style>
