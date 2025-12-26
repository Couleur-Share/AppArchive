<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog 
      as="div" 
      class="relative z-50" 
      :open="isOpen"
      @close="$emit('update:isOpen', false)"
    >
      <div class="fixed inset-0">
        <TransitionChild as="div">
          <div class="fixed inset-0 bg-black/50"
               v-gsap="{ duration: 0.18, to: { duration: 0.18, ease: 'power1.out' } }" />
        </TransitionChild>
      </div>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild as="div">
            <DialogPanel
             class="relative transform overflow-hidden rounded-lg 
                    bg-white dark:bg-gray-800 
                     text-left shadow-level3 will-change-transform will-change-opacity
                     w-[800px] h-[600px] flex flex-col"
              v-gsap="{ y: 12, duration: 0.28, ease: 'power2.out', to: { y: 0, duration: 0.28, ease: 'power2.out' } }"
            >
              <!-- 两栏布局 -->
              <div class="flex flex-1 overflow-hidden">
                <!-- 左侧导航栏 -->
                <div class="w-48 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-900/50">
                  <!-- 标题 -->
                  <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <DialogTitle as="h3" class="text-xl font-semibold text-gray-900 dark:text-white">
                      设置
                    </DialogTitle>
                  </div>

                  <!-- 导航项 -->
                  <div class="flex-1 p-4 space-y-2">
                    <button
                      v-for="tab in tabs"
                      :key="tab.id"
                      @click="activeTab = tab.id"
                      class="w-full text-left px-4 py-2 rounded-lg transition-colors duration-100"
                      :class="[
                        activeTab === tab.id
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      ]"
                    >
                      {{ tab.label }}
                    </button>
                  </div>

                  <!-- 底部按钮 -->
                  <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <BaseButton
                      @click="resetSettings"
                      variant="secondary"
                      block
                    >
                      重置
                    </BaseButton>
                    <BaseButton
                      @click="saveSettings"
                      variant="primary"
                      block
                    >
                      保存
                    </BaseButton>
                  </div>
                </div>

                <!-- 右侧内容区 -->
                <div class="flex-1 flex flex-col overflow-hidden">
                  <!-- 内容区标题栏 -->
                  <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h4 class="text-xl font-semibold text-gray-900 dark:text-white">
                      {{ currentTab?.label }}
                    </h4>
                    <button
                      @click="$emit('update:isOpen', false)"
                      class="p-2 rounded-lg transition-all duration-200 
                             text-gray-600 dark:text-gray-400
                             hover:bg-gray-100 dark:hover:bg-gray-700 
                             hover:text-gray-900 dark:hover:text-white
                             focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                      title="关闭"
                      aria-label="关闭"
                    >
                      <X class="h-5 w-5" />
                    </button>
                  </div>

                  <!-- 内容区主体 -->
                  <div class="flex-1 overflow-y-auto p-6">
                    <!-- 系统筛选 -->
                    <div v-if="activeTab === 'systems'" class="space-y-4">
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">选择操作系统</p>
                      <div class="grid grid-cols-3 gap-3">
                        <button
                          v-for="system in ['Windows', 'macOS', 'Linux', 'Android', 'iOS', 'HarmonyOS']"
                          :key="system"
                          @click="toggleSystem(system)"
                          class="flex flex-col items-center justify-center p-4 rounded-lg border transition-colors"
                          :class="[
                            selectedSystems.includes(system)
                              ? 'bg-gray-900 dark:bg-gray-700 border-gray-900 dark:border-gray-700 text-white'
                              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                          ]"
                        >
                          <Monitor v-if="system === 'Windows' || system === 'macOS' || system === 'Linux'" class="w-6 h-6 mb-2" />
                          <Smartphone v-else class="w-6 h-6 mb-2" />
                          <span class="text-sm">{{ system }}</span>
                        </button>
                      </div>
                    </div>

                    <!-- 排序方式 -->
                    <div v-if="activeTab === 'sort'" class="space-y-6">
                      <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">排序字段</label>
                        <select
                          v-model="sortSettings.field"
                          class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                                 bg-white dark:bg-gray-800 
                                 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                 text-gray-900 dark:text-gray-100"
                        >
                          <option value="name">名称</option>
                          <option value="category">分类</option>
                          <option value="created_at">创建时间</option>
                          <option value="updated_at">更新时间</option>
                        </select>
                      </div>
                      <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">排序方向</label>
                        <div class="flex gap-3">
                          <button
                            v-for="order in ['asc', 'desc'] as const"
                            :key="order"
                            @click="handleOrderChange(order)"
                            class="px-4 py-2 rounded-lg border transition-colors duration-100 flex items-center justify-center gap-2 text-sm"
                            :class="[
                              sortSettings.order === order
                                ? 'bg-gray-900 dark:bg-gray-700 border-gray-900 dark:border-gray-700 text-white'
                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            ]"
                          >
                            <ArrowUp v-if="order === 'asc'" class="w-4 h-4" />
                            <ArrowDown v-if="order === 'desc'" class="w-4 h-4" />
                            {{ order === 'asc' ? '升序' : '降序' }}
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- 布局设置 -->
                    <div v-if="activeTab === 'view'" class="space-y-6">
                      <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">默认布局</label>
                        <div class="grid grid-cols-2 gap-3">
                          <button
                            v-for="mode in [
                              { value: 'grid', label: '卡片视图', icon: LayoutGrid },
                              { value: 'list', label: '列表视图', icon: List }
                            ] as const"
                            :key="mode.value"
                            @click="viewMode = mode.value"
                            class="flex flex-col items-center justify-center p-4 rounded-lg border transition-colors"
                            :class="[
                              viewMode === mode.value
                                ? 'bg-gray-900 dark:bg-gray-700 border-gray-900 dark:border-gray-700 text-white'
                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            ]"
                          >
                            <component :is="mode.icon" class="w-6 h-6 mb-2" />
                            <span class="text-sm">{{ mode.label }}</span>
                          </button>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 pt-2">
                          * 设置将自动保存并在下次访问时生效
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { X, Monitor, Smartphone, ArrowUp, ArrowDown, LayoutGrid, List } from 'lucide-vue-next'
import BaseButton from './common/BaseButton.vue'

