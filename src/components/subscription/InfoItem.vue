<template>
  <div class="min-w-0">
    <div class="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
      {{ label }}
    </div>
    <div class="mt-0.5 truncate text-gray-700 dark:text-gray-300">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string }>()
</script>
