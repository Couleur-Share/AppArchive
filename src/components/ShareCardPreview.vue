<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog
      as="div"
      class="relative z-[60]"
      :open="isOpen"
      :initialFocus="closeButtonRef"
      @close="handleDialogClose"
    >
      <TransitionChild enter="ease-[cubic-bezier(0.22,1,0.36,1)] duration-220" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in duration-160" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 app-modal-backdrop" />
      </TransitionChild>
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-6">
          <TransitionChild enter="ease-[cubic-bezier(0.22,1,0.36,1)] duration-260" enter-from="opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95" enter-to="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-170" leave-from="opacity-100 translate-y-0 sm:scale-100" leave-to="opacity-0 translate-y-2 sm:translate-y-0 sm:scale-95">
            <DialogPanel @click.stop @mousedown.stop @mouseup.stop @pointerdown.stop @pointerup.stop class="w-full max-w-5xl rounded-2xl app-modal-panel app-modal-panel--interactive border border-gray-200/50 dark:border-gray-700/30 shadow-xl max-h-[min(90dvh,980px)] overflow-y-auto">
              <div class="p-4 border-b border-gray-200/50 dark:border-gray-700/30 flex items-center justify-between">
                <DialogTitle class="text-lg font-semibold">分享卡片预览</DialogTitle>
                <div class="flex items-center gap-2">
                  <BaseButton
                    type="button"
                    variant="primary"
                    size="sm"
                    @click.stop="onSave"
                  >
                    分享
                  </BaseButton>
                  <button 
                    ref="closeButtonRef"
                    class="p-2 rounded-lg transition-all duration-200 
                           text-gray-600 dark:text-gray-400
                           hover:bg-gray-100 dark:hover:bg-gray-700 
                           hover:text-gray-900 dark:hover:text-white
                           focus:outline-none focus:ring-2 focus:ring-gray-500/50 app-modal-close-btn"
                    @click.stop="handleDialogClose"
                    title="关闭"
                    aria-label="关闭"
                  >
                    <X class="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div class="p-4 flex flex-col gap-4">
                <!-- 主题/显示控制（点击不关闭） -->
                <div class="flex flex-wrap items-center gap-2" @click.stop @mousedown.stop @mouseup.stop @pointerdown.stop @pointerup.stop>
                  <span class="text-sm text-gray-600 dark:text-gray-300 mr-2">风格：</span>
                  <button type="button" @click.stop="theme = 'classic'" :class="['px-3 py-1.5 rounded-lg text-sm border', theme === 'classic' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 dark:border-gray-600']">经典</button>
                  <button type="button" @click.stop="theme = 'dark'" :class="['px-3 py-1.5 rounded-lg text-sm border', theme === 'dark' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 dark:border-gray-600']">暗色</button>
                  <button type="button" @click.stop="theme = 'gradient'" :class="['px-3 py-1.5 rounded-lg text-sm border', theme === 'gradient' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 dark:border-gray-600']">渐变</button>

                  <span class="mx-3 h-5 w-px bg-gray-200 dark:bg-gray-700"></span>
                  <span class="text-sm text-gray-600 dark:text-gray-300">显示：</span>
                  <button type="button" @click.stop="showWebsite = !showWebsite" :class="['px-2.5 py-1 rounded-lg text-xs border', showWebsite ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300']">网站</button>
                  <button type="button" @click.stop="showSystems = !showSystems" :class="['px-2.5 py-1 rounded-lg text-xs border', showSystems ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300']">系统</button>
                </div>

                <!-- 预览区域 -->
                <div class="flex justify-center">
                  <div ref="previewRef" :class="['w-[920px] rounded-2xl p-8 shadow-2xl relative overflow-hidden', themeClass]">
                    <template v-if="detail?.software">
                      <div class="flex items-center gap-4 mb-6">
                        <div class="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-white/20">
                          <img :src="getIconUrl(detail.software.icon || '')" alt="icon" class="w-full h-full object-cover" referrerpolicy="origin" />
                        </div>
                        <div>
                          <div class="text-2xl font-bold">{{ detail.software.name }}</div>
                          <div :class="['text-sm mt-1', theme === 'classic' ? 'text-gray-500' : 'text-white/80']">{{ metaLine }}</div>
                          <a v-if="showWebsite && detail.software.website" :href="detail.software.website" target="_blank" rel="noopener noreferrer" :class="['text-sm mt-1 underline', theme === 'classic' ? 'text-primary' : 'text-white']">{{ detail.software.website }}</a>
                        </div>
                      </div>
                      <div v-if="detail.software.description" class="mb-6">
                        <div :class="['text-sm whitespace-pre-wrap leading-7', theme === 'classic' ? 'text-gray-700' : 'text-white']">{{ detail.software.description }}</div>
                      </div>
                      <div class="grid grid-cols-2 gap-6">
                        <div>
                          <div :class="['font-semibold mb-2', theme === 'classic' ? 'text-primary' : 'text-primary/90']">优点</div>
                          <ul :class="['list-disc list-inside text-sm space-y-1', theme === 'classic' ? 'text-gray-800' : 'text-white']">
                            <li v-for="(pro, i) in (detail.software.pros || []).slice(0,6)" :key="'pro-'+i">{{ pro }}</li>
                            <li v-if="!(detail.software.pros||[]).length" :class="[theme === 'classic' ? 'text-gray-400' : 'text-white/70']">暂无</li>
                          </ul>
                        </div>
                        <div>
                          <div :class="['font-semibold mb-2', theme === 'classic' ? 'text-red-600' : 'text-red-200']">缺点</div>
                          <ul :class="['list-disc list-inside text-sm space-y-1', theme === 'classic' ? 'text-gray-800' : 'text-white']">
                            <li v-for="(con, i) in (detail.software.cons || []).slice(0,6)" :key="'con-'+i">{{ con }}</li>
                            <li v-if="!(detail.software.cons||[]).length" :class="[theme === 'classic' ? 'text-gray-400' : 'text-white/70']">暂无</li>
                          </ul>
                        </div>
                      </div>
                      <div :class="['mt-8 text-xs', theme === 'classic' ? 'text-gray-400' : 'text-white/80']">由 AppArchive 生成 · {{ new Date().toLocaleDateString() }}</div>
                    </template>
                  </div>
                </div>

                <!-- 离屏导出容器（与上方同结构） -->
                <div class="fixed -left-[9999px] top-0">
                  <div ref="exportRef" :class="['w-[920px] rounded-2xl p-8 relative overflow-hidden', themeClass]">
                    <template v-if="detail?.software">
                      <div class="flex items-center gap-4 mb-6">
                        <div class="w-16 h-16 rounded-xl overflow-hidden ring-2 ring-white/20">
                          <img :src="getIconUrl(detail.software.icon || '')" alt="icon" class="w-full h-full object-cover" referrerpolicy="origin" />
                        </div>
                        <div>
                          <div class="text-2xl font-bold">{{ detail.software.name }}</div>
                          <div :class="['text-sm mt-1', theme === 'classic' ? 'text-gray-500' : 'text-white/80']">{{ metaLine }}</div>
                          <a v-if="showWebsite && detail.software.website" :href="detail.software.website" target="_blank" rel="noopener noreferrer" :class="['text-sm mt-1 underline', theme === 'classic' ? 'text-primary' : 'text-white']">{{ detail.software.website }}</a>
                        </div>
                      </div>
                      <div v-if="detail.software.description" class="mb-6">
                        <div :class="['text-sm whitespace-pre-wrap leading-7', theme === 'classic' ? 'text-gray-700' : 'text-white']">{{ detail.software.description }}</div>
                      </div>
                      <div class="grid grid-cols-2 gap-6">
                        <div>
                          <div :class="['font-semibold mb-2', theme === 'classic' ? 'text-primary' : 'text-primary/90']">优点</div>
                          <ul :class="['list-disc list-inside text-sm space-y-1', theme === 'classic' ? 'text-gray-800' : 'text-white']">
                            <li v-for="(pro, i) in (detail.software.pros || []).slice(0,6)" :key="'exp-pro-'+i">{{ pro }}</li>
                            <li v-if="!(detail.software.pros||[]).length" :class="[theme === 'classic' ? 'text-gray-400' : 'text-white/70']">暂无</li>
                          </ul>
                        </div>
                        <div>
                          <div :class="['font-semibold mb-2', theme === 'classic' ? 'text-red-600' : 'text-red-200']">缺点</div>
                          <ul :class="['list-disc list-inside text-sm space-y-1', theme === 'classic' ? 'text-gray-800' : 'text-white']">
                            <li v-for="(con, i) in (detail.software.cons || []).slice(0,6)" :key="'exp-con-'+i">{{ con }}</li>
                            <li v-if="!(detail.software.cons||[]).length" :class="[theme === 'classic' ? 'text-gray-400' : 'text-white/70']">暂无</li>
                          </ul>
                        </div>
                      </div>
                      <div :class="['mt-8 text-xs', theme === 'classic' ? 'text-gray-400' : 'text-white/80']">由 AppArchive 生成 · {{ new Date().toLocaleDateString() }}</div>
                    </template>
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
import { toBlob } from 'html-to-image'
import { X } from 'lucide-vue-next'
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useToast } from '../composables/useToast'
import { getIconUrl } from '../services/localIconCache'
import type { Software, SoftwareListItem } from '../types'
import BaseButton from './common/BaseButton.vue'

