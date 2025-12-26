<template>
  <!-- 容器：根据模式切换 grid 或 flex -->
  <div :class="[
    viewMode === 'grid' 
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 sm:gap-6' 
      : 'flex flex-col gap-3'
  ]">
    <div
      v-for="item in items"
      :key="item.id"
      :class="[viewMode === 'grid' ? 'relative pt-10 group' : 'group']"
    >
      
      <!-- =============================================== -->
      <!-- 模式 A: 网格视图 (Card View) - 保持原有精美设计 -->
      <!-- =============================================== -->
      <template v-if="viewMode === 'grid'">
        <!-- 图标容器 -->
        <div class="absolute -top-2 left-6 z-10">
          <div class="w-16 h-16 rounded-full overflow-hidden 
                      bg-white/80 dark:bg-gray-800/80
                      backdrop-blur-md backdrop-saturate-150
                      ring-2 ring-white/80 dark:ring-gray-700/50
                      shadow-lg shadow-black/5 dark:shadow-black/20
                      group-hover:ring-3 group-hover:ring-white/90 dark:group-hover:ring-gray-600/60
                      group-hover:shadow-2xl group-hover:shadow-black/10 dark:group-hover:shadow-black/30
                      group-hover:scale-110 group-hover:bg-white/95 dark:group-hover:bg-gray-800/95
                      transition-all duration-500 ease-out transform-gpu">
            <img
              :src="getIconUrl(item.icon)"
              :alt="item.name"
              class="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              referrerpolicy="no-referrer"
            />
          </div>
        </div>

        <!-- 卡片主体 -->
        <div
          class="relative overflow-hidden rounded-lg
                 bg-white/60 dark:bg-gray-800/70 p-6 
                 hover:bg-white/70 dark:hover:bg-gray-800/80 
                 border border-white/30 dark:border-gray-700/50 
                 backdrop-blur transition-colors duration-100
                 hover:shadow-level2 cursor-pointer
                 min-h-[280px] flex flex-col"
          @click="$emit('click', item)"
        >
          <div class="flex flex-col flex-grow">
             <!-- 顶部区域 -->
             <div class="flex items-start justify-between pt-2">
               <div>
                 <h3 class="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                   {{ item.name }}
                 </h3>
                 <span class="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                   {{ item.category }}
                 </span>
               </div>
               <Menu as="div" class="relative">
                 <MenuButton @click.stop class="p-1.5 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-200 opacity-0 group-hover:opacity-100 text-gray-500 dark:text-gray-400 backdrop-blur-sm transform translate-x-2 group-hover:translate-x-0">
                   <MoreVertical class="w-4 h-4" />
                 </MenuButton>
                 <transition enter-active-class="transition duration-150 ease-out" enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-100 ease-in" leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
                   <MenuItems @click.stop class="absolute right-0 mt-1.5 w-36 origin-top-right rounded-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-xl ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50 overflow-hidden">
                     <div class="py-1">
                       <MenuItem v-if="item.website" v-slot="{ active }">
                         <button @click.stop="openWebsite(item.website)" :class="[active ? 'bg-gray-50 dark:bg-gray-700/50' : '', 'text-gray-700 dark:text-gray-300 w-full text-left px-3 py-2 text-sm flex items-center gap-2']">
                           <ArrowUpRight class="w-3.5 h-3.5" /> <span>访问官网</span>
                         </button>
                       </MenuItem>
                       <div v-if="item.website && canEdit" class="my-0.5 h-px bg-gray-200/60 dark:bg-gray-700/60"></div>
                       <MenuItem v-if="canEdit" v-slot="{ active }">
                         <button @click.stop="$emit('edit', item)" :class="[active ? 'bg-gray-50 dark:bg-gray-700/50' : '', 'text-gray-700 dark:text-gray-300 w-full text-left px-3 py-2 text-sm flex items-center gap-2']">
                           <Edit class="w-3.5 h-3.5" /> <span>编辑</span>
                         </button>
                       </MenuItem>
                       <MenuItem v-if="canEdit" v-slot="{ active }">
                         <button @click.stop="$emit('delete', item.id)" :class="[active ? 'bg-red-50/50 dark:bg-red-900/20' : '', 'text-red-600 dark:text-red-400 w-full text-left px-3 py-2 text-sm flex items-center gap-2']">
                           <Trash class="w-3.5 h-3.5" /> <span>删除</span>
                         </button>
                       </MenuItem>
                     </div>
                   </MenuItems>
                 </transition>
               </Menu>
             </div>

             <!-- 描述文本 -->
             <div class="relative flex-grow mt-4">
               <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                 {{ item.description }}
               </p>
               <div v-if="item.description.length > 120" class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-md shadow-sm whitespace-nowrap pointer-events-none">
                 点击查看完整内容
               </div>
             </div>

             <!-- 底部区域 -->
             <div class="flex items-center mt-4 pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
               <div class="flex items-center gap-2 flex-1 min-w-0">
                 <span class="px-2 py-1 rounded-lg text-xs shrink-0"
                       :class="{
                         'bg-cyan-100/70 dark:bg-cyan-900/70 text-cyan-700 dark:text-cyan-200': item.license === '免费',
                         'bg-blue-100/50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300': item.license === '收费',
                         'bg-green-100/50 dark:bg-green-900/50 text-green-700 dark:text-green-300': item.license === '开源',
                         'bg-purple-100/50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300': item.license === '已购'
                       }">
                   {{ item.license }}
                 </span>
                 <div class="flex items-center gap-1">
                   <template v-for="system in item.systems" :key="system">
                     <div class="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 shrink-0" :title="system">
                       <SystemIcon :system="system" class="w-4 h-4" />
                     </div>
                   </template>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </template>


      <!-- =============================================== -->
      <!-- 模式 B: 列表视图 (List View) - 新增的简洁布局 -->
      <!-- =============================================== -->
      <template v-else>
        <div 
          class="relative flex items-center gap-4 p-3 rounded-xl
                 bg-white/60 dark:bg-gray-800/70 
                 hover:bg-white/80 dark:hover:bg-gray-700/80
                 border border-white/30 dark:border-gray-700/50
                 backdrop-blur transition-all duration-200
                 hover:shadow-md cursor-pointer"
          @click="$emit('click', item)"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <!-- 1. 左侧：小图标 -->
          <div class="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-white/50 dark:bg-gray-800 ring-1 ring-black/5">
            <img
              :src="getIconUrl(item.icon)"
              :alt="item.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <!-- 2. 中间：信息区 -->
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white truncate">
                {{ item.name }}
              </h3>
              <span class="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600/30">
                {{ item.category }}
              </span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 w-full pr-4">
              {{ item.description }}
            </p>
          </div>

          <!-- 3. 右侧：状态与操作 -->
          <div class="flex items-center shrink-0 pl-4">
            <!-- 系统图标 (仅在大屏幕显示，固定宽度以保证对齐) -->
            <div class="hidden sm:flex items-center justify-end gap-1 w-20 mr-4 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
               <template v-for="system in item.systems" :key="system">
                 <SystemIcon :system="system" class="w-4 h-4 text-gray-500" />
               </template>
            </div>

            <!-- License 标签 (固定宽度以保证对齐) -->
            <span class="w-12 flex justify-center items-center text-xs h-6 rounded border box-border"
                  :class="{
                    'border-cyan-200 text-cyan-700 dark:text-cyan-300 dark:border-cyan-800': item.license === '免费',
                    'border-blue-200 text-blue-700 dark:text-blue-300 dark:border-blue-800': item.license === '收费',
                    'border-green-200 text-green-700 dark:text-green-300 dark:border-green-800': item.license === '开源',
                    'border-purple-200 text-purple-700 dark:text-purple-300 dark:border-purple-800': item.license === '已购'
                  }">
              {{ item.license }}
            </span>
            
            <!-- 操作按钮组 (GSAP 动画控制) -->
            <div class="action-buttons w-0 overflow-hidden opacity-0 flex items-center justify-end gap-1 ml-0" @click.stop>
              <button 
                v-if="item.website"
                @click="openWebsite(item.website)"
                class="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 rounded-lg transition-colors shrink-0"
                title="访问官网"
              >
                <ArrowUpRight class="w-4 h-4" />
              </button>
              
              <template v-if="canEdit">
                <button 
                  @click="$emit('edit', item)"
                  class="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-600 rounded-lg transition-colors shrink-0"
                  title="编辑"
                >
                  <Edit class="w-4 h-4" />
                </button>
                <button 
                  @click="$emit('delete', item.id)"
                  class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 rounded-lg transition-colors shrink-0"
                  title="删除"
                >
                  <Trash class="w-4 h-4" />
                </button>
              </template>
            </div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowUpRight, Edit, Trash, MoreVertical } from 'lucide-vue-next'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import type { Software } from '../../types'
