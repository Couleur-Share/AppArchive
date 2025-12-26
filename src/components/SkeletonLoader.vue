<template>
  <div class="animate-pulse">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="n in count" 
        :key="n"
        class="bg-white/30 dark:bg-gray-800/30 rounded-xl p-6 h-[200px]"
      >
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  count: number
}>()
</script> 