<template>
  <div class="h-full flex flex-col bg-white dark:bg-[#171f2e]">
    <!-- 列表区域 -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-2" ref="listRef" @scroll="onScroll">
      <div :style="{ height: `${topSpacer}px` }"></div>
      
      <div
        v-for="sw in visibleItems"
        :key="sw.id"
        class="group flex items-center gap-3 p-2.5 mb-1 rounded-md cursor-pointer transition-all duration-200 border border-transparent"
        :class="[
          isSelected(sw.id)
            ? 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-100 dark:hover:border-gray-700'
        ]"
        :style="{ height: `${rowHeight}px` }"
        @click="$emit('toggle', sw)"
      >
        <!-- 图标 -->
        <div class="relative shrink-0">
          <img 
            :src="getIconUrl(sw.icon)" 
            :alt="sw.name" 
            class="w-10 h-10 rounded-md shadow-sm bg-white dark:bg-gray-800 object-cover" 
            loading="lazy" 
            decoding="async" 
            referrerpolicy="origin"
          >
          <div 
            v-if="isSelected(sw.id)"
            class="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm"
          >
            <Check class="w-2.5 h-2.5 text-white stroke-[3]" />
          </div>
        </div>

        <!-- 信息 -->
        <div class="flex-1 min-w-0">
          <h5 
            class="font-semibold text-sm truncate transition-colors"
            :class="isSelected(sw.id) ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-gray-100'"
          >
            {{ sw.name }}
          </h5>
          <div class="flex items-center gap-2 mt-0.5">
             <span class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ sw.category }}</span>
             <span 
                v-if="sw.license" 
                class="px-1.5 py-0.5 rounded-md text-[10px] font-medium border bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
             >
                {{ sw.license }}
             </span>
          </div>
        </div>

        <!-- 操作按钮 (仅 hover 显示或选中时显示) -->
        <div class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" :class="{'opacity-100': isSelected(sw.id)}">
             <button
                class="p-1.5 rounded-md transition-colors"
                :class="isSelected(sw.id) 
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' 
                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200'"
                @click.stop="$emit('toggle', sw)"
             >
                <Minus v-if="isSelected(sw.id)" class="w-4 h-4" />
                <Plus v-else class="w-4 h-4" />
             </button>
        </div>
      </div>
      
      <div :style="{ height: `${bottomSpacer}px` }"></div>
      
      <!-- 空状态 -->
      <div v-if="items.length === 0" class="flex flex-col items-center justify-center py-10 text-center px-4">
        <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <SearchX class="w-6 h-6 text-gray-400" />
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">没有找到匹配的软件</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getIconUrl } from '../../services/localIconCache'
import type { SoftwareListItem } from '../../types'
import { Check, Plus, Minus, SearchX } from 'lucide-vue-next'

const props = defineProps<{
  items: SoftwareListItem[]
  isSelected: (id: number) => boolean
  disabled?: boolean
  rowHeight?: number
}>()

defineEmits<(e: 'toggle', sw: SoftwareListItem) => void>()

const listRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const clientHeight = ref(480)
const rowHeight = computed(() => props.rowHeight ?? 76) // 稍微增加高度以适应新布局
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
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}
</style>
