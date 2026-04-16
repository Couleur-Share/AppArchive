<template>
  <div class="space-y-6">

    <!-- ====== 安装包链接 ====== -->
    <section class="space-y-3">
      <div class="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700/50">
        <Download class="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">安装包链接</h4>
        <span class="text-xs text-gray-400 dark:text-gray-500">仅自己可见</span>
      </div>

      <!-- 空状态 -->
      <div v-if="localLinks.length === 0" class="py-5 flex flex-col items-center gap-1.5">
        <Package class="w-7 h-7 text-gray-300 dark:text-gray-600" />
        <p class="text-xs text-gray-400 dark:text-gray-500">添加百度网盘、蓝奏云等下载链接</p>
      </div>

      <!-- 链接卡片列表 -->
      <div
        v-for="(link, idx) in localLinks"
        :key="link.id"
        class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 space-y-3 transition-colors hover:border-gray-300 dark:hover:border-gray-600"
      >
        <!-- URL + provider反馈 -->
        <div>
          <input
            :value="link.url"
            :disabled="disabled"
            @input="onLinkUrlChange(idx, ($event.target as HTMLInputElement).value)"
            @blur="emit('validate')"
            :aria-invalid="Boolean(fieldErrors[`download_links.${idx}.url`])"
            :aria-describedby="fieldErrors[`download_links.${idx}.url`] ? `dl-url-${idx}-error` : undefined"
            placeholder="粘贴链接，如 https://pan.baidu.com/s/xxxx 或官方直链"
            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <div
            v-if="fieldErrors[`download_links.${idx}.url`] || (link.url && link.provider && link.provider !== 'other')"
            class="mt-1.5 flex items-center gap-2"
          >
            <span
              v-if="fieldErrors[`download_links.${idx}.url`]"
              :id="`dl-url-${idx}-error`"
              class="text-xs text-red-500"
            >{{ fieldErrors[`download_links.${idx}.url`] }}</span>
            <TagBadge
              v-if="link.url && link.provider && link.provider !== 'other'"
              size="xs"
              :variant="getProviderBadgeVariant(link.provider)"
            >
              {{ PROVIDER_LABELS[link.provider] || link.provider }}
            </TagBadge>
          </div>
        </div>

        <!-- 提取码 / 密码 / 版本 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            v-model="localLinks[idx].code"
            :disabled="disabled"
            placeholder="提取码（可选）"
            class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <input
            v-model="localLinks[idx].password"
            :disabled="disabled"
            placeholder="解压密码（可选）"
            class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <input
            v-model="localLinks[idx].versionLabel"
            :disabled="disabled"
            placeholder="版本说明（如 v1.2.3 便携/破解版）"
            class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <!-- 备注 -->
        <input
          v-model="localLinks[idx].notes"
          :disabled="disabled"
          placeholder="备注（可选）"
          class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />

        <!-- 操作按钮 -->
        <div class="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            :disabled="disabled"
            @click="copyShareText(link)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <Copy class="w-3.5 h-3.5" />
            复制分享文本
          </button>
          <button
            type="button"
            :disabled="disabled"
            @click="removeDownloadLink(idx)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 class="w-3.5 h-3.5" />
            删除
          </button>
        </div>
      </div>

      <!-- 添加链接按钮 -->
      <button
        type="button"
        :disabled="disabled"
        @click="addDownloadLink"
        class="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all flex items-center justify-center gap-2 text-sm"
      >
        <Plus class="w-4 h-4" />
        <span>添加一个链接</span>
      </button>

      <p class="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
        支持：百度网盘、夸克网盘、蓝奏云、阿里云盘、115网盘、磁力链接（magnet）、ED2K、电驴、以及官方直链。
      </p>
    </section>

    <!-- ====== 私密信息 ====== -->
    <section class="space-y-3">
      <div class="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700/50">
        <KeyRound class="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">私密信息</h4>
        <span class="text-xs text-gray-400 dark:text-gray-500">仅自己可见</span>
      </div>

      <!-- 空状态 -->
      <div v-if="localSecrets.length === 0" class="py-5 flex flex-col items-center gap-1.5">
        <Shield class="w-7 h-7 text-gray-300 dark:text-gray-600" />
        <p class="text-xs text-gray-400 dark:text-gray-500">添加激活码、账号等私密信息</p>
      </div>

      <!-- 私密信息卡片 -->
      <div
        v-for="(sec, idx) in localSecrets"
        :key="sec.id"
        class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 space-y-3 transition-colors hover:border-gray-300 dark:hover:border-gray-600"
      >
        <!-- 类型 + 值 + 删除 -->
        <div class="flex items-start gap-2">
          <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
            <div class="flex items-center gap-2">
              <select
                v-model="localSecrets[idx].kind"
                :disabled="disabled"
                class="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="license">激活码</option>
                <option value="account">账号</option>
                <option value="config">配置</option>
                <option value="other">其他</option>
              </select>
              <TagBadge
                size="xs"
                radius="full"
                :variant="getSecretKindVariant(localSecrets[idx].kind)"
              >
                {{ getSecretKindLabel(localSecrets[idx].kind) }}
              </TagBadge>
            </div>
            <input
              v-model="(localSecrets[idx] as any).value"
              :disabled="disabled"
              placeholder="值（新增必填；已有项留空=不修改）"
              class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <IconButton
            size="xs"
            variant="danger"
            :disabled="disabled"
            @click="removeSecret(idx)"
            title="删除"
            class="mt-1.5"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </IconButton>
        </div>

        <!-- 校验错误 -->
        <div
          v-if="fieldErrors[`secrets.${idx}.value`]"
          :id="`sec-val-${idx}-error`"
          class="text-xs text-red-500"
        >{{ fieldErrors[`secrets.${idx}.value`] }}</div>

        <!-- 到期时间 + 备注 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            v-model="localSecrets[idx].expiresAt"
            :disabled="disabled"
            type="date"
            placeholder="到期时间（可选）"
            class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <input
            v-model="localSecrets[idx].notes"
            :disabled="disabled"
            placeholder="备注（可选）"
            class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <!-- 添加按钮 -->
      <button
        type="button"
        :disabled="disabled"
        @click="addSecret"
        class="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary transition-all flex items-center justify-center gap-2 text-sm"
      >
        <Plus class="w-4 h-4" />
        <span>添加一条私密信息</span>
      </button>

      <p class="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
        新增条目必须填写值；已有条目留空表示不修改。私密信息仅会在服务端加密保存，前端不缓存明文。
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  Copy,
  Download,
  KeyRound,
  Package,
  Plus,
  Shield,
  Trash2,
} from 'lucide-vue-next'
import { nextTick, ref, watch } from 'vue'
import TagBadge from '@/components/common/TagBadge.vue'
import IconButton from '@/components/common/IconButton.vue'
import type { DownloadLink, SecretItem } from '@/types'
import { copyToClipboard } from '@/utils/clipboard'
import { getSecretKindLabel } from '@/utils/secret'

