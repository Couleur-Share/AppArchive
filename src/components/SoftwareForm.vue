<template>
  <!-- AI 分析全屏动画 -->
  <AIOverlay :active="isAnalyzingUI" />

  <div v-if="isOpen" class="fixed inset-0 z-50">
    <!-- 背景遮罩 -->
    <div
      class="absolute inset-0 bg-black/50"
      v-gsap="{ duration: 0.18, to: { duration: 0.18, ease: 'power1.out' } }"
    ></div>

    <!-- 对话框内容 -->
    <div class="relative z-10">
      <div class="fixed inset-0 flex items-center justify-center p-4">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-level3 will-change-transform will-change-opacity"
          v-gsap="{
            y: 12,
            duration: 0.1,
            ease: 'power2.out',
            to: { y: 0, duration: 0.1, ease: 'power2.out' },
          }"
        >
          <!-- 标题区域 -->
          <div
            class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700"
          >
            <h2
              class="text-xl font-semibold text-gray-900 dark:text-white"
            >
              {{ software ? '编辑软件' : '添加软件' }}
            </h2>
            <button
              @click="$emit('update:isOpen', false)"
              class="p-2 rounded-lg transition-all duration-200 
                     text-gray-600 dark:text-gray-400
                     hover:bg-gray-100 dark:hover:bg-gray-700 
                     hover:text-gray-900 dark:hover:text-white
                     focus:outline-none focus:ring-2 focus:ring-gray-500/50"
              aria-label="关闭"
              title="关闭"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- 表单内容 -->
          <form
            @submit.prevent="handleSubmit"
            id="softwareForm"
            class="flex-1 overflow-y-auto p-6 space-y-4"
          >
            <fieldset :disabled="isSubmitting" class="space-y-4">
              <!-- 顶部错误摘要（当错误 ≥ 2 时显示，避免与就地提示重复） -->
              <BlurFade :delay="0.12" :offset="6" direction="up" inView>
                <div
                  v-if="summaryEntries.length > 1"
                  class="p-3 rounded-lg bg-red-500/5 text-red-600 dark:text-red-300 border border-red-400/30"
                  role="alert"
                  aria-live="polite"
                >
                  <div class="flex items-center justify-between gap-2 mb-2">
                    <div class="flex items-center gap-2">
                      <AlertCircle class="w-4 h-4" />
                      <span
                        >请检查表单，有
                        {{ summaryEntries.length }} 处需要修正。</span
                      >
                    </div>
                    <button
                      type="button"
                      class="text-sm underline underline-offset-2 hover:opacity-80"
                      @click="
                        () =>
                          scrollToField(Object.keys(fieldErrors.value)[0] || '')
                      "
                    >
                      跳到第一个
                    </button>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="([k, v], i) in summaryEntries"
                      :key="k"
                      type="button"
                      class="px-2 py-1 rounded bg-red-400/10 border border-red-400/30 text-xs hover:bg-red-400/15"
                      @click="scrollToField(k)"
                      :title="v"
                    >
                      {{ i + 1 }}. {{ k }}
                    </button>
                  </div>
                </div>
              </BlurFade>

              <!-- 第一部分：基本信息 -->
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 space-y-4">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">基本信息</h3>
                
                <!-- 软件名称 -->
                <div>
                  <label
                    class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                    >软件名称<span class="text-red-500 ml-1">*</span></label
                  >
                  <div class="relative">
                    <input
                      v-model="formData.name"
                      required
                      ref="nameInputRef"
                      @input="debouncedValidateAll()"
                      @blur="validateAll()"
                      :aria-invalid="Boolean(nameError || fieldErrors['name'])"
                      :aria-describedby="
                        nameError || fieldErrors['name']
                          ? 'name-error'
                          : undefined
                      "
                      :class="[
                        'w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100',
                        formData.name ? 'pr-32' : ''
                      ]"
                      placeholder="输入软件名称"
                    />
                    <!-- AI 智能填充按钮（内联在输入框右侧） -->
                    <div
                      v-if="formData.name"
                      class="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      <BaseButton
                        type="button"
                        @click.stop="startAIFromName"
                        :disabled="isAnalyzing || isCoolingDown || !formData.name"
                        variant="primary"
                        size="sm"
                        class="rounded-lg"
                        :title="
                          isCoolingDown
                            ? '请稍后再试'
                            : '让 AI 帮你快速完成表单填写'
                        "
                      >
                        <Bot class="w-3.5 h-3.5" />
                        <span class="hidden sm:inline">AI 填充</span>
                        <Loader2 v-if="isAnalyzing" class="w-3.5 h-3.5 animate-spin" />
                      </BaseButton>
                    </div>
                  </div>
                  <div
                    v-if="nameError"
                    class="mt-1 text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle class="w-3.5 h-3.5" />
                    <span>{{ nameError }}</span>
                  </div>
                  <div
                    v-else-if="fieldErrors['name']"
                    id="name-error"
                    class="mt-1 text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle class="w-3.5 h-3.5" />
                    <span>{{ fieldErrors['name'] }}</span>
                  </div>
                  <div
                    v-if="aiErrorMessage"
                    class="mt-1 text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle class="w-3.5 h-3.5" />
                    <span>{{ aiErrorMessage }}</span>
                  </div>
                </div>

                <!-- 类别选择 -->
                <div>
                  <label
                    class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                    >类别<span class="text-red-500 ml-1">*</span></label
                  >
                  <Listbox v-model="formData.category">
                    <div class="relative">
                      <ListboxButton
                        class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 text-left flex items-center justify-between text-gray-900 dark:text-gray-100"
                      >
                        <span>{{ formData.category || '选择类别' }}</span>
                        <ChevronDown class="h-4 w-4 text-gray-400" />
                      </ListboxButton>
                      <Transition
                        leave-active-class="transition duration-100 ease-in"
                        leave-from-class="opacity-100"
                        leave-to-class="opacity-0"
                      >
                        <ListboxOptions
                          class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none border border-gray-200 dark:border-gray-700"
                        >
                          <ListboxOption
                            v-for="category in categories"
                            :key="category"
                            :value="category"
                            v-slot="{ active, selected }"
                          >
                            <div
                              :class="[
                                'px-4 py-2.5 cursor-pointer flex items-center',
                                active
                                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-200'
                                  : 'text-gray-900 dark:text-gray-100',
                              ]"
                            >
                              <Check
                                v-if="selected"
                                class="h-4 w-4 mr-2 text-blue-500"
                              />
                              <span :class="[selected ? 'font-medium' : '']">{{
                                category
                              }}</span>
                            </div>
                          </ListboxOption>
                        </ListboxOptions>
                      </Transition>
                    </div>
                  </Listbox>
                </div>

                <!-- 描述输入框 -->
                <div>
                  <label
                    class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                    >描述<span class="text-red-500 ml-1">*</span></label
                  >
                  <div class="relative">
                    <textarea
                      v-model="formData.description"
                      rows="4"
                      maxlength="300"
                      @input="onDescriptionInput"
                      class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 resize-none text-gray-900 dark:text-gray-100"
                      placeholder="输入软件描述"
                    ></textarea>
                    <div
                      class="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right"
                    >
                      {{ descCount }} / {{ descMax }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 第二部分：品牌与授权 -->
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 space-y-4">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">品牌与授权</h3>
                
                <!-- 软件图标 -->
                <div>
                  <label
                    class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                    >软件图标</label
                  >
                  <IconUploader
                    v-model="formData.icon"
                    :disabled="isSubmitting"
                  />
                </div>

                <!-- 授权类型选择（改为按钮组） -->
                <div>
                  <label
                    class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                    >授权类型</label
                  >
                  <div class="grid grid-cols-2 gap-3">
                    <button
                      v-for="license in LICENSES"
                      :key="license"
                      type="button"
                      @click="formData.license = license"
                      :class="[
                        'px-4 py-2.5 rounded-lg border transition-all duration-200 text-sm font-medium',
                        formData.license === license
                          ? 'bg-blue-600 dark:bg-gray-700 border-blue-600 dark:border-gray-700 text-white'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
                        {
                          'text-gray-800 dark:text-gray-200': license === '免费' && formData.license !== license,
                          'text-blue-600 dark:text-blue-300': license === '收费' && formData.license !== license,
                          'text-green-600 dark:text-green-300': license === '开源' && formData.license !== license,
                          'text-purple-600 dark:text-purple-300': license === '已购' && formData.license !== license,
                        }
                      ]"
                    >
                      {{ license }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 第三部分：支持系统 -->
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 space-y-4">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">支持系统</h3>
                <div class="grid grid-cols-3 gap-3">
                  <button
                    v-for="sys in SYSTEMS"
                    :key="sys"
                    type="button"
                    @click="toggleSystem(sys as SystemType)"
                    :class="[
                      'flex flex-col items-center justify-center p-4 rounded-lg border transition-all duration-200',
                      (formData.systems || []).includes(sys as SystemType)
                        ? 'bg-blue-600 dark:bg-gray-700 border-blue-600 dark:border-gray-700 text-white'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    ]"
                  >
                    <SystemIcon
                      :system="sys"
                      class="w-6 h-6 mb-2"
                    />
                    <span class="text-sm">{{ sys }}</span>
                  </button>
                </div>
              </div>

              <!-- 第四部分：官方链接 -->
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 space-y-4">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">官方链接</h3>
                <div>
                  <label
                    class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300"
                    >官方网址</label
                  >
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <input
                      v-model="formData.website"
                      type="url"
                      :aria-invalid="Boolean(fieldErrors['website'])"
                      :aria-describedby="
                        fieldErrors['website'] ? 'website-error' : undefined
                      "
                      ref="websiteInputRef"
                      @input="debouncedValidateAll()"
                      @blur="validateAll()"
                      class="w-full pl-12 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div
                    v-if="fieldErrors['website']"
                    id="website-error"
                    class="mt-1 text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle class="w-3.5 h-3.5" />
                    <span>{{ fieldErrors['website'] }}</span>
                  </div>
                </div>
              </div>

              <!-- 第五部分：评价 -->
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 space-y-4">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">评价</h3>
                <ProsConsEditor
                  :pros="formData.pros"
                  :cons="formData.cons"
                  :disabled="isSubmitting"
                  @update:pros="(v) => (formData.pros = v)"
                  @update:cons="(v) => (formData.cons = v)"
                  @touched-pros="prosTouched = true"
                  @touched-cons="consTouched = true"
                />
              </div>

              <!-- 高级字段折叠开关 -->
              <div class="pt-2">
                <button
                  type="button"
                  @click="showAdvanced = !showAdvanced"
                  class="w-full flex items-center justify-between px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-sm text-gray-700 dark:text-gray-300"
                >
                  <span>显示高级选项</span>
                  <ChevronDown
                    class="h-4 w-4 transition-transform"
                    :class="showAdvanced ? 'rotate-180' : ''"
                  />
                </button>
              </div>

              <div v-show="showAdvanced" ref="advancedSectionRef">
                <AdvancedSection
                  :download-links="formData.download_links"
                  :secrets="formData.secrets"
                  :field-errors="fieldErrors"
                  :disabled="isSubmitting"
                  @update:download-links="onDownloadLinksUpdate"
                  @update:secrets="onSecretsUpdate"
                  @validate="validateAll()"
                />
              </div>
            </fieldset>
          </form>

          <!-- 操作按钮 -->
          <div
            class="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700"
          >
            <div class="text-xs text-gray-500 dark:text-gray-400">
              所有标记 <span class="text-red-500">*</span> 的字段为必填项
            </div>
            <div class="flex gap-3">
              <BaseButton
                type="button"
                @click="$emit('update:isOpen', false)"
                :disabled="isSubmitting"
                variant="secondary"
                :class="['disabled:opacity-50 disabled:cursor-not-allowed']"
              >
                取消
              </BaseButton>
              <BaseButton
                type="submit"
                @click="handleSubmit"
                :disabled="isSubmitting || submitDisabled"
                variant="primary"
                :class="['disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none']"
                :title="submitDisabled ? submitDisabledReason : ''"
              >
                <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
                {{
                  isSubmitting ? (software ? '保存中...' : '添加中...') : '确定'
                }}
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onUnmounted,
  reactive,
  nextTick,
  computed,
} from 'vue'
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import {
  Check,
  ChevronDown,
  X,
  Loader2,
  AlertCircle,
  Bot,
} from 'lucide-vue-next'
import {
  type Software,
  type DownloadLink,
  type SecretItem,
  type SystemType,
} from '../types'
import { AppError, ErrorCode } from '../types/error'
import { errorHandler } from '../utils/error-handler'
import { useDebounceFn } from '@vueuse/core'
import logger from '../utils/logger'
import { z } from 'zod'
import { useAIAnalysis } from '@/composables/useAIAnalysis'
import { SYSTEMS, LICENSES } from '@/types/constants'
import { normalizeList, mergeUnique } from '@/utils/text'
import {
  normalizeSystem,
  inferSupportedSystemsFromText,
  inferFromWebsite,
} from '@/utils/system'
import IconUploader from './IconUploader.vue'
import ProsConsEditor from './ProsConsEditor.vue'
import AdvancedSection from './AdvancedSection.vue'
import AIOverlay from './AIOverlay.vue'
import SystemIcon from './SystemIcon.vue'
import BlurFade from './animations/BlurFade.vue'
import BaseButton from './common/BaseButton.vue'
import IconButton from './common/IconButton.vue'

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

