<template>
  <Teleport to="body">
    <Transition name="account-sheet">
      <div
        v-if="show"
        class="fixed inset-0 z-[60] sm:hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-account-sheet-title"
      >
        <!-- 背景遮罩 -->
        <div
          class="absolute inset-0 app-modal-backdrop"
          @click="close"
        ></div>

        <!-- 底部面板 -->
        <div
          class="account-sheet__panel app-modal-panel absolute bottom-0 inset-x-0 rounded-t-2xl overflow-hidden pb-safe"
          @click.stop
        >
          <!-- 拖拽指示条 -->
          <div class="pt-2 pb-1 flex justify-center" aria-hidden="true">
            <div class="h-1 w-10 rounded-full account-sheet__handle"></div>
          </div>

          <!-- 用户信息卡 -->
          <div class="px-5 pt-3 pb-5 flex items-center gap-3 account-sheet__header">
            <div
              class="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-lg font-semibold select-none account-sheet__avatar"
            >
              <img
                v-if="user?.avatar"
                :src="user.avatar"
                alt=""
                class="w-full h-full object-cover"
              />
              <span v-else>{{ avatarInitial }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p id="mobile-account-sheet-title" class="text-base font-semibold truncate account-sheet__name">
                {{ user?.displayName || user?.username || '未登录' }}
              </p>
              <p v-if="user?.username" class="text-xs truncate account-sheet__sub">
                @{{ user.username }}
              </p>
            </div>
            <button
              type="button"
              class="touch-target p-2 rounded-lg account-sheet__close"
              aria-label="关闭"
              @click="close"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- 操作列表 -->
          <div class="px-3 pb-3 space-y-1">
            <button
              type="button"
              class="account-sheet__item touch-target w-full flex items-center gap-3 px-4 rounded-xl text-left"
              @click="handleRefresh"
              :disabled="isRefreshing"
            >
              <RotateCcw
                class="w-5 h-5 shrink-0"
                :class="{ 'animate-spin': isRefreshing }"
              />
              <span class="flex-1">刷新列表</span>
            </button>

            <button
              type="button"
              class="account-sheet__item touch-target w-full flex items-center gap-3 px-4 rounded-xl text-left"
              @click="handleSubscriptions"
            >
              <Bell class="w-5 h-5 shrink-0" />
              <span class="flex-1">我的订阅</span>
              <ChevronRight class="w-4 h-4 shrink-0 account-sheet__chevron" />
            </button>

            <button
              type="button"
              class="account-sheet__item touch-target w-full flex items-center gap-3 px-4 rounded-xl text-left"
              @click="handleChangePassword"
            >
              <KeyRound class="w-5 h-5 shrink-0" />
              <span class="flex-1">修改密码</span>
              <ChevronRight class="w-4 h-4 shrink-0 account-sheet__chevron" />
            </button>

            <button
              type="button"
              class="account-sheet__item touch-target w-full flex items-center gap-3 px-4 rounded-xl text-left"
              @click="handleAccountSettings"
            >
              <Settings class="w-5 h-5 shrink-0" />
              <span class="flex-1">账户设置</span>
              <ChevronRight class="w-4 h-4 shrink-0 account-sheet__chevron" />
            </button>

            <div class="h-px mx-2 my-1 account-sheet__divider"></div>

            <button
              type="button"
              class="account-sheet__item account-sheet__item--danger touch-target w-full flex items-center gap-3 px-4 rounded-xl text-left"
              @click="handleSignOut"
            >
              <LogOut class="w-5 h-5 shrink-0" />
              <span class="flex-1">退出登录</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  Bell,
  ChevronRight,
  KeyRound,
  LogOut,
  RotateCcw,
  Settings,
  X,
} from 'lucide-vue-next'
import { computed } from 'vue'
import type { AuthUser } from '../../lib/auth'

const props = defineProps<{
  show: boolean
  user: AuthUser | null
  isRefreshing?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'refresh'): void
  (e: 'subscriptions'): void
  (e: 'change-password'): void
  (e: 'account-settings'): void
  (e: 'sign-out'): void
}>()

const avatarInitial = computed(() => {
  const name = props.user?.displayName || props.user?.username || '?'
  return name.charAt(0).toUpperCase()
})

const close = () => emit('update:show', false)

const handleRefresh = () => {
  emit('refresh')
  // 刷新不关闭面板，让用户看到 spinner
}

const handleSubscriptions = () => {
  emit('subscriptions')
  close()
}

const handleChangePassword = () => {
  emit('change-password')
  close()
}

const handleAccountSettings = () => {
  emit('account-settings')
  close()
}

const handleSignOut = () => {
  emit('sign-out')
  close()
}
</script>

<style scoped>
.account-sheet__panel {
  /* 颜色/阴影继承自全局 .app-modal-panel；此处仅调整形状与边框表现 */
  border-left: none;
  border-right: none;
  border-bottom: none;
}


.account-sheet__handle {
  background: color-mix(in srgb, var(--home-text-muted) 40%, transparent);
}

.account-sheet__header {
  border-bottom: 1px solid var(--home-border);
}

.account-sheet__avatar {
  background: var(--theme-primary-500);
  color: rgb(18 18 18);
}

.account-sheet__name {
  color: var(--home-text-strong);
}

.account-sheet__sub {
  color: var(--home-text-muted);
}

.account-sheet__close {
  color: var(--home-text-muted);
  background: transparent;
  border: none;
  transition:
    color 150ms var(--ease),
    background-color 150ms var(--ease);
  -webkit-tap-highlight-color: transparent;
}

.account-sheet__close:active {
  background: var(--home-tab-hover);
  color: var(--home-text-strong);
}

.account-sheet__item {
  color: var(--home-text);
  background: transparent;
  border: none;
  padding-top: 12px;
  padding-bottom: 12px;
  font-size: 15px;
  transition:
    color 150ms var(--ease),
    background-color 150ms var(--ease);
  -webkit-tap-highlight-color: transparent;
}

.account-sheet__item:active {
  background: var(--home-tab-hover);
}

.account-sheet__item:disabled {
  opacity: 0.5;
}

.account-sheet__item--danger {
  color: #f3727f;
}

.account-sheet__item--danger:active {
  background: rgb(243 114 127 / 0.1);
}

.account-sheet__chevron {
  color: var(--home-text-subtle);
}

.account-sheet__divider {
  background: var(--home-border);
}

/* 入场/离场动画 */
.account-sheet-enter-active,
.account-sheet-leave-active {
  transition: opacity 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.account-sheet-enter-active .account-sheet__panel,
.account-sheet-leave-active .account-sheet__panel {
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.account-sheet-enter-from,
.account-sheet-leave-to {
  opacity: 0;
}

.account-sheet-enter-from .account-sheet__panel,
.account-sheet-leave-to .account-sheet__panel {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .account-sheet-enter-active,
  .account-sheet-leave-active,
  .account-sheet-enter-active .account-sheet__panel,
  .account-sheet-leave-active .account-sheet__panel {
    transition-duration: 120ms !important;
  }

  .account-sheet-enter-from .account-sheet__panel,
  .account-sheet-leave-to .account-sheet__panel {
    transform: none;
  }
}
</style>
