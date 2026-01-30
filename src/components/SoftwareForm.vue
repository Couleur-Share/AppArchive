<template>
  <!-- AI 分析全屏动画 -->
  <AIOverlay :active="isAnalyzingUI" />

  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
    <!-- 背景遮罩 -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      @click="$emit('update:isOpen', false)"
      v-gsap="{ duration: 0.2, from: { opacity: 0 }, to: { opacity: 1 } }"
    ></div>

    <!-- 对话框内容 -->
    <div
      class="relative z-10 w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700"
      v-gsap="{
        from: { y: 20, opacity: 0, scale: 0.98 },
        to: { y: 0, opacity: 1, scale: 1 },
        duration: 0.3,
        ease: 'power3.out'
      }"
    >
      <!-- 顶部栏：标题 + 工具栏 -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md z-20">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            {{ software ? '编辑软件' : '添加软件' }}
          </h2>
          <!-- 撤销/重做 工具栏 -->
          <div class="flex items-center gap-1 ml-4 px-2 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
            <button
              type="button"
              @click="undo"
              :disabled="!canUndo"
              class="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-600 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="撤销 (Ctrl+Z)"
            >
              <Undo2 class="w-4 h-4" />
            </button>
            <div class="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            <button
              type="button"
              @click="redo"
              :disabled="!canRedo"
              class="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-600 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="重做 (Ctrl+Y)"
            >
              <Redo2 class="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
           <div class="text-xs text-gray-400 hidden sm:block mr-2">
             <span class="px-1.5 py-0.5 border border-gray-200 dark:border-gray-600 rounded text-[10px]">ESC</span> 关闭
           </div>
           <button
            @click="$emit('update:isOpen', false)"
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- 表单内容区域 -->
      <form
        @submit.prevent="handleSubmit"
        id="softwareForm"
        class="flex-1 overflow-y-auto scroll-smooth"
      >
        <div class="p-6 space-y-8 max-w-3xl mx-auto">
          
          <!-- 错误摘要 -->
          <BlurFade :delay="0.1" v-if="Object.keys(errors).length > 1">
            <div class="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-start gap-3">
               <AlertCircle class="w-5 h-5 mt-0.5 shrink-0" />
               <div class="flex-1">
                 <p class="font-medium text-sm mb-2">请修正以下 {{ Object.keys(errors).length }} 个问题：</p>
                 <ul class="list-disc list-inside text-xs space-y-1 opacity-90">
                   <li v-for="(msg, field) in errors" :key="field" class="cursor-pointer hover:underline" @click="scrollToField(field)">
                     {{ msg }}
                   </li>
                 </ul>
               </div>
            </div>
          </BlurFade>

          <!-- Section 1: 核心信息 -->
          <section class="space-y-6">
            <div class="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <LayoutGrid class="w-4 h-4" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">核心信息</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- 软件名称 -->
              <div class="space-y-2 col-span-2 md:col-span-1">
                <label class="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span>软件名称 <span class="text-red-500">*</span></span>
                  <span class="text-xs text-blue-500 cursor-pointer hover:underline" @click="startAIFromName" v-if="formData.name && !isAnalyzing">AI 自动填充?</span>
                </label>
                <div class="relative group">
                  <input
                    v-model="formData.name"
                    @blur="validateField('name')"
                    @input="handleInput('name', $event.target.value)"
                    ref="nameInputRef"
                    class="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    :class="{'border-red-500 focus:border-red-500 focus:ring-red-500/20': errors.name}"
                    placeholder="输入软件名称，如 Chrome"
                  />
                  <Type class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  
                  <!-- AI Loading Indicator -->
                  <div v-if="isAnalyzing" class="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 class="w-4 h-4 text-blue-500 animate-spin" />
                  </div>
                </div>
                <p v-if="errors.name" class="text-xs text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1">
                  <AlertCircle class="w-3 h-3" /> {{ errors.name }}
                </p>
              </div>

              <!-- 类别 -->
              <div class="space-y-2 col-span-2 md:col-span-1">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  类别 <span class="text-red-500">*</span>
                </label>
                <Listbox v-model="formData.category">
                  <div class="relative">
                    <ListboxButton
                      class="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 text-left flex items-center justify-between text-gray-900 dark:text-white transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <span class="block truncate">{{ formData.category || '选择类别' }}</span>
                      <ChevronDown class="h-4 w-4 text-gray-400" />
                      <Tag class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </ListboxButton>
                    <transition
                      leave-active-class="transition duration-100 ease-in"
                      leave-from-class="opacity-100"
                      leave-to-class="opacity-0"
                    >
                      <ListboxOptions
                        class="absolute z-50 mt-1 w-full overflow-auto rounded-xl bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm max-h-60"
                      >
                        <ListboxOption
                          v-slot="{ active, selected }"
                          v-for="category in categories"
                          :key="category"
                          :value="category"
                          as="template"
                        >
                          <li
                            :class="[
                              active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' : 'text-gray-900 dark:text-gray-200',
                              'relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors'
                            ]"
                          >
                            <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                              {{ category }}
                            </span>
                            <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                              <Check class="h-4 w-4" aria-hidden="true" />
                            </span>
                          </li>
                        </ListboxOption>
                      </ListboxOptions>
                    </transition>
                  </div>
                </Listbox>
              </div>

              <!-- 描述 -->
              <div class="col-span-2 space-y-2">
                <label class="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span>简介描述 <span class="text-red-500">*</span></span>
                  <span class="text-xs text-gray-400">{{ (formData.description || '').length }}/300</span>
                </label>
                <div class="relative">
                  <textarea
                    v-model="formData.description"
                    @input="onDescriptionInput"
                    @blur="validateField('description')"
                    rows="3"
                    class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 transition-all resize-none text-gray-900 dark:text-white placeholder-gray-400 text-sm leading-relaxed"
                    placeholder="简要描述该软件的主要功能和特点..."
                  ></textarea>
                </div>
                <p v-if="errors.description" class="text-xs text-red-500">{{ errors.description }}</p>
              </div>
            </div>
          </section>

          <!-- Section 2: 视觉与授权 -->
          <section class="space-y-6">
            <div class="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Sparkles class="w-4 h-4" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">视觉与授权</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <!-- 图标上传 -->
               <div class="space-y-2">
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">软件图标</label>
                 <IconUploader v-model="formData.icon" :disabled="isSubmitting" />
                 <p v-if="errors.icon" class="text-xs text-red-500">{{ errors.icon }}</p>
               </div>

               <!-- 授权类型 -->
               <div class="space-y-3">
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">授权类型</label>
                 <div class="grid grid-cols-2 gap-3">
                    <div
                      v-for="license in LICENSES"
                      :key="license"
                      @click="formData.license = license"
                      class="cursor-pointer relative flex items-center p-3 rounded-xl border transition-all duration-200 group overflow-hidden"
                      :class="[
                        formData.license === license 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500/50' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-800'
                      ]"
                    >
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium mb-0.5" :class="formData.license === license ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-gray-300'">
                          {{ license }}
                        </div>
                      </div>
                      <div 
                        class="w-4 h-4 rounded-full border flex items-center justify-center transition-colors"
                        :class="formData.license === license ? 'border-purple-500 bg-purple-500' : 'border-gray-300 dark:border-gray-600'"
                      >
                        <Check v-if="formData.license === license" class="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                 </div>
               </div>
            </div>
          </section>

          <!-- Section 3: 系统支持 -->
          <section class="space-y-6">
            <div class="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <Monitor class="w-4 h-4" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">支持系统 <span class="text-red-500">*</span></h3>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                v-for="sys in SYSTEMS"
                :key="sys"
                type="button"
                @click="toggleSystem(sys)"
                class="relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 group"
                :class="[
                  (formData.systems || []).includes(sys)
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-500/50 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 bg-white dark:bg-gray-800'
                ]"
              >
                <SystemIcon :system="sys" class="w-8 h-8 mb-2 transition-transform group-hover:scale-110" />
                <span class="text-xs font-medium" :class="(formData.systems || []).includes(sys) ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'">{{ sys }}</span>
                
                <div v-if="(formData.systems || []).includes(sys)" class="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500"></div>
              </button>
            </div>
            <p v-if="errors.systems" class="text-xs text-red-500">{{ errors.systems }}</p>
          </section>

          <!-- Section 4: 链接与资源 -->
          <section class="space-y-6">
            <div class="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Link2 class="w-4 h-4" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">链接与资源</h3>
            </div>

            <div class="space-y-4">
               <div class="space-y-2">
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">官方网址</label>
                 <div class="relative group">
                    <input
                      v-model="formData.website"
                      @blur="validateField('website')"
                      class="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                      placeholder="https://..."
                    />
                    <Globe class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                 </div>
                 <p v-if="errors.website" class="text-xs text-red-500">{{ errors.website }}</p>
               </div>

               <!-- 关联文章 -->
               <div class="pt-4">
                 <RelatedArticlesEditor
                   v-model="formData.related_articles"
                   :disabled="isSubmitting"
                   @update:modelValue="onRelatedArticlesUpdate"
                 />
               </div>
            </div>
          </section>

          <!-- Section 5: 评价 (Pros & Cons) -->
          <section class="space-y-6">
             <div class="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
               <div class="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
                 <ThumbsUp class="w-4 h-4" />
               </div>
               <h3 class="text-lg font-semibold text-gray-900 dark:text-white">评价分析</h3>
             </div>
             
             <ProsConsEditor
                :pros="formData.pros"
                :cons="formData.cons"
                :disabled="isSubmitting"
                @update:pros="(v) => (formData.pros = v)"
                @update:cons="(v) => (formData.cons = v)"
             />
          </section>

          <!-- 高级选项折叠 -->
          <div class="pt-4">
             <button
               type="button"
               @click="showAdvanced = !showAdvanced"
               class="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
             >
               <ChevronRight class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-90': showAdvanced }" />
               <span>高级选项 (下载链接、私密信息)</span>
             </button>
             
             <div v-show="showAdvanced" class="mt-4 animate-in slide-in-from-top-2 fade-in duration-200">
                <AdvancedSection
                  ref="advancedSectionRef"
                  :download-links="formData.download_links"
                  :secrets="formData.secrets"
                  :field-errors="errors"
                  :disabled="isSubmitting"
                  @update:download-links="onDownloadLinksUpdate"
                  @update:secrets="onSecretsUpdate"
                  @validate="handleAdvancedValidate"
                />
             </div>
          </div>
          
        </div>
      </form>

      <!-- 底部栏：操作按钮 -->
      <div class="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur flex items-center justify-between z-20">
         <div class="text-xs text-gray-500 hidden sm:block">
            <span class="font-medium text-gray-700 dark:text-gray-300">Tip:</span> 使用 <kbd class="px-1 py-0.5 rounded border bg-white dark:bg-gray-700 font-mono text-[10px]">Ctrl</kbd> + <kbd class="px-1 py-0.5 rounded border bg-white dark:bg-gray-700 font-mono text-[10px]">Enter</kbd> 快速提交
         </div>
         <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <BaseButton
              type="button"
              @click="$emit('update:isOpen', false)"
              :disabled="isSubmitting"
              variant="secondary"
              class="px-6"
            >
              取消
            </BaseButton>
            <BaseButton
              type="button"
              @click="handleSubmit"
              :disabled="isSubmitting || !isValid"
              variant="primary"
              class="px-6 min-w-[100px]"
              :title="!isValid ? '请先修正表单错误' : ''"
            >
              <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin mr-2" />
              {{ isSubmitting ? (software ? '保存中...' : '添加中...') : '确定' }}
            </BaseButton>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { useDebounceFn, useMagicKeys, useManualRefHistory, useScrollLock, whenever } from '@vueuse/core'
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  LayoutGrid,
  Link2,
  Loader2,
  Monitor,
  Sparkles,
  Tag,
  ThumbsUp,
  Type,
  Undo2,
  Redo2,
  X,
} from 'lucide-vue-next'
import {
  computed,
  nextTick,
  onUnmounted,
  ref,
  watch,
  toRefs
} from 'vue'
import { useAIAnalysis } from '@/composables/useAIAnalysis'
import { useSoftwareValidation } from '@/composables/useSoftwareValidation'
import { LICENSES, SYSTEMS } from '@/types/constants'
import {
  inferFromWebsite,
  inferSupportedSystemsFromText,
  normalizeSystem,
} from '@/utils/system'
import { mergeUnique, normalizeList } from '@/utils/text'
import {
  type DownloadLink,
  type RelatedArticle,
  type SecretItem,
  type Software,
  type SystemType,
} from '../types'
import { AppError, ErrorCode } from '../types/error'
import { errorHandler } from '../utils/error-handler'
import logger from '../utils/logger'
import AdvancedSection from './AdvancedSection.vue'
import RelatedArticlesEditor from './RelatedArticlesEditor.vue'
import AIOverlay from './AIOverlay.vue'
import BlurFade from './animations/BlurFade.vue'
import BaseButton from './common/BaseButton.vue'
import IconUploader from './IconUploader.vue'
import ProsConsEditor from './ProsConsEditor.vue'
import SystemIcon from './SystemIcon.vue'

