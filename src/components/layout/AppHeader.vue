<template>
  <nav class="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl transition-all duration-300">
    <div class="container mx-auto px-6 h-14 flex items-center justify-between">
      <!-- Logo部分 -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center">
          <img 
            src="/favicon-96x96.png"
            alt="Logo" 
            class="h-8 w-8 object-contain"
            width="32"
            height="32"
            loading="eager"
            decoding="async"
            fetchpriority="high"
          />
          <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-3 hidden sm:block"></div>
          <div class="ml-2 flex items-center gap-2">
            <h1 class="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
              软件清单
            </h1>
          </div>
        </div>
      </div>

      <!-- 右侧工具栏 -->
      <div class="flex items-center space-x-4">
        <!-- 搜索框 -->
        <SearchBar v-model="searchTerm" @clear="clearSearch" />

        <!-- 按钮组：主题/刷新/设置（组内更紧凑） -->
        <div class="flex items-center space-x-2">
          <!-- 主题切换按钮 -->
          <ThemeToggle
            :model-value="isDark"
            @update:model-value="$emit('update:isDark', $event)"
          />

          <!-- 刷新按钮 -->
          <button
            @click="handleRefresh"
            class="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100 focus:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-white/60 dark:ring-offset-gray-900/60"
            :class="{ 'animate-spin': isLoading }"
          >
            <RotateCcw class="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>

          <!-- 设置按钮 -->
          <button
            @click="$emit('settings')"
            class="px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-100 focus:outline-none focus-visible:ring-2 ring-offset-2 ring-offset-white/60 dark:ring-offset-gray-900/60"
          >
            <Settings class="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <!-- 用户菜单 -->
        <UserMenu 
          :is-signed-in="isSignedIn"
          :user="user"
          @sign-in="openSignIn"
          @sign-out="handleSignOut"
        />
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { RotateCcw, Settings } from 'lucide-vue-next'
import { nextTick, onMounted, ref, watch } from 'vue'
import { useToast } from '../../composables/useToast'
import { openSignIn as clerkOpenSignIn, signOut } from '../../lib/clerk'
import logger from '../../utils/logger'
import UserMenu from '../auth/UserMenu.vue'
import SearchBar from '../common/SearchBar.vue'
import ThemeToggle from '../common/ThemeToggle.vue'

// 使用 useToast 组合式函数
const { showToast } = useToast()

// 标题配置
const titleText = '软件清单'

// 定义组件的属性
const props = defineProps<{
  isSignedIn: boolean
  user: any
  isLoading: boolean
  isDark: boolean
}>()

// 定义组件的事件
const emit = defineEmits<{
  (e: 'update:isDark', value: boolean): void
  (e: 'refresh'): void
  (e: 'settings'): void
  (e: 'search', term: string): void
}>()

// 搜索相关
const searchTerm = ref('')

// 同步输入到父组件进行过滤
watch(searchTerm, (val) => {
  emit('search', val)
})

// 清除搜索
const clearSearch = () => {
  searchTerm.value = ''
  emit('search', '')
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