<template>
  <div class="w-full p-0">
    <div class="space-y-3" ref="listRef" @scroll="onScroll">
      <div :style="{ height: `${topSpacer}px` }"></div>
      <div
        v-for="sw in visibleItems"
        :key="sw.id"
        class="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
        :style="{ height: `${rowHeight}px` }"
      >
        <img :src="getIconUrl(sw.icon)" :alt="sw.name" class="w-10 h-10 rounded-lg" loading="lazy" decoding="async" referrerpolicy="no-referrer">
        <div class="flex-1">
          <h5 class="font-medium text-gray-900 dark:text-gray-100">{{ sw.name }}</h5>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ sw.category }}</p>
        </div>
        <button
          @click="$emit('toggle', sw)"
          class="p-2 rounded-lg transition-colors"
          :disabled="disabled"
          :class="[
            isSelected(sw.id)
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          ]"
        >
          <slot name="addIcon" v-if="!isSelected(sw.id)"></slot>
          <slot name="checkedIcon" v-else></slot>
        </button>
      </div>
      <div :style="{ height: `${bottomSpacer}px` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import type { Software } from '../../types'
import { getIconUrl } from '../../services/localIconCache'

const props = defineProps<{
  items: Software[]
  isSelected: (id: number) => boolean
  disabled?: boolean
  rowHeight?: number
}>()

defineEmits<{
  (e: 'toggle', sw: Software): void
}>()

const listRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const clientHeight = ref(480)
const rowHeight = computed(() => props.rowHeight ?? 72)
const buffer = 8

const startIndex = computed(() => Math.floor(scrollTop.value / rowHeight.value))
const visibleCount = computed(() => Math.ceil(clientHeight.value / rowHeight.value) + buffer)
const visibleItems = computed(() => props.items.slice(startIndex.value, Math.min(startIndex.value + visibleCount.value, props.items.length)))
const topSpacer = computed(() => startIndex.value * rowHeight.value)
const bottomSpacer = computed(() => Math.max(0, (props.items.length - startIndex.value - visibleItems.value.length) * rowHeight.value))

const onScroll = (e: Event) => {
  const target = e.target as HTMLElement
  scrollTop.value = target.scrollTop
}

const resizeObserver = new ResizeObserver(() => {
  if (listRef.value) {
    clientHeight.value = listRef.value.clientHeight
  }
})

onMounted(() => {
  if (listRef.value) {
    clientHeight.value = listRef.value.clientHeight
    resizeObserver.observe(listRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver.disconnect()
})

watch(() => props.items, () => {
  // 数据变更后重置滚动，避免索引越界
  if (listRef.value) listRef.value.scrollTop = 0
  scrollTop.value = 0
})
</script>

<style scoped>
.space-y-3::-webkit-scrollbar {
  width: 6px;
}
.space-y-3::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}
</style>

