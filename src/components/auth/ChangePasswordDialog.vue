<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-[100]" @close="handleClose">
      <TransitionChild
        as="template"
        enter="ease-[cubic-bezier(0.22,1,0.36,1)] duration-250"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-180"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 app-modal-backdrop" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-[cubic-bezier(0.22,1,0.36,1)] duration-280"
            enter-from="opacity-0 scale-95 translate-y-4"
            enter-to="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-180"
            leave-from="opacity-100 scale-100 translate-y-0"
            leave-to="opacity-0 scale-95 translate-y-4"
          >
            <DialogPanel
              class="w-full max-w-sm transform overflow-hidden rounded-2xl
                     app-modal-panel app-modal-panel--interactive
                     shadow-xl shadow-black/10 dark:shadow-black/30
                     transition-all max-h-[min(92dvh,720px)] overflow-y-auto"
            >
              <div class="px-6 pt-6 pb-2">
                <div class="flex items-center justify-between mb-1">
                  <DialogTitle class="text-lg font-semibold text-gray-900 dark:text-white">
                    修改密码
                  </DialogTitle>
                  <button
                    type="button"
                    @click="handleClose"
                    class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                           hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150
                           app-modal-close-btn"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  请输入旧密码和新密码
                </p>
              </div>

              <form @submit.prevent="handleSubmit" class="px-6 pb-6 pt-4 space-y-4">
                <!-- 成功提示 -->
                <div
                  v-if="successMessage"
                  class="flex items-center gap-2 px-3 py-2.5 rounded-xl
                         bg-green-50 dark:bg-green-950/30
                         border border-green-200 dark:border-green-800/40
                         text-sm text-green-600 dark:text-green-400"
                >
                  <Check class="w-4 h-4 shrink-0" />
                  <span>{{ successMessage }}</span>
                </div>

                <!-- 错误提示 -->
                <div
                  v-if="errorMessage"
                  class="flex items-center gap-2 px-3 py-2.5 rounded-xl
                         bg-red-50 dark:bg-red-950/30
                         border border-red-200 dark:border-red-800/40
                         text-sm text-red-600 dark:text-red-400"
                >
                  <AlertCircle class="w-4 h-4 shrink-0" />
                  <span>{{ errorMessage }}</span>
                </div>

                <!-- 旧密码 -->
                <div>
                  <label for="old-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    当前密码
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock class="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      id="old-password"
                      ref="oldPasswordInput"
                      v-model="oldPassword"
                      type="password"
                      autocomplete="current-password"
                      required
                      :disabled="isLoading || !!successMessage"
                      class="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm
                             bg-gray-50 dark:bg-gray-800
                             border border-gray-200 dark:border-gray-700
                             text-gray-900 dark:text-white
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:bg-white dark:focus:bg-gray-900
                             focus:border-blue-500 dark:focus:border-blue-500
                             focus:ring-2 focus:ring-blue-500/20
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200"
                      placeholder="请输入当前密码"
                    />
                  </div>
                </div>

                <!-- 新密码 -->
                <div>
                  <label for="new-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    新密码
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound class="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      id="new-password"
                      v-model="newPassword"
                      type="password"
                      autocomplete="new-password"
                      required
                      :disabled="isLoading || !!successMessage"
                      class="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm
                             bg-gray-50 dark:bg-gray-800
                             border border-gray-200 dark:border-gray-700
                             text-gray-900 dark:text-white
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:bg-white dark:focus:bg-gray-900
                             focus:border-blue-500 dark:focus:border-blue-500
                             focus:ring-2 focus:ring-blue-500/20
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200"
                      placeholder="至少 6 位"
                    />
                  </div>
                </div>

                <!-- 确认新密码 -->
                <div>
                  <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    确认新密码
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound class="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      id="confirm-password"
                      v-model="confirmPassword"
                      type="password"
                      autocomplete="new-password"
                      required
                      :disabled="isLoading || !!successMessage"
                      class="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm
                             bg-gray-50 dark:bg-gray-800
                             border border-gray-200 dark:border-gray-700
                             text-gray-900 dark:text-white
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:bg-white dark:focus:bg-gray-900
                             focus:border-blue-500 dark:focus:border-blue-500
                             focus:ring-2 focus:ring-blue-500/20
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200"
                      placeholder="再次输入新密码"
                    />
                  </div>
                </div>

                <!-- 按钮 -->
                <button
                  v-if="!successMessage"
                  type="submit"
                  :disabled="isLoading || !oldPassword || !newPassword || !confirmPassword"
                  class="w-full py-2.5 px-4 rounded-xl text-sm font-medium
                         text-white bg-blue-500 hover:bg-blue-600
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2
                         focus:ring-offset-white dark:focus:ring-offset-gray-900
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200
                         flex items-center justify-center gap-2"
                >
                  <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
                  <span>{{ isLoading ? '提交中...' : '确认修改' }}</span>
                </button>

                <button
                  v-else
                  type="button"
                  @click="handleClose"
                  class="w-full py-2.5 px-4 rounded-xl text-sm font-medium
                         text-gray-700 dark:text-gray-200
                         bg-gray-100 dark:bg-gray-800
                         hover:bg-gray-200 dark:hover:bg-gray-700
                         transition-all duration-200"
                >
                  关闭
                </button>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { AlertCircle, Check, KeyRound, Loader2, Lock, X } from 'lucide-vue-next'
import { nextTick, ref, watch } from 'vue'
import { changePassword, closePasswordDialog } from '../../lib/auth'

const props = defineProps<{
  isOpen: boolean
}>()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const oldPasswordInput = ref<HTMLInputElement | null>(null)

const resetForm = () => {
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = false
}

const handleClose = () => {
  if (isLoading.value) return
  resetForm()
  closePasswordDialog()
}

const handleSubmit = async () => {
  errorMessage.value = ''

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的新密码不一致'
    return
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = '新密码长度不能少于 6 位'
    return
  }

  if (oldPassword.value === newPassword.value) {
    errorMessage.value = '新密码不能与旧密码相同'
    return
  }

  isLoading.value = true

  try {
    await changePassword(oldPassword.value, newPassword.value)
    successMessage.value = '密码修改成功'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '修改密码失败，请重试'
  } finally {
    isLoading.value = false
  }
}

watch(() => props.isOpen, (open) => {
  if (open) {
    resetForm()
    nextTick(() => oldPasswordInput.value?.focus())
  }
})
</script>