const props = defineProps<{
  isOpen: boolean
  software?: Software
  categories: string[]
  existingNames?: string[]
}>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  submit: [software: Partial<Software>]
  'import-error': [error: string]
  'import-success': [message: string]
}>()

// 默认表单数据
const defaultFormData: Partial<Software> = {
  name: '',
  category: '工具',
  description: '',
  icon: '',
  license: '免费',
  systems: ['Windows'],
  website: '',
  pros: [] as string[],
  cons: [] as string[],
  download_links: [] as DownloadLink[],
  secrets: [] as SecretItem[],
  related_articles: [] as RelatedArticle[],
}

// 使用 ref 而不是 reactive 以配合 useManualRefHistory
const formData = ref<Partial<Software>>({ ...defaultFormData })

// ====== 历史记录 (Undo/Redo) ======
const { history, undo, redo, canUndo, canRedo, commit, clear } = useManualRefHistory(formData, {
  capacity: 20,
  clone: (v) => JSON.parse(JSON.stringify(v)), // Deep clone for history
})

// 监听 props 变化初始化表单
watch(
  () => props.software,
  (newSoftware) => {
    if (newSoftware) {
      formData.value = {
        ...defaultFormData,
        ...newSoftware,
        pros: newSoftware.pros || [],
        cons: newSoftware.cons || [],
        download_links: newSoftware.download_links || [],
        secrets: newSoftware.secrets || [],
        related_articles: newSoftware.related_articles || [],
      }
    } else {
      formData.value = { ...defaultFormData }
    }
    // 清空历史记录，避免撤销到上一个软件的状态
    clear()
    commit() 
  },
  { immediate: true }
)