// 统一按钮样式改为使用 BaseButton / IconButton 通用组件

// 默认表单数据与 reactive 状态
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
}

const formData = reactive<Partial<Software>>({
  ...defaultFormData,
})

// ====== 私密信息脏状态跟踪 ======
const secretsDirty = ref(false)
const onSecretsUpdate = (v: SecretItem[]) => {
  formData.secrets = v
  secretsDirty.value = true
}

// ====== 下载链接脏状态跟踪 ======
const downloadLinksDirty = ref(false)
const onDownloadLinksUpdate = (v: DownloadLink[]) => {
  formData.download_links = v
  downloadLinksDirty.value = true
}

// 监听 props 变化，更新表单数据（保持 reactive 引用不变）
watch(
  () => props.software,
  (newSoftware) => {
    if (newSoftware) {
      Object.assign(formData, {
        ...defaultFormData,
        ...newSoftware,
        pros: newSoftware.pros || [],
        cons: newSoftware.cons || [],
        download_links: newSoftware.download_links || [],
        secrets: newSoftware.secrets || [],
      })
    } else {
      Object.assign(formData, { ...defaultFormData })
    }
  },
  { immediate: true }
)

const isSubmitting = ref(false)
// 锁定背景滚动
const originalBodyOverflow = ref('')
const originalHtmlOverflow = ref('')

