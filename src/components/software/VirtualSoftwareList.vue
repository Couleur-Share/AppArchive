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
          <div class="software-card-icon-shell w-16 h-16 rounded-full overflow-hidden 
                      backdrop-blur-md backdrop-saturate-150
                      transition-all duration-500 ease-out transform-gpu">
            <img
              v-if="shouldRenderImage(item)"
              :src="deferIcons ? placeholderIcon : getIconUrl(item.icon || '')"
              :alt="item.name"
              class="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              referrerpolicy="origin"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center text-primary"
              :aria-label="getKindLabel(item.kind)"
            >
              <component :is="getTypeIcon(item)" class="h-7 w-7" :stroke-width="2" />
            </div>
          </div>
        </div>

        <!-- 卡片主体 -->
        <div
          class="software-grid-card relative overflow-hidden rounded-xl
                 p-6 cursor-pointer
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
                  <TagBadge v-if="isFunctionalItem(item)" size="xs" variant="primary" strong>
                    {{ getKindLabel(item.kind) }}
                  </TagBadge>
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
                    <span class="software-new-dot w-1.5 h-1.5 rounded-full animate-pulse" />
                    New
                  </TagBadge>
                </div>
               </div>
               <Menu as="div" class="relative">
                 <MenuButton
                   @click.stop
                   aria-label="更多操作"
                   class="software-card-menu-trigger touch-target p-2.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-sm transform translate-x-2 group-hover:translate-x-0 [@media(pointer:coarse)]:opacity-100 [@media(pointer:coarse)]:translate-x-0"
                 >
                   <MoreVertical class="w-4 h-4" />
                 </MenuButton>
                 <transition enter-active-class="transition duration-150 ease-out" enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-100 ease-in" leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
                   <MenuItems @click.stop class="software-card-menu-panel absolute right-0 mt-1.5 w-36 origin-top-right rounded-lg focus:outline-none z-50 overflow-hidden">
                     <div class="py-1">
                       <MenuItem v-if="item.website" v-slot="{ active }">
                        <button @click.stop="openWebsite(item.website)" :class="[active ? 'software-card-action software-card-action--active' : 'software-card-action', 'w-full text-left px-3 py-2 text-sm flex items-center gap-2']">
                           <ArrowUpRight class="w-3.5 h-3.5" /> <span>{{ getSourceActionLabel(item) }}</span>
                         </button>
                       </MenuItem>
                       <div v-if="item.website && canEdit" class="my-0.5 h-px bg-slate-200/60 dark:bg-slate-700/60"></div>
                       <MenuItem v-if="canEdit" v-slot="{ active }">
                        <button @click.stop="$emit('edit', item)" :class="[active ? 'software-card-action software-card-action--active' : 'software-card-action', 'w-full text-left px-3 py-2 text-sm flex items-center gap-2']">
                           <Edit class="w-3.5 h-3.5" /> <span>编辑</span>
                         </button>
                       </MenuItem>
                       <MenuItem v-if="canEdit" v-slot="{ active }">
                        <button
                          @click.stop="$emit('delete', item.id)"
                          :class="[
                            active ? 'software-card-action software-card-action--danger-active' : 'software-card-action',
                            'text-red-600 dark:text-red-400 w-full text-left px-3 py-2 text-sm flex items-center gap-2'
                          ]"
                        >
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
               <p class="software-card-copy text-sm line-clamp-3 mb-4">
                 {{ getDescription(item.description) }}
               </p>
               <div v-if="(item.description || '').length > 120" class="software-card-hint absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 text-xs rounded-md whitespace-nowrap pointer-events-none">
                 点击查看完整内容
               </div>
             </div>

             <!-- 底部区域 -->
             <div class="software-card-divider flex items-center mt-4 pt-4 border-t">
               <div class="flex items-center gap-2 flex-1 min-w-0">
                <TagBadge v-if="!isFunctionalItem(item)" size="sm" strong class="shrink-0" :variant="getLicenseVariant(item.license)">
                   {{ getLicenseLabel(item.license) }}
                </TagBadge>
                 <div class="flex items-center gap-1">
                   <template v-for="system in item.systems || []" :key="system">
                     <div class="software-card-system-chip flex items-center justify-center w-6 h-6 rounded-lg shrink-0" :title="system">
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
          class="software-list-card relative flex items-center gap-4 p-3 rounded-xl
                 transition-all duration-200 cursor-pointer"
          @click="handleItemClick(item, 'list')"
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <!-- 1. 左侧：小图标 -->
          <div class="software-card-icon-shell w-12 h-12 shrink-0 rounded-lg overflow-hidden">
            <img
              v-if="shouldRenderImage(item)"
              :src="deferIcons ? placeholderIcon : getIconUrl(item.icon || '')"
              :alt="item.name"
              class="w-full h-full object-cover transition-opacity duration-200"
              loading="lazy"
              referrerpolicy="origin"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center text-primary"
              :aria-label="getKindLabel(item.kind)"
            >
              <component :is="getTypeIcon(item)" class="h-5 w-5" :stroke-width="2" />
            </div>
          </div>

          <!-- 2. 中间：信息区 -->
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <div class="flex items-center gap-2 mb-1 min-w-0">
              <h3 class="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">
                {{ item.name }}
              </h3>
              <TagBadge v-if="isFunctionalItem(item)" size="xs" variant="primary" strong class="shrink-0">
                {{ getKindLabel(item.kind) }}
              </TagBadge>
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
                <span class="software-new-dot w-1.5 h-1.5 rounded-full animate-pulse" />
                New
              </TagBadge>
            </div>
            <p class="software-card-copy text-sm line-clamp-1 w-full pr-4">
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
              v-if="!isFunctionalItem(item)"
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
                class="software-card-inline-action p-2 rounded-lg transition-colors shrink-0"
                :title="getSourceActionLabel(item)"
              >
                <ArrowUpRight class="w-4 h-4" />
              </button>
              
              <template v-if="canEdit">
                <button 
                  @click="$emit('edit', item)"
                  class="software-card-inline-action p-2 rounded-lg transition-colors shrink-0"
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
import { ArrowUpRight, Edit, MoreVertical, Package, Puzzle, ScrollText, Trash } from 'lucide-vue-next'
import { computed } from 'vue'
import type { Component } from 'vue'
import { isSignedIn } from '../../lib/auth'
import { getIconUrl } from '../../services/localIconCache'
import type { SoftwareListItem } from '../../types'
import { getKindLabel } from '../../utils/kind'
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

