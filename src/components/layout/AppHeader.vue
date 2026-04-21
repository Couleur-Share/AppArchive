<template>
  <nav class="app-header-shell pt-safe sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300">
    <div class="container mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
      <!-- Logo部分 -->
      <div class="flex items-center">
        <img 
          src="/logo-header.svg"
          alt="AppArchive Logo" 
          class="h-10 w-auto sm:h-12 sm:w-auto max-w-[200px] sm:max-w-[280px] object-contain"
          height="48"
          loading="eager"
          decoding="async"
          fetchpriority="high"
        />
      </div>

      <!-- 右侧工具栏 -->
      <div class="flex items-center space-x-1.5 sm:space-x-4">
        <!-- 搜索框 - 桌面端显示完整搜索框 -->
        <div class="hidden sm:block">
          <SearchBar v-model="searchTerm" @clear="clearSearch" />
        </div>
        
        <!-- 搜索按钮 - 移动端显示图标按钮 -->
        <button
          type="button"
          @click="toggleMobileSearch"
          class="app-header-icon-btn touch-target sm:hidden p-2 rounded-lg"
          aria-label="打开搜索"
          :aria-expanded="showMobileSearch"
          aria-controls="app-header-mobile-search-panel"
        >
          <Search class="h-5 w-5" />
        </button>

        <router-link
          v-if="isSignedIn"
          to="/subscriptions"
          class="app-header-icon-btn app-header-shortcut hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg focus:outline-none"
          title="查看我的订阅"
          aria-label="查看我的订阅"
        >
          <Bell class="h-4 w-4 shrink-0" />
          <span class="hidden md:inline text-sm font-medium">我的订阅</span>
        </router-link>

        <!-- 按钮组：主题/刷新/设置（组内更紧凑） -->
        <div class="flex items-center space-x-0.5 sm:space-x-2">
          <!-- 主题切换按钮 -->
          <ThemeToggle
            :model-value="isDark"
            @update:model-value="$emit('update:isDark', $event)"
          />

          <!-- 刷新按钮 - 移动端隐藏 -->
          <button
            @click="handleRefresh"
            class="app-header-icon-btn hidden sm:block px-3 py-2 rounded-lg focus:outline-none"
            :class="{ 'animate-spin': isLoading }"
            title="刷新列表"
            aria-label="刷新列表"
          >
            <RotateCcw class="h-5 w-5" />
          </button>

          <!-- 设置按钮 - 移动端隐藏 -->
          <button
            @click="$emit('settings')"
            class="app-header-icon-btn hidden sm:block px-3 py-2 rounded-lg focus:outline-none"
            title="设置"
            aria-label="设置"
          >
            <Settings class="h-5 w-5" />
          </button>
        </div>

        <!-- 用户菜单 - 移动端隐藏 -->
        <div class="hidden sm:block">
          <UserMenu 
            :is-signed-in="isSignedIn"
            :user="user"
            @sign-in="openSignIn"
            @sign-out="handleSignOut"
            @change-password="$emit('change-password')"
          />
        </div>
      </div>
    </div>
    
    <!-- 移动端搜索栏 - 展开时显示 -->
    <div
      v-if="showMobileSearch"
      id="app-header-mobile-search-panel"
      class="app-header-mobile-panel sm:hidden px-3 pb-3 border-t"
    >
      <div class="relative mt-2">
        <input
          ref="mobileSearchInput"
          v-model="searchTerm"
          type="text"
          placeholder="搜索软件..."
          aria-label="搜索软件"
          class="app-header-search-input w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
          @keyup.enter="closeMobileSearch"
        />
        <button
          v-if="searchTerm"
          type="button"
          @click="clearSearch"
          class="app-header-search-clear touch-target absolute right-10 top-1/2 -translate-y-1/2 p-1"
          aria-label="清除搜索"
        >
          <XCircle class="h-4 w-4" />
        </button>
        <button
          type="button"
          @click="closeMobileSearch"
          class="app-header-search-clear touch-target absolute right-3 top-1/2 -translate-y-1/2 p-1"
          aria-label="关闭搜索"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { Bell, RotateCcw, Search, Settings, X, XCircle } from 'lucide-vue-next'
