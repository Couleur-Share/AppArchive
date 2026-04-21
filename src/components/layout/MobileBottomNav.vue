<template>
  <nav
    class="mobile-bottom-nav sm:hidden fixed bottom-0 inset-x-0 z-40 pb-safe"
    aria-label="主导航"
  >
    <div class="mobile-bottom-nav__rail relative flex items-stretch h-16">
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        type="button"
        :data-active="isActive(tab) ? 'true' : 'false'"
        :aria-label="tab.label"
        :aria-current="isActive(tab) ? 'page' : undefined"
        class="mobile-bottom-nav__item touch-target flex-1 flex flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium"
        @click="onTabClick(tab)"
      >
        <!-- FAB 占位槽：保持中央按钮的布局空间 -->
        <template v-if="tab.id === 'add-slot'">
          <span aria-hidden="true" class="block h-5 w-5"></span>
          <span class="opacity-0" aria-hidden="true">添加</span>
        </template>
        <template v-else>
          <component :is="tab.icon" class="h-5 w-5" aria-hidden="true" />
          <span>{{ tab.label }}</span>
        </template>
      </button>
    </div>

    <!-- 居中凸起 FAB（仅已登录态显示） -->
    <button
      v-if="showFab"
      type="button"
      class="mobile-bottom-nav__fab touch-target absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
      aria-label="添加软件"
      @click="$emit('add')"
    >
      <Plus class="h-6 w-6" aria-hidden="true" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { Bell, Home, LogIn, Plus, Settings, User } from 'lucide-vue-next'
import { computed, type FunctionalComponent } from 'vue'

type TabId = 'home' | 'subscriptions' | 'add-slot' | 'settings' | 'account' | 'login'

interface TabDef {
  id: TabId
  label: string
  icon: FunctionalComponent
}

const props = defineProps<{
  isSignedIn: boolean
  activeTab: Exclude<TabId, 'add-slot'>
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'open-settings'): void
  (e: 'open-account'): void
  (e: 'open-login'): void
  (e: 'navigate-home'): void
  (e: 'navigate-subscriptions'): void
}>()

// 登录用户：5 槽（含中央 FAB 占位槽）；未登录：3 槽
const visibleTabs = computed<TabDef[]>(() => {
  if (props.isSignedIn) {
    return [
      { id: 'home', label: '首页', icon: Home },
      { id: 'subscriptions', label: '订阅', icon: Bell },
      { id: 'add-slot', label: '添加', icon: Plus },
      { id: 'settings', label: '设置', icon: Settings },
      { id: 'account', label: '账户', icon: User },
    ]
  }
  return [
    { id: 'home', label: '首页', icon: Home },
    { id: 'settings', label: '设置', icon: Settings },
    { id: 'login', label: '登录', icon: LogIn },
  ]
})

const showFab = computed(() => props.isSignedIn)

const isActive = (tab: TabDef) => tab.id === props.activeTab

const onTabClick = (tab: TabDef) => {
  switch (tab.id) {
    case 'home':
      emit('navigate-home')
      break
    case 'subscriptions':
      emit('navigate-subscriptions')
      break
    case 'settings':
      emit('open-settings')
      break
    case 'account':
      emit('open-account')
      break
    case 'login':
      emit('open-login')
      break
    case 'add-slot':
      // FAB 由独立按钮处理，此占位槽不触发
      break
  }
}
</script>

<style scoped>
.mobile-bottom-nav {
  /* 上缘分割线 + 轻微阴影 */
  box-shadow: 0 -12px 28px -18px rgb(0 0 0 / 0.32);
}

.mobile-bottom-nav__rail {
  background: var(--home-tab-rail-bg);
  border-top: 1px solid var(--home-tab-rail-border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.mobile-bottom-nav__item {
  color: var(--home-text-muted);
  background: transparent;
  border: none;
  transition:
    color 150ms var(--ease),
    background-color 150ms var(--ease);
  -webkit-tap-highlight-color: transparent;
}

.mobile-bottom-nav__item[data-active='true'] {
  color: var(--home-text-strong);
  /* 顶部 2.5px 强调条，借用 tab-indicator-beam 渐变 */
  position: relative;
}

.mobile-bottom-nav__item[data-active='true']::before {
  content: '';
  position: absolute;
  top: 0;
  left: 28%;
  right: 28%;
  height: 2.5px;
  border-radius: 0 0 999px 999px;
  background: var(--home-tab-indicator-beam);
  box-shadow: var(--home-tab-indicator-glow);
  pointer-events: none;
}

.mobile-bottom-nav__item:active {
  background: color-mix(in srgb, var(--home-tab-hover) 60%, transparent);
}

.mobile-bottom-nav__item:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 2px var(--home-accent-border);
  border-radius: 8px;
}

/* 中央凸起 FAB —— 圆角方块，遵循"无圆形"品牌规则 */
.mobile-bottom-nav__fab {
  /* 凸起位置：底部 nav 高度 64px，FAB 高 56px，向上偏移 24px 让 FAB 一半浮在 rail 之上 */
  top: -24px;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--theme-primary-500);
  color: rgb(18 18 18);
  border: none;
  box-shadow:
    0 14px 28px -10px rgb(30 215 96 / 0.44),
    0 8px 16px -8px rgb(0 0 0 / 0.32),
    inset 0 1px 0 rgb(255 255 255 / 0.22);
  transition:
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 150ms var(--ease);
  -webkit-tap-highlight-color: transparent;
}

.mobile-bottom-nav__fab:active {
  transform: translate(-50%, 0) scale(0.94);
}

.mobile-bottom-nav__fab:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px rgb(255 255 255 / 0.32),
    0 0 0 5px rgb(30 215 96 / 0.5),
    0 14px 28px -10px rgb(30 215 96 / 0.44);
}

@media (hover: hover) and (pointer: fine) {
  .mobile-bottom-nav__item:hover {
    color: var(--home-text-strong);
    background: color-mix(in srgb, var(--home-tab-hover) 50%, transparent);
  }

  .mobile-bottom-nav__fab:hover {
    background: var(--theme-primary-400);
    transform: translate(-50%, -1px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-bottom-nav__item,
  .mobile-bottom-nav__fab {
    transition: none !important;
  }

  .mobile-bottom-nav__fab:active {
    transform: translate(-50%, 0) !important;
  }
}
</style>
