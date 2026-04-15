<template>
  <div class="h-full flex flex-col">
    <!-- 列表区域 -->
    <div class="flex-1 overflow-y-auto custom-scrollbar p-2" ref="listRef" @scroll="onScroll">
      <div :style="{ height: `${topSpacer}px` }"></div>
      
      <div
        v-for="sw in visibleItems"
        :key="sw.id"
        class="comparison-list-row group"
        :style="{ height: `${rowHeight}px` }"
        role="button"
        tabindex="0"
        :aria-pressed="isSelected(sw.id) ? 'true' : 'false'"
        :aria-disabled="disabled ? 'true' : undefined"
        @click="handleToggle(sw)"
        @keydown.enter.prevent="handleToggle(sw)"
        @keydown.space.prevent="handleToggle(sw)"
      >
        <div
          class="comparison-list-item grid h-[calc(100%-8px)] grid-cols-[auto,minmax(0,1fr),auto] items-center gap-3 overflow-hidden rounded-xl border px-3.5 py-3 transition-all duration-200"
          :class="[
            isSelected(sw.id) ? 'comparison-list-item--selected' : 'comparison-list-item--idle',
            disabled ? 'pointer-events-none opacity-60' : 'cursor-pointer'
          ]"
        >
          <!-- 图标 -->
          <div class="relative shrink-0">
            <img 
              :src="getIconUrl(sw.icon)" 
              :alt="sw.name" 
              class="comparison-list-icon h-11 w-11 rounded-xl border object-cover" 
              loading="lazy" 
              decoding="async" 
              referrerpolicy="origin"
            >
            <div 
              v-if="isSelected(sw.id)"
              class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-md border border-primary/35 bg-primary text-slate-950 shadow-sm dark:border-primary/45"
            >
              <Check class="h-2.5 w-2.5 stroke-[3]" />
            </div>
          </div>

          <!-- 信息 -->
          <div class="min-w-0 overflow-hidden">
            <div class="min-w-0 space-y-1.5">
              <h5 
                class="truncate text-sm font-semibold leading-5 transition-colors"
                :class="isSelected(sw.id) ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-gray-100'"
              >
                {{ sw.name }}
              </h5>
              <div class="flex min-w-0 flex-wrap items-center gap-1.5">
                <span class="truncate text-xs text-gray-500 dark:text-gray-400">{{ sw.category }}</span>
                <TagBadge 
                    v-if="sw.license"
                    size="xs"
                    variant="neutral"
                    :label="sw.license"
                />
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div
            class="flex h-full items-center justify-center opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
            :class="{ 'sm:opacity-100': isSelected(sw.id) }"
          >
            <button
              type="button"
              class="comparison-list-action inline-flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
              :class="isSelected(sw.id) 
                  ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300' 
                  : 'text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200'"
              :aria-label="`${isSelected(sw.id) ? '移除' : '加入'} ${sw.name}`"
              @click.stop="handleToggle(sw)"
            >
              <Minus v-if="isSelected(sw.id)" class="w-4 h-4" />
              <Plus v-else class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div :style="{ height: `${bottomSpacer}px` }"></div>
      
      <!-- 空状态 -->
      <div v-if="items.length === 0" class="flex flex-col items-center justify-center py-10 text-center px-4">
        <div class="comparison-list-empty-icon mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
            <SearchX class="w-6 h-6 text-gray-400" />
        </div>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">没有找到匹配的软件</p>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">换个名称、分类或描述关键词试试。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, Minus, Plus, SearchX } from 'lucide-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getIconUrl } from '../../services/localIconCache'
import type { SoftwareListItem } from '../../types'
import TagBadge from '../common/TagBadge.vue'

const props = defineProps<{
  items: SoftwareListItem[]
  isSelected: (id: number) => boolean
  disabled?: boolean
  rowHeight?: number
}>()

const emit = defineEmits<(e: 'toggle', sw: SoftwareListItem) => void>()

const listRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const clientHeight = ref(480)
const rowHeight = computed(() => props.rowHeight ?? 120)
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

const handleToggle = (sw: SoftwareListItem) => {
  if (props.disabled) return
  emit('toggle', sw)
}

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
.comparison-list-item {
  background: var(--modal-card-subtle-bg-light);
  border-color: color-mix(in srgb, var(--modal-card-border-light) 55%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.25);
}

.dark .comparison-list-item {
  background: var(--modal-card-subtle-bg-dark);
  border-color: color-mix(in srgb, var(--modal-card-border-dark) 70%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
}

.comparison-list-item--idle:hover,
.comparison-list-item--idle:focus-visible {
  border-color: color-mix(in srgb, var(--modal-card-border-emphasis-light) 70%, var(--modal-card-border-light));
  background: var(--modal-card-bg-light);
  box-shadow: var(--modal-card-shadow-hover-light);
  outline: none;
}

.dark .comparison-list-item--idle:hover,
.dark .comparison-list-item--idle:focus-visible {
  border-color: color-mix(in srgb, var(--modal-card-border-emphasis-dark) 72%, var(--modal-card-border-dark));
  background: var(--modal-card-bg-dark);
  box-shadow: var(--modal-card-shadow-hover-dark);
}

.comparison-list-item--selected {
  border-color: color-mix(in srgb, var(--theme-primary-500) 48%, var(--modal-card-border-light));
  background: var(--modal-card-bg-light);
  box-shadow: var(--modal-card-shadow-hover-light);
}

.dark .comparison-list-item--selected {
  border-color: color-mix(in srgb, var(--theme-primary-500) 52%, var(--modal-card-border-dark));
  background: var(--modal-card-bg-dark);
  box-shadow: var(--modal-card-shadow-hover-dark);
}

.comparison-list-icon {
  border-color: color-mix(in srgb, var(--modal-card-border-light) 65%, transparent);
  background: color-mix(in srgb, var(--modal-card-bg-light) 92%, white);
  box-shadow: var(--modal-card-shadow-light);
}

.dark .comparison-list-icon {
  border-color: color-mix(in srgb, var(--modal-card-border-dark) 76%, transparent);
  background: color-mix(in srgb, var(--modal-card-bg-dark) 92%, #181818);
  box-shadow: var(--modal-card-shadow-dark);
}

.comparison-list-action {
  background: color-mix(in srgb, var(--modal-card-subtle-bg-light) 72%, white);
}

.dark .comparison-list-action {
  background: color-mix(in srgb, var(--modal-card-subtle-bg-dark) 92%, #181818);
}

.comparison-list-empty-icon {
  background: var(--modal-card-subtle-bg-light);
  border: 1px solid var(--modal-card-border-light);
  box-shadow: var(--modal-card-shadow-light);
}

.dark .comparison-list-empty-icon {
  background: var(--modal-card-subtle-bg-dark);
  border-color: var(--modal-card-border-dark);
  box-shadow: var(--modal-card-shadow-dark);
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.28) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.28);
  border-radius: 999px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(148, 163, 184, 0.4);
}

@media (prefers-reduced-motion: reduce) {
  .comparison-list-item,
  .comparison-list-action {
    transition: none !important;
  }
}
</style>
