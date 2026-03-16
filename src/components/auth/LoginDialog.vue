<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-[100]" @close="handleClose">
      <!-- 遮罩层 -->
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      </TransitionChild>

      <!-- 弹窗容器 -->
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95 translate-y-4"
            enter-to="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100 translate-y-0"
            leave-to="opacity-0 scale-95 translate-y-4"
          >
            <DialogPanel
              class="w-full max-w-sm transform overflow-hidden rounded-2xl
                     bg-white dark:bg-gray-900
                     border border-gray-200/60 dark:border-gray-700/40
                     shadow-xl shadow-black/10 dark:shadow-black/30
                     transition-all"
            >
              <!-- 头部 -->
              <div class="px-6 pt-6 pb-2">
                <div class="flex items-center justify-between mb-1">
                  <DialogTitle class="text-lg font-semibold text-gray-900 dark:text-white">
                    登录
                  </DialogTitle>
                  <button
                    @click="handleClose"
                    class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                           hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  请输入账号密码以继续操作
                </p>
              </div>

              <!-- 表单 -->
              <form @submit.prevent="handleLogin" class="px-6 pb-6 pt-4 space-y-4">
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

                <!-- 用户名 -->
                <div>
                  <label for="login-username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    用户名
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon class="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      id="login-username"
                      ref="usernameInput"
                      v-model="username"
                      type="text"
                      autocomplete="username"
                      required
                      :disabled="isLoading"
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
                      placeholder="请输入用户名"
                    />
                  </div>
                </div>

                <!-- 密码 -->
                <div>
                  <label for="login-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    密码
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock class="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      id="login-password"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      autocomplete="current-password"
                      required
                      :disabled="isLoading"
                      class="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm
                             bg-gray-50 dark:bg-gray-800
                             border border-gray-200 dark:border-gray-700
                             text-gray-900 dark:text-white
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:bg-white dark:focus:bg-gray-900
                             focus:border-blue-500 dark:focus:border-blue-500
                             focus:ring-2 focus:ring-blue-500/20
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200"
                      placeholder="请输入密码"
                    />
                    <button
                      type="button"
                      @click="showPassword = !showPassword"
                      class="absolute inset-y-0 right-0 pr-3 flex items-center
                             text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      tabindex="-1"
                    >
                      <EyeOff v-if="showPassword" class="w-4 h-4" />
                      <Eye v-else class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- 登录按钮 -->
                <button
                  type="submit"
                  :disabled="isLoading || !username || !password"
                  class="w-full py-2.5 px-4 rounded-xl text-sm font-medium
                         text-white bg-blue-500 hover:bg-blue-600
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2
                         focus:ring-offset-white dark:focus:ring-offset-gray-900
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200
                         flex items-center justify-center gap-2"
                >
                  <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
                  <LogIn v-else class="w-4 h-4" />
                  <span>{{ isLoading ? '登录中...' : '登录' }}</span>
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
import { AlertCircle, Eye, EyeOff, Loader2, Lock, LogIn, User as UserIcon, X } from 'lucide-vue-next'
import { nextTick, ref, watch } from 'vue'
import { closeLoginDialog, login } from '../../lib/auth'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'success'): void
}>()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const usernameInput = ref<HTMLInputElement | null>(null)

const resetForm = () => {
  username.value = ''
  password.value = ''
  showPassword.value = false
  errorMessage.value = ''
  isLoading.value = false
}

const handleClose = () => {
  if (isLoading.value) return
  resetForm()
  closeLoginDialog()
}

const handleLogin = async () => {
  if (!username.value || !password.value) return
  errorMessage.value = ''
  isLoading.value = true

  try {
    await login(username.value, password.value)
    resetForm()
    closeLoginDialog()
    emit('success')
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : '登录失败，请重试'
  } finally {
    isLoading.value = false
  }
}

watch(() => props.isOpen, (open) => {
  if (open) {
    nextTick(() => usernameInput.value?.focus())
  }
})
</script>
