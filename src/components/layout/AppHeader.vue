<template>
  <nav class="app-header-shell sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-all duration-300">
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
          @click="toggleMobileSearch"
          class="app-header-icon-btn sm:hidden p-2 rounded-lg"
        >
          <Search class="h-5 w-5" />
        </button>

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
          >
            <RotateCcw class="h-5 w-5" />
          </button>

          <!-- 设置按钮 - 移动端隐藏 -->
          <button
            @click="$emit('settings')"
            class="app-header-icon-btn hidden sm:block px-3 py-2 rounded-lg focus:outline-none"
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
      class="app-header-mobile-panel sm:hidden px-3 pb-3 border-t"
    >
      <div class="relative mt-2">
        <input
          ref="mobileSearchInput"
          v-model="searchTerm"
          type="text"
          placeholder="搜索软件..."
          class="app-header-search-input w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-200"
          @keyup.enter="closeMobileSearch"
        />
        <button
          v-if="searchTerm"
          @click="clearSearch"
          class="app-header-search-clear absolute right-10 top-1/2 -translate-y-1/2"
        >
          <XCircle class="h-4 w-4" />
        </button>
        <button
          @click="closeMobileSearch"
          class="app-header-search-clear absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { RotateCcw, Search, Settings, X, XCircle } from 'lucide-vue-next'
import { nextTick, onMounted, ref, watch } from 'vue'
import { useToast } from '../../composables/useToast'
import { logout, openLoginDialog } from '../../lib/auth'
import logger from '../../utils/logger'
import UserMenu from '../auth/UserMenu.vue'
import SearchBar from '../common/SearchBar.vue'
import ThemeToggle from '../common/ThemeToggle.vue'

const { showToast } = useToast()

const titleText = '软件清单'

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
  border-color: var(--home-border);
  background: color-mix(in srgb, var(--home-surface) 92%, transparent);
  box-shadow:
    0 18px 40px -36px rgb(15 23 42 / 0.42),
    inset 0 1px 0 rgb(255 255 255 / 0.16);
}

.app-header-shell::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 1px;
  background:
    linear-gradient(90deg, transparent, rgb(0 220 130 / 0.22) 18%, rgb(0 220 130 / 0.42) 50%, transparent);
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

.app-header-icon-btn:hover {
  color: var(--home-text-strong);
  background: var(--home-surface-hover);
  border-color: var(--home-border);
  box-shadow: 0 14px 28px -24px rgb(15 23 42 / 0.38);
}

.app-header-icon-btn:focus-visible {
  border-color: var(--home-accent-border);
  box-shadow: 0 0 0 4px rgb(0 220 130 / 0.12);
}

.app-header-mobile-panel {
  border-color: var(--home-border);
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
  box-shadow:
    0 0 0 4px rgb(0 220 130 / 0.1),
    0 18px 30px -24px rgb(15 23 42 / 0.32);
}

.app-header-search-clear {
  color: var(--home-text-muted);
  transition: color 150ms var(--ease);
}

.app-header-search-clear:hover {
  color: var(--home-text-strong);
}
</style>