const props = defineProps<{
  isOpen: boolean
  initialSystems?: string[]
  initialSort?: {
    field: string
    order: 'asc' | 'desc'
  }
  initialViewMode?: 'grid' | 'list'
}>()

// 首先定义正确的类型
interface SortSettings {
  field: string;  // 将 keyof Software 改为 string
  order: 'desc' | 'asc';
}

interface Settings {
  systems: string[];
  sort: SortSettings;
  viewMode: 'grid' | 'list';
}

// 确保 emit 的类型定义正确
const emit = defineEmits<{
  'update:isOpen': [value: boolean];
  'update:settings': [settings: Settings];
}>();

// 导航标签页
type TabId = 'systems' | 'sort' | 'view'
const tabs = computed(() => [
  { id: 'systems' as TabId, label: '系统筛选' },
  { id: 'sort' as TabId, label: '排序方式' },
  { id: 'view' as TabId, label: '布局设置' }
])

// 当前选中的标签页
const activeTab = ref<TabId>('systems')

// 当前标签页信息
const currentTab = computed(() => tabs.value.find(tab => tab.id === activeTab.value))

// 系统筛选设置
const selectedSystems = ref<string[]>(props.initialSystems || [])

// 排序设置
const sortSettings = ref<SortSettings>({
  field: 'name',
  order: 'desc'
})

// 视图设置
const viewMode = ref<'grid' | 'list'>(props.initialViewMode || 'grid')



// 切换系统筛选
const toggleSystem = (system: string) => {
  const index = selectedSystems.value.indexOf(system)
  if (index === -1) {
    selectedSystems.value.push(system)
  } else {
    selectedSystems.value.splice(index, 1)
  }
}

// 重置设置
const resetSettings = () => {
  selectedSystems.value = []
  sortSettings.value = {
    field: 'name',
    order: 'asc'
  }
  viewMode.value = 'grid'
}

// 保存设置
const saveSettings = () => {
  emit('update:settings', {
    systems: selectedSystems.value,
    sort: sortSettings.value,
    viewMode: viewMode.value
  })
  emit('update:isOpen', false)
}

// 监听 props 变化
watch(() => props.initialSystems, (newSystems) => {
  if (newSystems) {
    selectedSystems.value = [...newSystems]
  }
}, { deep: true })

watch(() => props.initialSort, (newSort) => {
  if (newSort) {
    sortSettings.value = { ...newSort }
  }
}, { deep: true })

watch(() => props.initialViewMode, (newMode) => {
  if (newMode) {
    viewMode.value = newMode
  }
})



// 修改点击处理器
const handleOrderChange = (order: 'asc' | 'desc') => {
  sortSettings.value.order = order
}
</script>