const lockScroll = () => {
  if (typeof document === 'undefined') return
  originalBodyOverflow.value = document.body.style.overflow
  originalHtmlOverflow.value = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
}

const unlockScroll = () => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = originalBodyOverflow.value || ''
  document.documentElement.style.overflow = originalHtmlOverflow.value || ''
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) lockScroll()
    else unlockScroll()
  },
  { immediate: true }
)

onUnmounted(() => {
  unlockScroll()
})
const uploading = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const nameInputRef = ref<HTMLInputElement | null>(null)
const websiteInputRef = ref<HTMLInputElement | null>(null)
const advancedSectionRef = ref<HTMLElement | null>(null)
const nameError = ref('')
const fieldErrors = ref<Record<string, string>>({})

// 统一的 zod Schema（顶层常量，避免重复创建）
const downloadLinkSchema = z.object({
  id: z.string(),
  provider: z.string(),
  url: z
    .string()
    .min(1, '下载链接不能为空')
    .refine(
      (v: string) =>
        /^https?:\/\//i.test(v) ||
        v.startsWith('magnet:?') ||
        v.startsWith('ed2k://'),
      'URL 必须是 http(s) / magnet / ed2k'
    ),
  code: z.string().optional(),
  password: z.string().optional(),
  versionLabel: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['unknown', 'alive', 'dead']).optional(),
  createdAt: z.string(),
  expiresAt: z.string().optional(),
})

