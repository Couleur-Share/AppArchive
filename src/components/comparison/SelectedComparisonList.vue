<template>
  <div class="p-6 border-b border-gray-200/50 dark:border-gray-600/30">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">已选择的比较</h4>
      <BaseButton v-if="items.length > 0" size="sm" variant="primary" @click="$emit('view-results')">
        <slot name="viewIcon"></slot>
        查看结果
      </BaseButton>
    </div>
    <div class="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar">
      <div v-for="comp in items" :key="comp.id" class="p-3 rounded-lg border border-gray-200 dark:border-gray-600">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img :src="comp.target.icon" :alt="comp.target.name" class="w-8 h-8 rounded-lg">
            <div>
              <h5 class="font-medium text-sm">{{ comp.target.name }}</h5>
              <p class="text-xs text-gray-500">{{ comp.target.category }}</p>
            </div>
          </div>
          <IconButton size="xs" variant="danger" @click="$emit('remove', comp.id)">
            <slot name="removeIcon"></slot>
          </IconButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Software } from '../../types'
import BaseButton from '../common/BaseButton.vue'
import IconButton from '../common/IconButton.vue'

defineProps<{
  items: Array<{ id: number; target: Software }>
}>()

defineEmits<{
  (e: 'remove', id: number): void
  (e: 'view-results'): void
}>()
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>

