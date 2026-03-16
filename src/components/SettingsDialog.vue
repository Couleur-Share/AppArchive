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
                      :disabled="isProfileSaving || isAvatarUploading"
                    >
                      重置
                    </BaseButton>
                    <BaseButton
                      @click="saveSettings"
                      variant="primary"
                      block
                      :disabled="isProfileSaving || isAvatarUploading"
                    >
                      {{ isProfileSaving ? '保存中...' : '保存' }}
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
                    <!-- 账户设置 -->
                    <div v-if="activeTab === 'account'" class="space-y-6">
                      <div class="flex items-center gap-6">
                        <div class="relative group cursor-pointer shrink-0" @click="triggerAvatarUpload">
                          <div class="w-20 h-20 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold select-none">
                            <img v-if="editAvatar" :src="editAvatar" class="w-full h-full object-cover" alt="头像" />
                            <span v-else>{{ profileInitial }}</span>
                          </div>
                          <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Camera class="w-5 h-5 text-white" />
                          </div>
                          <div v-if="isAvatarUploading" class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">头像</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">点击更换头像，支持 JPG / PNG / WebP</p>
                        </div>
                        <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handleAvatarChange" />
                      </div>

                      <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">显示名称</label>
                        <input
                          v-model="editDisplayName"
                          type="text"
                          maxlength="100"
                          placeholder="设置你的显示名称"
                          class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                 bg-white dark:bg-gray-800
                                 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                 text-gray-900 dark:text-gray-100
                                 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>

                      <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">用户名</label>
                        <div class="px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700
                                    bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm">
                          @{{ user?.username }}
                        </div>
                      </div>

                      <p v-if="profileMessage" class="text-sm" :class="profileError ? 'text-red-500' : 'text-green-600 dark:text-green-400'">
                        {{ profileMessage }}
                      </p>
                    </div>

                    <!-- 系统筛选 -->
                    <div v-if="activeTab === 'systems'" class="space-y-4">
                      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">选择操作系统</p>
                      <div class="grid grid-cols-3 gap-3">
                        <button
                          v-for="system in SYSTEMS"
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

                    <!-- AI 设置 -->
                    <div v-if="activeTab === 'ai'" class="space-y-6">
                      <!-- 加载状态 -->
                      <div v-if="aiLoading" class="flex items-center justify-center py-12">
                        <div class="w-6 h-6 border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white rounded-full animate-spin" />
                      </div>

                      <template v-else>
                        <!-- 供应商选择 -->
                        <div class="space-y-3">
                          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">AI 供应商</label>
                          <div class="grid grid-cols-2 gap-3">
                            <button
                              v-for="p in aiProviders"
                              :key="p.id"
                              @click="selectProvider(p.id)"
                              class="flex flex-col items-start p-3 rounded-lg border transition-colors text-left"
                              :class="[
                                aiForm.provider === p.id
                                  ? 'bg-gray-900 dark:bg-gray-700 border-gray-900 dark:border-gray-700 text-white'
                                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                              ]"
                            >
                              <span class="text-sm font-medium">{{ p.name }}</span>
                              <span class="text-xs mt-1" :class="aiForm.provider === p.id ? 'text-gray-300' : 'text-gray-400 dark:text-gray-500'">
                                {{ p.id === 'custom' ? '自定义 API 地址' : p.api_base }}
                              </span>
                            </button>
                          </div>
                        </div>

                        <!-- API 地址（自定义供应商时可编辑） -->
                        <div class="space-y-2">
                          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">API 地址</label>
                          <input
                            v-model="aiForm.api_base"
                            type="text"
                            :readonly="aiForm.provider !== 'custom'"
                            :placeholder="aiForm.provider === 'custom' ? '输入 OpenAI 兼容的 API 地址' : ''"
                            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                   bg-white dark:bg-gray-800
                                   focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                   text-gray-900 dark:text-gray-100
                                   placeholder-gray-400 dark:placeholder-gray-500"
                            :class="{ 'bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400': aiForm.provider !== 'custom' }"
                          />
                        </div>

                        <!-- 模型选择 -->
                        <div class="space-y-2">
                          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">模型</label>
                          <div class="flex gap-2">
                            <select
                              v-if="currentProviderModels.length > 0"
                              v-model="aiForm.model"
                              class="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                     bg-white dark:bg-gray-800
                                     focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                     text-gray-900 dark:text-gray-100"
                            >
                              <option v-for="m in currentProviderModels" :key="m" :value="m">{{ m }}</option>
                              <option value="__custom__">自定义模型...</option>
                            </select>
                            <input
                              v-if="currentProviderModels.length === 0 || aiForm.model === '__custom__'"
                              v-model="aiCustomModel"
                              type="text"
                              placeholder="输入模型名称"
                              class="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                     bg-white dark:bg-gray-800
                                     focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                     text-gray-900 dark:text-gray-100
                                     placeholder-gray-400 dark:placeholder-gray-500"
                            />
                          </div>
                        </div>

                        <!-- API Key -->
                        <div class="space-y-2">
                          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
                          <div class="relative">
                            <input
                              v-model="aiForm.api_key"
                              :type="showApiKey ? 'text' : 'password'"
                              placeholder="输入 API Key"
                              class="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-600
                                     bg-white dark:bg-gray-800
                                     focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                     text-gray-900 dark:text-gray-100
                                     placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm"
                            />
                            <button
                              type="button"
                              @click="showApiKey = !showApiKey"
                              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Eye v-if="!showApiKey" class="w-4 h-4" />
                              <EyeOff v-else class="w-4 h-4" />
                            </button>
                          </div>
                          <p v-if="aiExistingConfig && !aiForm.api_key" class="text-xs text-gray-500 dark:text-gray-400">
                            当前密钥: {{ aiExistingConfig.api_key_masked }}（留空则保持不变）
                          </p>
                        </div>

                        <!-- 测试连接 + 状态提示 -->
                        <div class="flex items-center gap-3">
                          <BaseButton
                            @click="handleTestAI"
                            variant="secondary"
                            :disabled="aiTesting || !canTestAI"
                          >
                            {{ aiTesting ? '测试中...' : '测试连接' }}
                          </BaseButton>
                          <span v-if="aiTestResult" class="text-sm" :class="aiTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                            {{ aiTestResult.message }}
                          </span>
                        </div>

                        <!-- 状态提示 -->
                        <p v-if="aiMessage" class="text-sm" :class="aiError ? 'text-red-500' : 'text-green-600 dark:text-green-400'">
                          {{ aiMessage }}
                        </p>
                      </template>
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
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { ArrowDown, ArrowUp, Camera, Eye, EyeOff, LayoutGrid, List, Monitor, Smartphone, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { isSignedIn, updateProfile, user } from '../lib/auth'
import { uploadService } from '../services/upload'
import { aiConfigService, type AIConfig, type AIProvider } from '../services/aiConfig'
import { SYSTEMS } from '@/types/constants'
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
type TabId = 'account' | 'systems' | 'sort' | 'view' | 'ai'
const tabs = computed(() => {
  const list: { id: TabId; label: string }[] = []
  if (isSignedIn.value) {
    list.push({ id: 'account', label: '账户设置' })
  }
  list.push(
    { id: 'systems', label: '系统筛选' },
    { id: 'sort', label: '排序方式' },
    { id: 'view', label: '布局设置' },
  )
  if (isSignedIn.value) {
    list.push({ id: 'ai', label: 'AI 设置' })
  }
  return list
})

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

// ===== 账户设置状态 =====
const editDisplayName = ref('')
const editAvatar = ref('')
const isAvatarUploading = ref(false)
const isProfileSaving = ref(false)
const profileMessage = ref('')
const profileError = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)

