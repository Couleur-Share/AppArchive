<template>
  <div class="software-list-container" ref="containerRef">
    <!-- 虚拟滚动容器 -->
    <div 
      class="virtual-scroll-container"
      :style="{ height: `${containerHeight}px` }"
      @scroll="handleScroll"
    >
      <!-- 上方占位 -->
      <div :style="{ height: `${offsetY}px` }"></div>
      
      <!-- 可见项目 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        <SoftwareCard
          v-for="item in visibleItems"
          :key="item.id"
          :software="item"
          :can-edit="canEdit"
          :has-comparisons="hasComparisons"
          @edit="$emit('edit', item)"
          @delete="$emit('delete', item.id)"
          @click="$emit('click', item)"
          @compare="$emit('compare', item)"
        />
      </div>
      
      <!-- 下方占位 -->
      <div :style="{ height: `${remainingHeight}px` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Software } from '../types'
import SoftwareCard from './SoftwareCard.vue'

const props = defineProps<{
  items: Software[]
  canEdit: boolean
  hasComparisons: Record<number, boolean>
}>()

const emit = defineEmits<{
  (e: 'edit', software: Software): void
  (e: 'delete', id: number): void
  (e: 'click', software: Software): void
  (e: 'compare', software: Software): void
}>()

const containerRef = ref<HTMLElement>()
const containerHeight = ref(600)
const scrollTop = ref(0)
const itemHeight = ref(280) // 每个卡片的大概高度
const itemsPerRow = ref(3) // 每行显示的项目数
const visibleCount = ref(12) // 可见项目数量

// 计算可见项目
const visibleItems = computed(() => {
  const startIndex = Math.floor(scrollTop.value / itemHeight.value) * itemsPerRow.value
  const endIndex = Math.min(startIndex + visibleCount.value, props.items.length)
  return props.items.slice(startIndex, endIndex)
})

// 计算偏移量
const offsetY = computed(() => {
  return Math.floor(scrollTop.value / itemHeight.value) * itemHeight.value
})

// 计算剩余高度
const remainingHeight = computed(() => {
  const totalHeight = Math.ceil(props.items.length / itemsPerRow.value) * itemHeight.value
  return Math.max(0, totalHeight - offsetY.value - (visibleItems.value.length / itemsPerRow.value * itemHeight.value))
})

// 滚动处理（使用节流）
let scrollTimer: number | null = null
const handleScroll = (event: Event) => {
  if (scrollTimer) {
    cancelAnimationFrame(scrollTimer)
  }
  
  scrollTimer = requestAnimationFrame(() => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  })
}

// 响应式更新
const updateLayout = () => {
  if (!containerRef.value) return
  
  const width = containerRef.value.offsetWidth
  if (width >= 1024) {
    itemsPerRow.value = 3
  } else if (width >= 768) {
    itemsPerRow.value = 2
  } else {
    itemsPerRow.value = 1
  }
  
  containerHeight.value = Math.min(800, window.innerHeight - 200)
  visibleCount.value = Math.ceil(containerHeight.value / itemHeight.value) * itemsPerRow.value + itemsPerRow.value
}

// 监听窗口大小变化
const resizeObserver = new ResizeObserver(updateLayout)

onMounted(() => {
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
  updateLayout()
})

onUnmounted(() => {
  if (scrollTimer) {
    cancelAnimationFrame(scrollTimer)
  }
  resizeObserver.disconnect()
})

// 监听数据变化
watch(() => props.items, updateLayout)
</script>

<style scoped>
.software-list-container {
  position: relative;
  width: 100%;
}

.virtual-scroll-container {
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

/* 优化滚动性能 */
.virtual-scroll-container {
  contain: layout style paint;
  will-change: scroll-position;
}

/* 自定义滚动条样式 */
.virtual-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
  transition: background-color 0.2s;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}

/* 适配暗色模式 */
:root.dark .virtual-scroll-container::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.3);
}

:root.dark .virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(75, 85, 99, 0.5);
}
</style> 