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
      :class="[viewMode === 'grid' ? 'relative pt-10 group isolate' : 'group']"
    >
      
      <!-- =============================================== -->
      <!-- 模式 A: 网格视图 (Card View) - 保持原有精美设计 -->
      <!-- =============================================== -->
      <template v-if="viewMode === 'grid'">
        <!-- 图标容器 -->
        <div class="absolute -top-2 left-6 z-10 pointer-events-none">
          <div class="w-16 h-16 rounded-full overflow-hidden 
                      bg-white/85 dark:bg-slate-900/85
                      backdrop-blur-md backdrop-saturate-150
                      ring-2 ring-white/85 dark:ring-slate-700/55
                      shadow-[0_18px_32px_-24px_rgba(15,23,42,0.5)]
                      group-hover:ring-3 group-hover:ring-white/95 dark:group-hover:ring-emerald-400/18
                      group-hover:shadow-[0_24px_44px_-28px_rgba(0,220,130,0.28)]
                      group-hover:scale-110 group-hover:bg-white/95 dark:group-hover:bg-slate-900/95
                      transition-all duration-500 ease-out transform-gpu">
            <img
              :src="deferIcons ? placeholderIcon : getIconUrl(item.icon || '')"
              :alt="item.name"
              class="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              referrerpolicy="origin"
            />
          </div>
        </div>

        <!-- 卡片主体 -->
        <div
          class="relative overflow-hidden rounded-lg
                 bg-white/[0.78] dark:bg-[#081220]/[0.86] p-6 
                 hover:bg-white/[0.92] dark:hover:bg-[#0b1a2e]/[0.94] 
                 border border-slate-200/60 dark:border-slate-700/45 
                 hover:border-emerald-400/30 dark:hover:border-emerald-400/22
                 backdrop-blur transition-colors duration-100
                 hover:shadow-[0_26px_56px_-36px_rgba(15,23,42,0.52)] cursor-pointer
                 min-h-[280px] flex flex-col z-[1]"
          @click="handleItemClick(item, 'grid')"
        >
          <div class="flex flex-col flex-grow">
             <!-- 顶部区域 -->
             <div class="flex items-start justify-between pt-2 gap-3">
               <div class="min-w-0">
                 <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-50 line-clamp-1">
                   {{ item.name }}
                 </h3>
                <div class="mt-2 flex items-center gap-2">
                  <TagBadge size="xs" variant="neutral" class="uppercase tracking-wider">
                    {{ item.category || '未分类' }}
                  </TagBadge>
                  <TagBadge
                    v-if="isNewItem(item)"
                    size="xs"
                    variant="success"
                    strong
                    class="uppercase tracking-wider"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    New
                  </TagBadge>
                </div>
               </div>
               <Menu as="div" class="relative">
                 <MenuButton @click.stop class="p-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-all duration-200 opacity-0 group-hover:opacity-100 text-slate-500 dark:text-slate-400 backdrop-blur-sm transform translate-x-2 group-hover:translate-x-0">
                   <MoreVertical class="w-4 h-4" />
                 </MenuButton>
                 <transition enter-active-class="transition duration-150 ease-out" enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-100 ease-in" leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
                   <MenuItems @click.stop class="absolute right-0 mt-1.5 w-36 origin-top-right rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl ring-1 ring-slate-200/50 dark:ring-white/10 focus:outline-none z-50 overflow-hidden">
                     <div class="py-1">
                       <MenuItem v-if="item.website" v-slot="{ active }">
                         <button @click.stop="openWebsite(item.website)" :class="[active ? 'bg-slate-50 dark:bg-slate-800/70 text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300', 'w-full text-left px-3 py-2 text-sm flex items-center gap-2']">
                           <ArrowUpRight class="w-3.5 h-3.5" /> <span>访问官网</span>
                         </button>
                       </MenuItem>
                       <div v-if="item.website && canEdit" class="my-0.5 h-px bg-slate-200/60 dark:bg-slate-700/60"></div>
                       <MenuItem v-if="canEdit" v-slot="{ active }">
                         <button @click.stop="$emit('edit', item)" :class="[active ? 'bg-slate-50 dark:bg-slate-800/70 text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300', 'w-full text-left px-3 py-2 text-sm flex items-center gap-2']">
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
               <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
                 {{ getDescription(item.description) }}
               </p>
               <div v-if="(item.description || '').length > 120" class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-900/75 backdrop-blur-sm rounded-md shadow-sm whitespace-nowrap pointer-events-none">
                 点击查看完整内容
               </div>
             </div>

             <!-- 底部区域 -->
             <div class="flex items-center mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/35">
               <div class="flex items-center gap-2 flex-1 min-w-0">
                <TagBadge size="sm" strong class="shrink-0" :variant="getLicenseVariant(item.license)">
                   {{ getLicenseLabel(item.license) }}
                </TagBadge>
                 <div class="flex items-center gap-1">
                   <template v-for="system in item.systems || []" :key="system">
                     <div class="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-50/45 dark:bg-emerald-500/10 text-slate-600 dark:text-slate-400 shrink-0" :title="system">
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
                 bg-white/[0.76] dark:bg-[#081220]/[0.84] 
                 hover:bg-white/[0.92] dark:hover:bg-[#0b1a2e]/[0.92]
                 border border-slate-200/60 dark:border-slate-700/45
                 hover:border-emerald-400/30 dark:hover:border-emerald-400/22
                 backdrop-blur transition-all duration-200
                 hover:shadow-[0_22px_48px_-34px_rgba(15,23,42,0.44)] cursor-pointer"
          @click="handleItemClick(item, 'list')"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <!-- 1. 左侧：小图标 -->
          <div class="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-white/60 dark:bg-slate-900/85 ring-1 ring-slate-200/60 dark:ring-slate-700/55">
            <img
              :src="deferIcons ? placeholderIcon : getIconUrl(item.icon || '')"
              :alt="item.name"
              class="w-full h-full object-cover transition-opacity duration-200"
              loading="lazy"
              referrerpolicy="origin"
            />
          </div>

          <!-- 2. 中间：信息区 -->
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <div class="flex items-center gap-2 mb-1 min-w-0">
              <h3 class="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">
                {{ item.name }}
              </h3>
              <TagBadge size="xs" variant="neutral" class="shrink-0">
                {{ item.category || '未分类' }}
              </TagBadge>
              <TagBadge
                v-if="isNewItem(item)"
                size="xs"
                variant="success"
                strong
                class="uppercase tracking-wider"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                New
              </TagBadge>
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 w-full pr-4">
              {{ getDescription(item.description) }}
            </p>
          </div>

          <!-- 3. 右侧：状态与操作 -->
          <div class="flex items-center shrink-0 pl-4">
            <!-- 系统图标 (仅在大屏幕显示，固定宽度以保证对齐) -->
            <div class="hidden sm:flex items-center justify-end gap-1 w-20 mr-4 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
               <template v-for="system in item.systems || []" :key="system">
                 <SystemIcon :system="system" class="w-4 h-4 text-slate-500 dark:text-slate-400" />
               </template>
            </div>

            <!-- License 标签 (固定宽度以保证对齐) -->
            <TagBadge
              size="sm"
              strong
              class="w-14 justify-center box-border shrink-0"
              :variant="getLicenseVariant(item.license)"
            >
              {{ getLicenseLabel(item.license) }}
            </TagBadge>
            
            <!-- 操作按钮组 (CSS 动画控制) - 移动端隐藏 -->
            <div class="action-buttons hidden sm:flex items-center justify-end gap-1" @click.stop>
              <button 
                v-if="item.website"
                @click="openWebsite(item.website)"
                class="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/12 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 rounded-lg transition-colors shrink-0"
                title="访问官网"
              >
                <ArrowUpRight class="w-4 h-4" />
              </button>
              
              <template v-if="canEdit">
                <button 
                  @click="$emit('edit', item)"
                  class="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/12 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 rounded-lg transition-colors shrink-0"
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
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { ArrowUpRight, Edit, MoreVertical, Trash } from 'lucide-vue-next'
import { computed } from 'vue'
import { isSignedIn } from '../../lib/auth'
import { getIconUrl } from '../../services/localIconCache'
import type { SoftwareListItem } from '../../types'
import { getLicenseTagVariant as getLicenseVariant } from '../../utils/license'
import TagBadge from '../common/TagBadge.vue'
import SystemIcon from '../SystemIcon.vue'

const props = defineProps<{
  items: SoftwareListItem[]
  canEdit: boolean
  hasComparisons: Record<number, boolean>
  viewMode: 'grid' | 'list'
  deferIcons?: boolean
  newSince?: string
}>()

// 使用可见的骨架占位图标（灰色圆形），避免透明导致视觉空白
const placeholderIcon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIxNiIgZmlsbD0iIzRCNTU2MyIvPjwvc3ZnPg=='

const emit = defineEmits<{
  (e: 'edit', software: SoftwareListItem): void
  (e: 'delete', id: number): void
  (e: 'click', software: SoftwareListItem): void
  (e: 'compare', software: SoftwareListItem): void
}>()

const handleItemClick = (item: SoftwareListItem, _view: 'grid' | 'list') => {
  emit('click', item)
}

const getDescription = (description?: string) => description || '暂无描述'

const getLicenseLabel = (license?: string) => license || '未知'

const newSinceTimestamp = computed(() => {
  if (!props.newSince) return Number.NaN
  const parsed = Date.parse(props.newSince)
  return Number.isNaN(parsed) ? Number.NaN : parsed
})

const isNewItem = (item: SoftwareListItem) => {
  if (!Number.isFinite(newSinceTimestamp.value)) return false
  if (!item.created_at) return false
  const createdAt = Date.parse(item.created_at)
  if (Number.isNaN(createdAt)) return false
  return createdAt >= newSinceTimestamp.value
}

const openWebsite = (website: string) => {
  if (website) {
    window.open(website, '_blank')
  }
}

const handleMouseEnter = (e: MouseEvent) => {
  if (props.viewMode !== 'list') return
  const target = e.currentTarget as HTMLElement
  target.classList.add('actions-visible')
}

const handleMouseLeave = (e: MouseEvent) => {
  if (props.viewMode !== 'list') return
  const target = e.currentTarget as HTMLElement
  target.classList.remove('actions-visible')
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

/* 操作按钮组 - CSS transition 替代 GSAP */
.action-buttons {
  width: 0;
  margin-left: 0;
  opacity: 0;
  overflow: hidden;
  transition: width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              margin-left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.25s ease 0.05s;
}

/* 父元素 hover 时展开操作按钮 */
.actions-visible .action-buttons {
  width: 96px;
  margin-left: 16px;
  opacity: 1;
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