const profileInitial = computed(() => {
  const name = editDisplayName.value || user.value?.username || '?'
  return name.charAt(0).toUpperCase()
})

const triggerAvatarUpload = () => {
  if (isAvatarUploading.value) return
  avatarInput.value?.click()
}

const handleAvatarChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    isAvatarUploading.value = true
    profileMessage.value = ''
    const result = await uploadService.uploadIcon(file)
    editAvatar.value = result.path
  } catch (err) {
    profileMessage.value = err instanceof Error ? err.message : '上传头像失败'
    profileError.value = true
  } finally {
    isAvatarUploading.value = false
    if (avatarInput.value) avatarInput.value.value = ''
  }
}

const saveProfile = async () => {
  try {
    isProfileSaving.value = true
    profileMessage.value = ''
    profileError.value = false
    await updateProfile({
      displayName: editDisplayName.value,
      avatar: editAvatar.value,
    })
  } catch (err) {
    profileMessage.value = err instanceof Error ? err.message : '保存资料失败'
    profileError.value = true
  } finally {
    isProfileSaving.value = false
  }
}

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
  if (activeTab.value === 'account') {
    editDisplayName.value = user.value?.displayName || ''
    editAvatar.value = user.value?.avatar || ''
    profileMessage.value = ''
    profileError.value = false
    return
  }
  if (activeTab.value === 'ai') {
    loadAIConfig()
    return
  }
  selectedSystems.value = []
  sortSettings.value = {
    field: 'name',
    order: 'asc'
  }
  viewMode.value = 'grid'
}

