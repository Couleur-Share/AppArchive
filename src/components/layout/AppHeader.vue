<template>
  <nav class="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl transition-all duration-300">
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
          class="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100"
        >
          <Search class="h-5 w-5 text-gray-700 dark:text-gray-300" />
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
            class="hidden sm:block px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100 focus:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-white/60 dark:ring-offset-gray-900/60"
            :class="{ 'animate-spin': isLoading }"
          >
            <RotateCcw class="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>

          <!-- 设置按钮 - 移动端隐藏 -->
          <button
            @click="$emit('settings')"
            class="hidden sm:block px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100 focus:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-white/60 dark:ring-offset-gray-900/60"
          >
            <Settings class="h-5 w-5 text-gray-700 dark:text-gray-300" />
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
      class="sm:hidden px-3 pb-3 border-t border-gray-200/50 dark:border-gray-800/50"
    >
      <div class="relative mt-2">
        <input
          ref="mobileSearchInput"
          v-model="searchTerm"
          type="text"
          placeholder="搜索软件..."
          class="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 border border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
          @keyup.enter="closeMobileSearch"
        />
        <button
          v-if="searchTerm"
          @click="clearSearch"
          class="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <XCircle class="h-4 w-4" />
        </button>
        <button
          @click="closeMobileSearch"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
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