// 监听 formData 变化自动提交历史记录 (Debounced)
const debouncedCommit = useDebounceFn(() => {
   commit()
}, 500)

watch(formData, () => {
  debouncedCommit()
}, { deep: true })

// ====== 校验逻辑 ======
const { errors, validateField, validateAll, isValid } = useSoftwareValidation(
  formData.value,
  props.existingNames
)

// 当 formData 变化时，针对性地重新校验已报错的字段
watch(() => formData.value.name, () => {
  if (errors.value.name) validateField('name')
})

// 对全量校验进行防抖处理，避免频繁触发（如在 RelatedArticlesEditor 快速输入时）
const debouncedValidateAll = useDebounceFn(() => {
  validateAll()
}, 300)

// 处理高级选项部分的校验请求
const handleAdvancedValidate = () => {
  debouncedValidateAll()
}


// ====== 辅助状态 ======
const isSubmitting = ref(false)
const showAdvanced = ref(false)
const advancedSectionRef = ref<HTMLElement | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)

// 脏状态跟踪
const secretsDirty = ref(false)
const onSecretsUpdate = (v: SecretItem[]) => {
  formData.value.secrets = v
  secretsDirty.value = true
}

const downloadLinksDirty = ref(false)
const onDownloadLinksUpdate = (v: DownloadLink[]) => {
  formData.value.download_links = v
  downloadLinksDirty.value = true
}