// 保存设置
const saveSettings = async () => {
  if (activeTab.value === 'account') {
    await saveProfile()
    if (profileError.value) return
    emit('update:isOpen', false)
    return
  }
  if (activeTab.value === 'ai') {
    await saveAISettings()
    return
  }
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



// 对话框打开时初始化
watch(() => props.isOpen, (open) => {
  if (open && user.value) {
    editDisplayName.value = user.value.displayName || ''
    editAvatar.value = user.value.avatar || ''
    profileMessage.value = ''
    profileError.value = false
  }
})

// 切到 AI Tab 时加载配置（懒加载）
watch(activeTab, (tab) => {
  if (tab === 'ai' && aiProviders.value.length === 0) {
    loadAIConfig()
  }
})

// 修改点击处理器
const handleOrderChange = (order: 'asc' | 'desc') => {
  sortSettings.value.order = order
}

// ===== AI 设置状态 =====
const aiProviders = ref<AIProvider[]>([])
const aiExistingConfig = ref<AIConfig | null>(null)
const aiLoading = ref(false)
const aiTesting = ref(false)
const aiMessage = ref('')
const aiError = ref(false)
const aiTestResult = ref<{ success: boolean; message: string } | null>(null)
const showApiKey = ref(false)
const aiCustomModel = ref('')

const aiForm = ref({
  provider: '',
  api_base: '',
  api_key: '',
  model: '',
})

const currentProviderModels = computed(() => {
  const p = aiProviders.value.find(x => x.id === aiForm.value.provider)
  return p?.models || []
})

const canTestAI = computed(() => {
  const f = aiForm.value
  const hasKey = Boolean(f.api_key || aiExistingConfig.value?.api_key_masked)
  const hasModel = f.model === '__custom__' ? Boolean(aiCustomModel.value) : Boolean(f.model)
  const hasBase = Boolean(f.api_base)
  return f.provider && hasKey && hasModel && hasBase
})

const selectProvider = (id: string) => {
  const p = aiProviders.value.find(x => x.id === id)
  if (!p) return
  aiForm.value.provider = id
  aiForm.value.api_base = p.api_base
  if (p.default_model) {
    aiForm.value.model = p.default_model
  }
  aiCustomModel.value = ''
  aiTestResult.value = null
  aiMessage.value = ''
}

const resolveModel = () => {
  if (aiForm.value.model === '__custom__' || currentProviderModels.value.length === 0) {
    return aiCustomModel.value
  }
  return aiForm.value.model
}

const buildAIPayload = () => ({
  provider: aiForm.value.provider,
  api_base: aiForm.value.api_base,
  api_key: aiForm.value.api_key,
  model: resolveModel(),
})

const loadAIConfig = async () => {
  aiLoading.value = true
  aiMessage.value = ''
  aiError.value = false
  aiTestResult.value = null
  try {
    const [providers, config] = await Promise.all([
      aiConfigService.getProviders(),
      aiConfigService.getConfig(),
    ])
    aiProviders.value = providers
    aiExistingConfig.value = config

    if (config) {
      aiForm.value.provider = config.provider
      aiForm.value.api_base = config.api_base
      aiForm.value.model = config.model
      aiForm.value.api_key = ''
      // 如果当前模型不在预置列表中，切换到自定义输入
      const p = providers.find(x => x.id === config.provider)
      if (p && p.models.length > 0 && !p.models.includes(config.model)) {
        aiForm.value.model = '__custom__'
        aiCustomModel.value = config.model
      }
    } else if (providers.length > 0) {
      selectProvider(providers[0].id)
    }
  } catch (err) {
    aiMessage.value = err instanceof Error ? err.message : '加载 AI 配置失败'
    aiError.value = true
  } finally {
    aiLoading.value = false
  }
}

const handleTestAI = async () => {
  aiTesting.value = true
  aiTestResult.value = null
  try {
    const payload = buildAIPayload()
    if (!payload.api_key && aiExistingConfig.value) {
      throw new Error('请输入 API Key 后再测试')
    }
    const result = await aiConfigService.testConfig(payload)
    aiTestResult.value = { success: true, message: result.message }
  } catch (err) {
    aiTestResult.value = { success: false, message: err instanceof Error ? err.message : '测试失败' }
  } finally {
    aiTesting.value = false
  }
}

const saveAISettings = async () => {
  aiMessage.value = ''
  aiError.value = false
  isProfileSaving.value = true
  try {
    const payload = buildAIPayload()
    if (!payload.api_key && !aiExistingConfig.value) {
      throw new Error('API Key 不能为空')
    }
    // 如果用户没输入新 key 但已有配置，提示用户
    if (!payload.api_key && aiExistingConfig.value) {
      throw new Error('请输入 API Key（出于安全考虑，已保存的密钥不会回显）')
    }
    await aiConfigService.saveConfig(payload)
    aiMessage.value = 'AI 配置已保存'
    // 刷新配置
    const config = await aiConfigService.getConfig()
    aiExistingConfig.value = config
    aiForm.value.api_key = ''
  } catch (err) {
    aiMessage.value = err instanceof Error ? err.message : '保存 AI 配置失败'
    aiError.value = true
  } finally {
    isProfileSaving.value = false
  }
}
</script>