const formSchema = z.object({
  name: z.string().min(2, '名称至少 2 个字符'),
  category: z.string().min(1, '类别必选'),
  description: z.string().optional(),
  icon: z
    .string()
    .optional()
    .refine(
      (v) => {
        if (!v) return true;
        // 只允许COS URL
        const isCosUrl = v.startsWith('https://') && v.includes('cos.') && v.includes('myqcloud.com');
        return isCosUrl;
      },
      '图标必须上传到腾讯云COS'
    ),
  license: z
    .enum(LICENSES)
    .optional()
    .transform((v) => v ?? '免费'),
  systems: z.array(z.enum(SYSTEMS)).min(1, '至少选择一个系统'),
  website: z
    .string()
    .optional()
    .refine(
      (v: string | undefined) => !v || /^https?:\/\//i.test(v),
      '请输入合法网址（http/https）'
    ),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  download_links: z.array(downloadLinkSchema).optional(),
  secrets: z.any().optional(),
})

// 统一校验入口：产出 fieldErrors 与重复名错误
const validateAll = () => {
  fieldErrors.value = {}
  nameError.value = ''

  // 如果icon是File对象，临时转换为字符串用于校验（File对象在提交时会上传）
  const dataForValidation = { ...formData }
  if (dataForValidation.icon instanceof File) {
    // File对象暂时跳过icon字段的校验，因为会在提交时上传
    delete dataForValidation.icon
  }

  const parseResult = formSchema.safeParse(dataForValidation)
  if (!parseResult.success) {
    for (const issue of parseResult.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors.value[path]) fieldErrors.value[path] = issue.message
    }
  }

  // 额外校验：如果icon是File对象，验证文件类型和大小
  if (formData.icon instanceof File) {
    const file = formData.icon
    const okType = /^(image\/(png|jpeg|webp|svg\+xml|x-icon))$/i.test(file.type)
    if (!okType) {
      fieldErrors.value['icon'] = '仅支持 PNG/JPEG/WebP/SVG/ICO 格式'
    }
    const maxSize = 1024 * 1024
    if (file.size > maxSize) {
      fieldErrors.value['icon'] = '图片过大，请控制在 1MB 以内'
    }
  }

  // 额外校验：新增的私密信息必须填写值
  const secrets = formData.secrets as any[] | undefined
  if (Array.isArray(secrets)) {
    secrets.forEach((sec, idx) => {
      const hasId = Boolean(sec && sec.id)
      const hasCipher = sec && typeof sec.value === 'undefined' // 旧项通常不带 value
      const valueFilled =
        typeof sec?.value === 'string' && sec.value.trim().length > 0
      if (!hasCipher && !valueFilled) {
        // 视为"新增或需要更新"的条目却未填值
        fieldErrors.value[`secrets.${idx}.value`] = '请填写值'
      }
    })
  }

  // 重名检测（区分编辑模式）
  const inputName = (formData.name || '').trim()
  if (inputName && props.existingNames && props.existingNames.length > 0) {
    const lower = inputName.toLowerCase()
    const isEditingSame =
      props.software && props.software.name === formData.name
    const exists = props.existingNames.some(
      (n) => (n || '').toLowerCase() === lower && !isEditingSame
    )
    if (exists) {
      nameError.value = '已存在同名软件'
      fieldErrors.value['name'] = nameError.value
    }
  }
}

