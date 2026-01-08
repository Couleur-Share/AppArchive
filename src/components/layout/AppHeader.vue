<template>
  <nav class="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl transition-all duration-300">
    <div class="container mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
      <!-- Logo部分 -->
      <div class="flex items-center space-x-2 sm:space-x-4">
        <div class="flex items-center">
          <img 
            src="/favicon-96x96.png"
            alt="Logo" 
            class="h-7 w-7 sm:h-8 sm:w-8 object-contain"
            width="32"
            height="32"
            loading="eager"
            decoding="async"
            fetchpriority="high"
          />
          <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2 sm:mx-3 hidden sm:block"></div>
          <div class="ml-1.5 sm:ml-2 flex items-center gap-2">
            <h1 class="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              软件清单
            </h1>
          </div>
        </div>
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
import { openSignIn as clerkOpenSignIn, signOut } from '../../lib/clerk'
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
const openSignIn = async () => {
  try {
    await clerkOpenSignIn()
  } catch (error) {
    showToast('登录失败', 'error')
    logger.error('登录错误:', error)
  }
}

// 处理退出登录
const handleSignOut = async () => {
  try {
    await signOut()
    showToast('已退出登录', 'success')
  } catch (error) {
    showToast('退出登录失败', 'error')
    logger.error('退出登录错误:', error)
  }
}
</script> 