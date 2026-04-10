<template>
  <article class="group relative">
    <!-- 卡片主体 -->
    <div
      class="card-body h-full flex flex-col p-5 rounded-2xl cursor-pointer
             bg-white dark:bg-gray-900 
             border border-gray-200 dark:border-gray-800
             hover:border-emerald-500/50 dark:hover:border-emerald-500/50
             shadow-sm hover:shadow-xl hover:shadow-emerald-500/10
             transform-gpu"
      @click="$emit('click', software)"
    >
      <!-- 顶部信息区 -->
      <div class="flex items-start gap-4 mb-4">
        <!-- 软件图标 (内嵌式) -->
        <div 
          class="icon-container w-14 h-14 rounded-xl overflow-hidden flex-shrink-0
                 bg-gray-50 dark:bg-gray-800
                 border border-gray-100 dark:border-gray-700
                 shadow-sm group-hover:shadow-md">
          <img
            :src="iconUrl"
            :alt="software.name"
            width="56"
            height="56"
            class="icon-image w-full h-full object-cover"
            :class="{ 'icon-loaded': imageLoaded }"
            loading="lazy"
            referrerpolicy="origin"
            @load="handleImageLoad"
            @error="handleImageError"
          />
        </div>

        <div class="flex-1 min-w-0 pt-1">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-base font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-500 transition-colors duration-200">
              {{ software.name }}
            </h3>
            
            <!-- 更多操作 -->
            <Menu as="div" class="relative">
              <MenuButton
                @click.stop
                class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                <MoreVertical class="w-4 h-4" />
              </MenuButton>
              <transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <MenuItems @click.stop class="absolute right-0 mt-2 w-40 origin-top-right rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 focus:outline-none z-50 overflow-hidden">
                  <div class="p-1">
                    <MenuItem v-if="software.website" v-slot="{ active }">
                      <button @click.stop="openSoftwareUrl" :class="[active ? 'bg-gray-50 dark:bg-gray-700/50 text-emerald-500' : 'text-gray-700 dark:text-gray-300', 'w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-lg transition-colors duration-150']">
                        <ArrowUpRight class="w-4 h-4" />
                        <span>访问官网</span>
                      </button>
                    </MenuItem>
                    <div v-if="software.website && canEdit" class="my-1 h-px bg-gray-100 dark:bg-gray-700"></div>
                    <MenuItem v-if="canEdit" v-slot="{ active }">
                      <button @click.stop="$emit('edit', software)" :class="[active ? 'bg-gray-50 dark:bg-gray-700/50 text-emerald-500' : 'text-gray-700 dark:text-gray-300', 'w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-lg transition-colors duration-150']">
                        <Edit class="w-4 h-4" />
                        <span>编辑</span>
                      </button>
                    </MenuItem>
                    <MenuItem v-if="canEdit" v-slot="{ active }">
                      <button @click.stop="$emit('delete', software.id)" :class="[active ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'text-gray-600 dark:text-gray-400', 'w-full text-left px-3 py-2 text-sm flex items-center gap-2 rounded-lg transition-colors duration-150']">
                        <Trash class="w-4 h-4" />
                        <span>删除</span>
                      </button>
                    </MenuItem>
                  </div>
                </MenuItems>
              </transition>
            </Menu>
          </div>
          
          <div class="flex flex-wrap gap-2 mt-2">
            <TagBadge size="xs" variant="neutral" strong class="uppercase tracking-wider">
              {{ software.category }}
            </TagBadge>
            <TagBadge
              size="xs"
              strong
              class="uppercase tracking-wider"
              :variant="getLicenseVariant(software.license)"
            >
              {{ software.license }}
            </TagBadge>
          </div>
        </div>
      </div>

      <!-- 描述文本 -->
      <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-4 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-200">
        {{ software.description }}
      </p>

      <!-- 底部系统支持 -->
      <div class="mt-auto flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
        <div class="flex items-center gap-1.5">
          <template v-for="system in software.systems" :key="system">
            <div class="flex items-center justify-center w-6 h-6 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500" :title="system">
              <SystemIcon :system="system" class="w-3.5 h-3.5" />
            </div>
          </template>
        </div>
        <div class="text-[10px] font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
          了解更多 <ArrowUpRight class="w-3 h-3" />
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ArrowUpRight, Edit, MoreVertical, Trash } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { isSignedIn } from '../lib/auth'
import { getErrorPlaceholder, getIconUrl, preloadIcon } from '../services/localIconCache'
import type { Software } from '../types'
import { getLicenseTagVariant as getLicenseVariant } from '../utils/license'
import logger from '../utils/logger'
import TagBadge from './common/TagBadge.vue'
import SystemIcon from './SystemIcon.vue'

const props = defineProps<{
  software: Software
  canEdit: boolean
  hasComparisons: Record<number, boolean>
  onEdit?: (software: Software) => void
  onDelete?: (id: number) => void
  onClick?: (software: Software) => void
  onCompare?: (software: Software) => void
}>()

const imageLoaded = ref(false)

// 计算图标URL
const iconUrl = computed(() => getIconUrl(props.software.icon))

// 预加载图标
const preloadSoftwareIcon = async () => {
  if (props.software.icon) {
    try {
      await preloadIcon(props.software.icon)
    } catch (error) {
      logger.error('预加载图标失败:', error)
    }
  }
}

// 图标加载完成 - 通过 CSS class 触发入场动画
const handleImageLoad = () => {
  imageLoaded.value = true
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = getErrorPlaceholder()
  imageLoaded.value = true
}

onMounted(() => {
  preloadSoftwareIcon()
})

const openSoftwareUrl = (event: Event) => {
  event.stopPropagation()
  const { website } = props.software
  if (website) {
    window.open(website, '_blank')
  }
}

const handleEdit = () => props.onEdit?.(props.software)
const handleDelete = () => props.onDelete?.(props.software.id)
const handleClick = () => props.onClick?.(props.software)

defineEmits<{
  (e: 'edit', software: Software): void
  (e: 'delete', id: number): void
  (e: 'click', software: Software): void
}>()
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片 hover 上浮 - 替代 GSAP gsap.to(el, { y: -6 }) */
.card-body {
  transition: transform 0.4s cubic-bezier(0.33, 1, 0.68, 1),
              border-color 0.3s ease,
              box-shadow 0.3s ease;
}
.card-body:hover {
  transform: translateY(-6px);
}

/* GPU 加速 */
.transform-gpu {
  transform: translateZ(0);
  will-change: transform;
}

/* 图标容器入场动画 - 替代 GSAP fromTo(el, { scale:0.8, y:-10 }) */
.icon-container {
  transition: box-shadow 0.3s ease;
}

/* 图标入场：初始隐藏，加载完后 CSS 动画播放 */
.icon-image {
  opacity: 0;
  transform: scale(0.9);
  filter: blur(8px);
}
.icon-image.icon-loaded {
  animation: iconReveal 0.5s cubic-bezier(0.33, 1, 0.68, 1) forwards;
}

@keyframes iconReveal {
  from {
    opacity: 0;
    transform: scale(0.9);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: scale(1);
    filter: blur(0px);
  }
}
</style>