const props = defineProps<{
  isOpen: boolean
  detail?: { software: Software | SoftwareListItem }
  defaultTheme?: 'classic' | 'dark' | 'gradient'
  defaultShowWebsite?: boolean
  defaultShowSystems?: boolean
}>()

const emit = defineEmits<{ 'update:isOpen': [value: boolean] }>()

const isOpen = computed({
  get: () => props.isOpen,
  set: (v: boolean) => emit('update:isOpen', v)
})

const theme = ref(props.defaultTheme ?? 'classic')
const showWebsite = ref(!!props.defaultShowWebsite)
const showSystems = ref(!!props.defaultShowSystems)
const closeButtonRef = ref<HTMLElement | null>(null)
const previousFocusedElement = ref<HTMLElement | null>(null)

const themeClass = computed(() => {
  if (theme.value === 'dark') return 'bg-[#121212] text-white'
  if (theme.value === 'gradient') return 'bg-gradient-to-br from-[#1f1f1f] via-[#181818] to-[#121212] text-white'
  return 'bg-[#f7f8f7] text-gray-900'
})

const previewRef = ref<HTMLElement | null>(null)
const exportRef = ref<HTMLElement | null>(null)
const { showToast } = useToast()

const handleDialogClose = () => {
  emit('update:isOpen', false)
}