const PROVIDER_LABELS: Record<string, string> = {
  baidu: '百度网盘',
  quark: '夸克网盘',
  lanzou: '蓝奏云',
  aliyun: '阿里云盘',
  '115': '115网盘',
  magnet: '磁力链接',
  ed2k: 'ED2K',
  official: '官方直链',
}

const getProviderBadgeVariant = (provider: string) => {
  switch (provider) {
    case 'official': return 'success' as const
    case 'magnet': case 'ed2k': return 'warning' as const
    default: return 'info' as const
  }
}

const props = defineProps<{
  downloadLinks: DownloadLink[] | undefined
  secrets: SecretItem[] | undefined
  fieldErrors: Record<string, string>
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:downloadLinks': [value: DownloadLink[]]
  'update:secrets': [value: SecretItem[]]
  'validate': []
}>()

const localLinks = ref<DownloadLink[]>(Array.isArray(props.downloadLinks) ? [...props.downloadLinks] : [])
const localSecrets = ref<SecretItem[]>(Array.isArray(props.secrets) ? [...props.secrets] : [])

const syncingLinks = ref(false)
const syncingSecrets = ref(false)

watch(() => props.downloadLinks, async (v) => {
  syncingLinks.value = true
  localLinks.value = Array.isArray(v) ? [...v] : []
  await nextTick()
  syncingLinks.value = false
})
watch(() => props.secrets, async (v) => {
  syncingSecrets.value = true
  localSecrets.value = Array.isArray(v) ? [...v] : []
  await nextTick()
  syncingSecrets.value = false
})