import { nextTick, onMounted, ref, watch } from 'vue'
import { useToast } from '../../composables/useToast'
import { logout, openLoginDialog } from '../../lib/auth'
import logger from '../../utils/logger'
import UserMenu from '../auth/UserMenu.vue'
import SearchBar from '../common/SearchBar.vue'
import ThemeToggle from '../common/ThemeToggle.vue'

const { showToast } = useToast()

const props = defineProps<{
  isSignedIn: boolean
  user: any
  isLoading: boolean
  isDark: boolean
}>()

const emit = defineEmits<{
  (e: 'update:isDark', value: boolean): void
  (e: 'refresh'): void
  (e: 'settings'): void
  (e: 'search', term: string): void
  (e: 'change-password'): void
}>()

const searchTerm = ref('')
const showMobileSearch = ref(false)
const mobileSearchInput = ref<HTMLInputElement | null>(null)

watch(searchTerm, (val) => {
  emit('search', val)
})

const clearSearch = () => {
  searchTerm.value = ''
  emit('search', '')
}

const toggleMobileSearch = () => {
  showMobileSearch.value = !showMobileSearch.value
  if (showMobileSearch.value) {
    nextTick(() => {
      mobileSearchInput.value?.focus()
    })
  }
}

const closeMobileSearch = () => {
  showMobileSearch.value = false
}

// 处理刷新
const handleRefresh = () => {
  emit('refresh')
}

// 处理登录
const openSignIn = () => {
  openLoginDialog()
}

// 处理退出登录
const handleSignOut = () => {
  logout()
  showToast('已退出登录', 'success')
}
</script> 

<style scoped>
.app-header-shell {
  position: sticky;
  border-color: color-mix(in srgb, var(--home-border) 82%, transparent);
  background: var(--app-header-shell-bg);
  box-shadow: var(--app-header-shadow);
}

.app-header-shell::before {
  content: '';
  position: absolute;
  inset: auto 0 -28px;
  height: 28px;
  background: var(--app-header-fade);
  pointer-events: none;
}

.app-header-shell::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 1px;
  background: var(--app-header-divider);
}

.app-header-icon-btn {
  color: var(--home-text);
  border: 1px solid transparent;
  background: transparent;
  transition:
    color 150ms var(--ease),
    background-color 150ms var(--ease),
    border-color 150ms var(--ease),
    box-shadow 150ms var(--ease);
}

.app-header-shortcut {
  border-color: color-mix(in srgb, var(--home-border) 82%, transparent);
  background: color-mix(in srgb, var(--home-surface-soft) 78%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.08);
}

.app-header-icon-btn:hover {
  color: var(--home-text-strong);
  background: var(--home-surface-hover);
  border-color: var(--home-border);
  box-shadow: 0 14px 28px -24px rgb(18 18 18 / 0.38);
}

.app-header-icon-btn:focus-visible {
  border-color: var(--home-accent-border);
  box-shadow: var(--home-focus-ring-soft);
}

.app-header-mobile-panel {
  border-color: var(--home-border);
  background: color-mix(in srgb, var(--home-surface) 72%, transparent);
}

.app-header-search-input {
  color: var(--home-text);
  background: var(--home-surface-soft);
  border: 1px solid color-mix(in srgb, var(--home-border) 82%, transparent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.18);
}

.app-header-search-input::placeholder {
  color: var(--home-text-muted);
}

.app-header-search-input:focus {
  outline: none;
  background: var(--home-surface-strong);
  border-color: var(--home-accent-border);
  box-shadow: var(--home-focus-ring-soft);
}

.app-header-search-clear {
  color: var(--home-text-muted);
  transition: color 150ms var(--ease);
}

.app-header-search-clear:hover {
  color: var(--home-text-strong);
}
</style>