import { getIconUrl } from '../../services/localIconCache'
import SystemIcon from '../SystemIcon.vue'
import { isSignedIn } from '../../lib/clerk'
import { gsap } from 'gsap'

const props = defineProps<{
  items: Software[]
  canEdit: boolean
  hasComparisons: Record<number, boolean>
  viewMode: 'grid' | 'list'
}>()

defineEmits<{
  (e: 'edit', software: Software): void
  (e: 'delete', id: number): void
  (e: 'click', software: Software): void
  (e: 'compare', software: Software): void
}>()

const openWebsite = (website: string) => {
  if (website) {
    window.open(website, '_blank')
  }
}

const handleMouseEnter = (e: MouseEvent) => {
  if (props.viewMode !== 'list') return

  const target = e.currentTarget as HTMLElement
  const actions = target.querySelector('.action-buttons')
  
  if (actions) {
    gsap.killTweensOf(actions)
    // 1. 弹开宽度和左边距
    gsap.to(actions, {
      width: 96, // 对应 w-24
      marginLeft: 16, // 对应 gap-4 (1rem)
      duration: 0.4,
      ease: 'back.out(1.7)'
    })
    // 2. 稍微延迟显示内容，增加层次感
    gsap.to(actions, {
      opacity: 1,
      duration: 0.3,
      delay: 0.1
    })
  }
}

const handleMouseLeave = (e: MouseEvent) => {
  if (props.viewMode !== 'list') return

  const target = e.currentTarget as HTMLElement
  const actions = target.querySelector('.action-buttons')
  
  if (actions) {
    gsap.killTweensOf(actions)
    // 平滑收起
    gsap.to(actions, {
      width: 0,
      marginLeft: 0,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.inOut'
    })
  }
}
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}

/* 适配暗色模式 */
:root.dark ::-webkit-scrollbar-thumb {
  background-color: rgba(75, 85, 99, 0.3);
}

:root.dark ::-webkit-scrollbar-thumb:hover {
  background-color: rgba(75, 85, 99, 0.5);
}
</style>