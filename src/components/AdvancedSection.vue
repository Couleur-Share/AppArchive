<template>
  <div>
    <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">安装包链接（仅自己可见）</label>

    <div v-for="(link, idx) in localLinks" :key="link.id" class="mb-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
      <!-- URL -->
      <input
        :value="link.url"
        :disabled="disabled"
        @input="onLinkUrlChange(idx, ($event.target as HTMLInputElement).value)"
        @blur="emit('validate')"
        :aria-invalid="Boolean(fieldErrors[`download_links.${idx}.url`])"
        :aria-describedby="fieldErrors[`download_links.${idx}.url`] ? `dl-url-${idx}-error` : undefined"
        placeholder="粘贴链接，如 https://pan.baidu.com/s/xxxx 或官方直链"
        class="w-full mb-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
      />
      <div v-if="fieldErrors[`download_links.${idx}.url`]" :id="`dl-url-${idx}-error`" class="-mt-1 mb-2 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle class="w-3.5 h-3.5" />
        <span>{{ fieldErrors[`download_links.${idx}.url`] }}</span>
      </div>
      <!-- 提取码/密码/版本说明 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <input v-model="localLinks[idx].code" :disabled="disabled" placeholder="提取码（可选）" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100" />
        <input v-model="localLinks[idx].password" :disabled="disabled" placeholder="解压密码（可选）" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100" />
        <input v-model="localLinks[idx].versionLabel" :disabled="disabled" placeholder="版本说明（如 v1.2.3 便携/破解版）" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100" />
      </div>
      <!-- 备注 -->
      <input v-model="localLinks[idx].notes" :disabled="disabled" placeholder="备注（可选）" class="w-full mb-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100" />
      <!-- 操作 -->
      <div class="mt-2 flex gap-2">
        <button type="button" class="px-3 py-2 rounded-lg border text-gray-700 dark:text-gray-100" :disabled="disabled" @click="copyShareText(link)">复制分享文本</button>
        <button type="button" class="px-3 py-2 rounded-lg border border-red-300 text-red-500 dark:text-red-300" :disabled="disabled" @click="removeDownloadLink(idx)">删除</button>
      </div>
    </div>

    <button type="button" class="w-full px-4 py-2 border border-dashed rounded-lg text-gray-500 dark:text-gray-400" :disabled="disabled" @click="addDownloadLink">+ 添加一个链接</button>
    <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
      支持：百度网盘、夸克网盘、蓝奏云、阿里云盘、115网盘、磁力链接（magnet）、ED2K、电驴、以及官方直链（保存为私密，仅自己可见）。
    </div>

    <div class="mt-6">
      <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">私密信息（仅自己可见）</label>
      <div v-for="(sec, idx) in localSecrets" :key="sec.id" class="mb-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <select v-model="localSecrets[idx].kind" :disabled="disabled" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100">
            <option value="license">激活码</option>
            <option value="account">账号</option>
            <option value="config">配置</option>
            <option value="other">其他</option>
          </select>
          <div class="flex items-center">
            <span class="text-xs text-gray-600 dark:text-gray-400">类型预览：</span>
            <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs" :class="getSecretKindClass(localSecrets[idx].kind)">{{ getSecretKindLabel(localSecrets[idx].kind) }}</span>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <input v-model="(localSecrets[idx] as any).value" :disabled="disabled" placeholder="值（新增必填；已有项留空=不修改）" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100" />
          <input v-model="localSecrets[idx].expiresAt" :disabled="disabled" type="date" placeholder="到期时间（可选）" class="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100" />
        </div>
        <div v-if="fieldErrors[`secrets.${idx}.value`]" :id="`sec-val-${idx}-error`" class="-mt-1 mb-2 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle class="w-3.5 h-3.5" />
          <span>{{ fieldErrors[`secrets.${idx}.value`] }}</span>
        </div>
        <input v-model="localSecrets[idx].notes" :disabled="disabled" placeholder="备注（可选）" class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 mb-2" />
        <div class="flex gap-2">
          <button type="button" class="px-3 py-2 rounded-lg border border-red-300 text-red-500 dark:text-red-300" :disabled="disabled" @click="removeSecret(idx)">删除</button>
        </div>
      </div>
      <button type="button" class="w-full px-4 py-2 border border-dashed rounded-lg text-gray-500 dark:text-gray-400" :disabled="disabled" @click="addSecret">+ 添加一条私密信息</button>
      <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">提示：新增条目必须填写值；已有条目留空表示不修改。私密信息仅会在服务端加密保存，前端不缓存明文。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import type { DownloadLink, SecretItem } from '@/types'
import { getSecretKindClass, getSecretKindLabel } from '@/utils/secret'
import { copyToClipboard } from '@/utils/clipboard'

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

// 避免父 -> 子同步时触发子级的变更回传
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

// 监听本地 secrets 的任何字段变更，自动向父组件回传
watch(localSecrets, (v) => {
  if (syncingSecrets.value) return
  emit('update:secrets', [...v])
  emit('validate')
}, { deep: true })

// 监听本地 download_links 的任何字段变更，自动回传
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

// 清空某条私密值：置为 null，以便后端识别为“删除密文”
const clearSecretValue = (idx: number) => {
  const target = localSecrets.value[idx] as any
  if (!target) return
  target.value = null
  emit('update:secrets', [...localSecrets.value])
  emit('validate')
}
</script>

<style scoped>
</style>