const debouncedValidateAll = useDebounceFn(() => {
  if (!props.isOpen) return
  validateAll()
}, 200)

// 描述计数
const descMax = 300
const descCount = computed(() => (formData.description || '').length)

// 高级区域折叠
const showAdvanced = ref(false)

// 草稿保存与恢复
const DRAFT_KEY = 'software-form-draft'
const isEditing = computed(() => Boolean(props.software))

const loadDraft = () => {
  if (isEditing.value) return
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return
    const draft = JSON.parse(raw)
    Object.assign(formData, { ...defaultFormData, ...draft })
  } catch {}
}

const clearDraft = () => {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {}
}

const saveDraft = () => {
  if (isEditing.value) return
  try {
    const payload = {
      name: formData.name,
      category: formData.category,
      description: formData.description,
      icon: formData.icon,
      license: formData.license,
      systems: formData.systems,
      website: formData.website,
      pros: formData.pros,
      cons: formData.cons,
      download_links: formData.download_links,
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
  } catch {}
}

const debouncedSaveDraft = useDebounceFn(saveDraft, 500)

watch(
  formData,
  () => {
    if (props.isOpen) debouncedSaveDraft()
  },
  { deep: true }
)

// 提交按钮禁用逻辑：以统一校验为准
const submitDisabled = computed(() => {
  if (isSubmitting.value) return true
  // 当存在任一字段错误时禁用
  return Object.keys(fieldErrors.value).length > 0
})

const submitDisabledReason = computed(() => {
  if (isSubmitting.value) return '正在提交…'
  if (nameError.value) return nameError.value
  // 如果有错误，优先显示第一个错误
  const first = Object.entries(fieldErrors.value)[0]
  return first ? first[1] : ''
})

// 处理表单提交
const handleSubmit = async () => {
  if (isSubmitting.value) return
  // 若存在名称错误（如重复），阻止提交
  if (nameError.value) {
    logger.error(nameError.value)
    return
  }

  try {
    isSubmitting.value = true

    // 统一 Schema 校验（包含图标路径验证）
    validateAll()
    if (Object.keys(fieldErrors.value).length > 0) {
      throw new AppError('表单校验失败', ErrorCode.VALIDATION)
    }

    // 仅在私密信息被改动时才携带 secrets 字段
    const payload: Partial<Software> = { ...formData }
    
    // 如果图标是File对象，先上传到COS
    if (formData.icon instanceof File) {
      try {
        const { uploadService } = await import('@/services/upload')
        const { path } = await uploadService.uploadIcon(formData.icon)
        payload.icon = path
        // 更新formData中的icon为URL，以便后续使用
        formData.icon = path
      } catch (error) {
        logger.error('图标上传失败:', error)
        throw new AppError('图标上传失败，请重试', ErrorCode.NETWORK)
      }
    }
    
    if (!secretsDirty.value) {
      delete (payload as any).secrets
    }
    if (!downloadLinksDirty.value) {
      delete (payload as any).download_links
    }
    emit('submit', payload)
    // 清除草稿
    clearDraft()
  } catch (error) {
    const appError = errorHandler.handle(error)
  } finally {
    isSubmitting.value = false
  }
}

const toggleSystem = (sys: SystemType) => {
  const current = Array.isArray(formData.systems) ? [...formData.systems] : []
  const index = current.indexOf(sys)
  if (index === -1) current.push(sys)
  else current.splice(index, 1)
  formData.systems = current
}

// 已由可复用组件 SystemIcon 统一处理系统图标映射

// 已不再使用
// const query = ref('')

// 移除“从链接导入”相关所有状态与逻辑

// 通用字段赋值（如需要可在模板中复用）
const handleInput = (field: keyof Software, value: any) => {
  ;(formData as any)[field] = value
}

// 优缺点编辑已交由 ProsConsEditor 子组件处理
// 下载链接与私密信息已交由 AdvancedSection 子组件处理

const removeCon = (index: number) => {
  if (!Array.isArray(formData.cons)) return
  formData.cons.splice(index, 1)
}

// 在 script setup 中修改 AI 分析相关代码
const { isAnalyzing, errorMessage, analyze } = useAIAnalysis()
const aiErrorMessage = computed(() => errorMessage.value)

// 防重复点击冷却
const aiCooldownMs = 8000
const lastAnalyzeAt = ref<number | null>(null)
const isCoolingDown = computed(() => {
  if (!lastAnalyzeAt.value) return false
  return Date.now() - lastAnalyzeAt.value < aiCooldownMs
})

// 用户编辑追踪（避免覆盖用户输入）
const descTouched = ref(false)
const prosTouched = ref(false)
const consTouched = ref(false)

const onDescriptionInput = () => {
  descTouched.value = true
}
const onProsInput = (_i: number) => {
  prosTouched.value = true
}
const onConsInput = (_i: number) => {
  consTouched.value = true
}

// 文本数组规范化与合并改为引用 utils/text
// 分离 UI 显示状态
const isAnalyzingUI = ref(false)
watch(isAnalyzing, async (v) => {
  isAnalyzingUI.value = !!v
})

// 名称输入下方的 AI 分析入口
const startAIFromName = async () => {
  if (isCoolingDown.value) return
  if (!formData.name) {
    logger.error('AI 分析失败: 请先填写软件名称')
    return
  }
  lastAnalyzeAt.value = Date.now()
  setTimeout(() => {
    lastAnalyzeAt.value = null
  }, aiCooldownMs)
  const payload = {
    ...(formData as any),
    id: props.software?.id || 0,
    created_at: props.software?.created_at || new Date().toISOString(),
  } as Software

  const result = await analyze(payload)
  if (!result) return

  // 每次重新分析都刷新描述，无条件覆盖为 AI 结果
  if (result.description) {
    formData.description = result.description
  }
  if (!prosTouched.value) formData.pros = normalizeList(result.pros)
  else
    formData.pros = mergeUnique((formData.pros as string[]) || [], result.pros)
  if (!consTouched.value) formData.cons = normalizeList(result.cons)
  else
    formData.cons = mergeUnique((formData.cons as string[]) || [], result.cons)

  try {
    const aiSystems = Array.isArray(result.systems) ? result.systems : []
    const normalizedFromAI = aiSystems
      .map((s) => normalizeSystem(s))
      .filter((s): s is SystemType => Boolean(s))
    if (normalizedFromAI.length > 0) {
      const current = Array.isArray(formData.systems)
        ? ([...formData.systems] as SystemType[])
        : []
      const merged = Array.from(
        new Set<SystemType>([...current, ...normalizedFromAI])
      )
      formData.systems = merged
    }
    const textForInference = [
      formData.name || '',
      formData.description || '',
      result.description || '',
      formData.website || '',
    ].join(' ')
    const inferred = new Set<SystemType>([
      ...inferSupportedSystemsFromText(textForInference),
      ...inferFromWebsite(formData.website),
    ])
    if (inferred.size > 0) {
      const current = Array.isArray(formData.systems)
        ? ([...formData.systems] as SystemType[])
        : []
      const merged = Array.from(new Set<SystemType>([...current, ...inferred]))
      formData.systems = merged
    }
  } catch (e) {
    logger.error('推断系统失败:', e)
  }
}

// 错误条目列表（用于摘要锚点）
const errorEntries = computed(() => Object.entries(fieldErrors.value))
// 顶部摘要条目（当错误数≥2时展示）
const summaryEntries = computed(() => Object.entries(fieldErrors.value))

// 通用滚动到字段
const scrollToField = async (key: string) => {
  if (key === 'name') {
    nameInputRef.value?.focus()
    return
  }
  if (key === 'website') {
    websiteInputRef.value?.focus()
    return
  }
  if (key.startsWith('download_links') || key.startsWith('secrets')) {
    showAdvanced.value = true
    await nextTick()
    advancedSectionRef.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    return
  }
  const formEl = document.getElementById('softwareForm')
  formEl?.scrollTo({ top: 0, behavior: 'smooth' })
}

// 基础校验（名称最小长度）
const validateNameBasic = () => {
  const name = (formData.name || '').trim()
  if (name.length < 2) {
    fieldErrors.value['name'] = '名称至少 2 个字符'
  } else {
    delete fieldErrors.value['name']
  }
}

// 基础校验（网址）
const validateWebsite = () => {
  const website = (formData.website || '').trim()
  if (!website) {
    delete fieldErrors.value['website']
    return
  }
  if (!/^https?:\/\//i.test(website)) {
    fieldErrors.value['website'] = '请输入合法网址（http/https）'
  } else {
    delete fieldErrors.value['website']
  }
}

// 校验下载链接 URL
const validateDownloadLink = (idx: number) => {
  const key = `download_links.${idx}.url`
  const url =
    (formData.download_links && formData.download_links[idx]?.url) || ''
  const v = url.trim()
  if (!v) {
    fieldErrors.value[key] = '下载链接不能为空'
    return
  }
  const ok =
    /^https?:\/\//i.test(v) ||
    v.startsWith('magnet:?') ||
    v.startsWith('ed2k://')
  if (!ok) {
    fieldErrors.value[key] = 'URL 必须是 http(s) / magnet / ed2k'
  } else {
    delete fieldErrors.value[key]
  }
}
</script>

<style scoped>
/* 与 AIOverlay 相关的样式已迁移至组件内部 */
</style>