const metaLine = computed(() => {
  if (!props.detail?.software) return ''
  const s = props.detail.software
  const base = `${s.category || '未分类'} · ${s.license || '未知'}`
  const sys = Array.isArray(s.systems) ? s.systems.join(' / ') : ''
  return showSystems.value && sys ? `${base} · ${sys}` : base
})

const ensureAssetsReady = async (el: HTMLElement) => {
  try {
    if ((document as any).fonts?.ready) await (document as any).fonts.ready
  } catch {}
  const imgs = Array.from(el.querySelectorAll('img')).filter(img => !img.complete)
  if (imgs.length) {
    await Promise.all(imgs.map(img => new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res() })))
  }
}

const onSave = async () => {
  const el = exportRef.value || previewRef.value
  if (!el) return

  const clipboardWritable = typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.write === 'function'
  const ClipboardItemCtor = typeof window !== 'undefined' ? (window as any).ClipboardItem : undefined

  if (!clipboardWritable || !ClipboardItemCtor) {
    showToast('当前环境不支持直接复制图片，请在安全环境下使用', 'error')
    return
  }

  await ensureAssetsReady(el)

  try {
    const blob = await toBlob(el, { cacheBust: true, pixelRatio: Math.max(2, window.devicePixelRatio || 1), style: { transform: 'none', zoom: '1' } as any })
    if (!blob) {
      showToast('生成图片失败，请重试', 'error')
      return
    }
    const item = new ClipboardItemCtor({ 'image/png': blob })
    await navigator.clipboard.write([item])
    showToast('已复制到剪贴板，可直接粘贴', 'success')
  } catch (err) {
    console.error('copy image failed', err)
    showToast('复制失败，请检查浏览器权限后重试', 'error')
  }
}

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      previousFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      closeButtonRef.value?.focus()
      return
    }
    const restoreTarget = previousFocusedElement.value
    if (restoreTarget) {
      nextTick(() => restoreTarget.focus())
    }
  }
)

onUnmounted(() => {
  const restoreTarget = previousFocusedElement.value
  if (restoreTarget) {
    restoreTarget.focus()
  }
})
</script>