const getSourceActionLabel = (item: SoftwareListItem) =>
  isFunctionalItem(item) ? '访问来源' : '访问官网'

const isFunctionalItem = (item: SoftwareListItem) =>
  item.kind === 'extension' || item.kind === 'userscript'

const shouldRenderImage = (item: SoftwareListItem) =>
  Boolean(props.deferIcons || item.icon || !isFunctionalItem(item))

const typeIconMap: Record<string, Component> = {
  app: Package,
  extension: Puzzle,
  userscript: ScrollText,
}

const getTypeIcon = (item: SoftwareListItem) =>
  typeIconMap[item.kind || 'app'] || Package

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
.software-grid-card,
.software-list-card {
  background: var(--home-card-bg);
  border: 1px solid var(--home-card-border);
  box-shadow: var(--home-card-shadow);
}

.software-grid-card {
  backdrop-filter: blur(10px) saturate(116%);
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    background 220ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 180ms ease,
    box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.software-list-card {
  backdrop-filter: blur(8px) saturate(112%);
  transition:
    background 220ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 180ms ease,
    box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.software-grid-card:hover,
.software-list-card:hover {
  background: var(--home-card-bg-hover);
  border-color: var(--home-card-border-hover);
  box-shadow: var(--home-card-shadow-hover);
}

.software-grid-card:hover {
  transform: translateY(-2px);
}

.software-card-icon-shell {
  background: var(--home-card-icon-shell);
  border: 1px solid var(--home-card-icon-ring);
  box-shadow: 0 14px 28px -24px rgb(15 23 42 / 0.18);
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    border-color 180ms ease,
    box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1),
    background 180ms cubic-bezier(0.22, 1, 0.36, 1);
}

:global(.dark) .software-card-icon-shell {
  box-shadow: 0 16px 30px -26px rgb(2 6 23 / 0.52);
}

.group:hover .software-card-icon-shell {
  transform: scale(1.03);
  border-color: var(--home-card-border-hover);
  box-shadow: 0 18px 34px -28px rgb(2 6 23 / 0.58);
}

.software-card-menu-trigger {
  color: color-mix(in srgb, var(--home-text-muted) 82%, var(--home-text-subtle));
}

.software-card-menu-trigger:hover {
  color: var(--home-text);
  background: color-mix(in srgb, var(--home-card-menu-bg) 86%, transparent);
}

.software-card-action {
  position: relative;
  color: var(--home-text);
  border-radius: 0;
  transition:
    color 150ms ease,
    background-color 150ms ease,
    box-shadow 180ms ease;
}

.software-card-action::before {
  content: '';
  position: absolute;
  left: 0;
  top: 5px;
  bottom: 5px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  opacity: 0;
  background: transparent;
  transition:
    opacity 150ms ease,
    background-color 150ms ease,
    box-shadow 180ms ease;
}

.software-card-action--active {
  color: var(--home-text-strong);
  background: color-mix(in srgb, var(--theme-primary-500) 18%, var(--home-card-menu-bg));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--theme-primary-600) 20%, transparent);
}