watch(localSecrets, (v) => {
  if (syncingSecrets.value) return
  emit('update:secrets', [...v])
  emit('validate')
}, { deep: true })

watch(localLinks, (v) => {
  if (syncingLinks.value) return
  emit('update:downloadLinks', [...v])
  emit('validate')
}, { deep: true })

const detectProvider = (url: string): DownloadLink['provider'] => {
  const u = (url || '').toLowerCase()
  if (u.includes('pan.baidu.com')) return 'baidu'
  if (u.includes('quark') || u.includes('pan.quark.cn')) return 'quark'
  if (u.includes('lanzou') || u.includes('lanzoui') || u.includes('lanzoux')) return 'lanzou'
  if (u.includes('aliyundrive.com') || u.includes('alipan.com')) return 'aliyun'
  if (u.includes('115.com')) return '115'
  if (u.startsWith('magnet:?')) return 'magnet'
  if (u.startsWith('ed2k://')) return 'ed2k'
  if (u.includes('://') && !u.includes('pan.')) return 'official'
  return 'other'
}

const addDownloadLink = () => {
  const link: DownloadLink = {
    id: (globalThis.crypto && 'randomUUID' in globalThis.crypto) ? globalThis.crypto.randomUUID() : String(Date.now()),
    provider: 'other',
    url: '',
    status: 'unknown',
    createdAt: new Date().toISOString()
  }
  localLinks.value = [...localLinks.value, link]
  emit('update:downloadLinks', localLinks.value)
}

const removeDownloadLink = (idx: number) => {
  const next = [...localLinks.value]
  next.splice(idx, 1)
  localLinks.value = next
  emit('update:downloadLinks', next)
  emit('validate')
}

const onLinkUrlChange = (idx: number, url: string) => {
  const item = localLinks.value[idx]
  if (!item) return
  item.url = url
  item.provider = detectProvider(url.trim())
  emit('update:downloadLinks', [...localLinks.value])
  emit('validate')
}

const buildShareText = (link: DownloadLink) => {
  const parts: string[] = [`链接：${link.url}`]
  if (link.code) parts.push(`提取码：${link.code}`)
  if (link.password) parts.push(`解压密码：${link.password}`)
  if (link.versionLabel) parts.push(`版本：${link.versionLabel}`)
  if (link.notes) parts.push(`备注：${link.notes}`)
  return parts.join('  ')
}

const copyShareText = async (link: DownloadLink) => {
  try {
    await copyToClipboard(buildShareText(link))
  } catch {}
}

const addSecret = () => {
  const item: SecretItem = {
    id: (globalThis.crypto && 'randomUUID' in globalThis.crypto) ? globalThis.crypto.randomUUID() : String(Date.now()),
    kind: 'other',
    label: '',
    createdAt: new Date().toISOString(),
    notes: ''
  }
  localSecrets.value = [...localSecrets.value, item]
  emit('update:secrets', localSecrets.value)
}

const removeSecret = (idx: number) => {
  const next = [...localSecrets.value]
  next.splice(idx, 1)
  localSecrets.value = next
  emit('update:secrets', next)
  emit('validate')
}

const getSecretKindVariant = (kind?: string) => {
  switch (kind) {
    case 'license': return 'primary' as const
    case 'account': return 'warning' as const
    case 'config': return 'info' as const
    default: return 'neutral' as const
  }
}
</script>