const relatedArticlesDirty = ref(false)
const onRelatedArticlesUpdate = (v: RelatedArticle[]) => {
  formData.value.related_articles = v
  relatedArticlesDirty.value = true
}

// 滚动锁定
const isLocked = useScrollLock(document.body)
watch(() => props.isOpen, (v) => {
  isLocked.value = v
}, { immediate: true })

onUnmounted(() => {
  isLocked.value = false
})

// ====== 快捷键 ======
const { Ctrl_Enter, Escape, Ctrl_z, Ctrl_y } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (!props.isOpen) return
    if (e.key === 'z' && e.ctrlKey && !e.shiftKey) {
       e.preventDefault()
       undo()
    }
    if ((e.key === 'y' && e.ctrlKey) || (e.key === 'z' && e.ctrlKey && e.shiftKey)) {
       e.preventDefault()
       redo()
    }
  },
})

whenever(Ctrl_Enter, () => {
  if (props.isOpen && !isSubmitting.value) handleSubmit()
})
whenever(Escape, () => {
  if (props.isOpen && !isSubmitting.value) emit('update:isOpen', false)
})


// ====== 业务逻辑 ======

// 系统切换
const toggleSystem = (sys: SystemType) => {
  const current = Array.isArray(formData.value.systems) ? [...formData.value.systems] : []
  const index = current.indexOf(sys)
  if (index === -1) current.push(sys)
  else current.splice(index, 1)
  formData.value.systems = current
  validateField('systems')
}