.software-card-action--active::before {
  opacity: 1;
  background: var(--theme-primary-700);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--theme-primary-700) 24%, transparent);
}

.software-card-action--danger-active {
  background: color-mix(in srgb, rgb(243 114 127 / 0.18) 82%, transparent);
}

.software-card-action--danger-active::before {
  opacity: 1;
  background: rgb(243 114 127 / 0.78);
  box-shadow: 0 0 0 1px rgb(243 114 127 / 0.2);
}

.software-card-menu-panel {
  background: var(--home-card-menu-bg);
  border: 1px solid var(--home-card-menu-border);
  backdrop-filter: blur(12px) saturate(118%);
  box-shadow: 0 16px 32px -28px rgb(15 23 42 / 0.16);
}

:global(.dark) .software-card-menu-panel {
  box-shadow: 0 18px 36px -30px rgb(2 6 23 / 0.56);
}

.software-card-copy {
  color: color-mix(in srgb, var(--home-text-muted) 86%, var(--home-text-subtle));
  transition: color 180ms ease;
}

.software-card-hint {
  color: color-mix(in srgb, var(--home-text-muted) 90%, var(--home-text-subtle));
  background: color-mix(in srgb, var(--home-card-menu-bg) 88%, transparent);
  border: 1px solid color-mix(in srgb, var(--home-card-menu-border) 76%, transparent);
  box-shadow: 0 10px 20px -18px rgb(15 23 42 / 0.22);
}

.software-card-divider {
  border-color: var(--home-card-divider);
}

.software-card-system-chip {
  background: var(--home-card-system-bg);
  border: 1px solid var(--home-card-system-border);
  color: var(--home-text-muted);
}

.software-new-dot {
  background: var(--home-tab-badge-active-bg);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--home-accent-soft) 68%, transparent);
}

.software-card-inline-action {
  color: color-mix(in srgb, var(--home-text-muted) 88%, var(--home-text-subtle));
}

@media (hover: hover) and (pointer: fine) {
  .software-card-inline-action:hover {
    color: var(--home-text-strong);
    background: color-mix(in srgb, var(--home-accent-soft) 86%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--home-accent-border) 76%, transparent);
  }
}

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

/* 可访问性：尊重用户降低动效的设置 */
@media (prefers-reduced-motion: reduce) {
  .software-grid-card,
  .software-list-card,
  .software-card-icon-shell,
  .software-card-copy,
  .software-card-menu-trigger,
  .action-buttons {
    transition: none !important;
  }

  .software-grid-card:hover {
    transform: none;
  }

  .group:hover .software-card-icon-shell {
    transform: none;
  }

  .actions-visible .action-buttons {
    transition: opacity 120ms ease;
  }
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