// 提交
const handleSubmit = async () => {
  if (isSubmitting.value) return
  
  // 全量校验
  const valid = validateAll()
  if (!valid) {
     // 滚动到第一个错误
     const firstErrorField = Object.keys(errors.value)[0]
     scrollToField(firstErrorField)
     return
  }

  try {
    isSubmitting.value = true
    const payload: Partial<Software> = { ...formData.value }

    // 处理图标上传
    if (formData.value.icon instanceof File) {
      try {
        const { uploadService } = await import('@/services/upload')
        const { path } = await uploadService.uploadIcon(formData.value.icon)
        payload.icon = path
        formData.value.icon = path // 更新本地
      } catch (error) {
        logger.error('图标上传失败:', error)
        throw new AppError('图标上传失败，请重试', ErrorCode.NETWORK)
      }
    }

    if (!secretsDirty.value) delete (payload as any).secrets
    if (!downloadLinksDirty.value) delete (payload as any).download_links
    if (!relatedArticlesDirty.value) delete (payload as any).related_articles

    emit('submit', payload)
    // Clear draft if any (logic moved to parent or unnecessary with history?)
    // clearDraft() // Removed localstorage draft logic in favor of just emitting
  } catch (error) {
    errorHandler.handle(error)
  } finally {
    isSubmitting.value = false
  }
}

const scrollToField = (field: string) => {
  if (field === 'name') nameInputRef.value?.focus()
  // Add logic for other fields or scrolling to advanced section
  if (field.startsWith('download_links') || field.startsWith('secrets')) {
     showAdvanced.value = true
     nextTick(() => {
        advancedSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
     })
  }
}

const handleInput = (field: keyof Software, value: any) => {
   // just helper if needed for non-v-model
}

const onDescriptionInput = () => {
   // used for touch tracking in AI logic
   descTouched.value = true
}

// ====== AI Logic ======
const { isAnalyzing, errorMessage, analyze } = useAIAnalysis()
const isAnalyzingUI = ref(false)
watch(isAnalyzing, v => isAnalyzingUI.value = !!v)

// User edit tracking for AI
const descTouched = ref(false)
const prosTouched = ref(false)
const consTouched = ref(false)

const startAIFromName = async () => {
  if (!formData.value.name) return
  
  const payload = {
    ...(formData.value as any),
    id: props.software?.id || 0,
  } as Software

  const result = await analyze(payload)
  if (!result) return

  // Merge Logic
  commit() // Save state before AI modification for Undo capability

  if (result.description) formData.value.description = result.description
  
  if (!prosTouched.value) formData.value.pros = normalizeList(result.pros)
  else formData.value.pros = mergeUnique((formData.value.pros as string[]) || [], result.pros)
  
  if (!consTouched.value) formData.value.cons = normalizeList(result.cons)
  else formData.value.cons = mergeUnique((formData.value.cons as string[]) || [], result.cons)

  // System inference
  const aiSystems = (result.systems || []).map(s => normalizeSystem(s)).filter(Boolean) as SystemType[]
  const currentSystems = (formData.value.systems || []) as SystemType[]
  formData.value.systems = [...new Set([...currentSystems, ...aiSystems])]
  
  validateAll()
}

</script>

