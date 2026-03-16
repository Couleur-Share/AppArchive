<template>
  <div>
    <template v-if="isSignedIn">
      <Menu as="div" class="relative z-50">
        <MenuButton
          class="ml-2 w-8 h-8 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                 bg-blue-500 text-white flex items-center justify-center text-sm font-semibold select-none"
        >
          <img v-if="user?.avatar" :src="user.avatar" class="w-full h-full object-cover" alt="" />
          <span v-else>{{ avatarInitial }}</span>
        </MenuButton>

        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <MenuItems
            class="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none divide-y divide-gray-100 dark:divide-gray-700"
          >
            <div class="px-4 py-3">
              <p class="text-sm text-gray-900 dark:text-gray-100">
                {{ user?.displayName || user?.username }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                @{{ user?.username }}
              </p>
            </div>

            <div class="py-1">
              <MenuItem v-slot="{ active }">
                <button
                  @click="$emit('change-password')"
                  class="w-full text-left px-4 py-2 text-sm"
                  :class="[
                    active
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      : 'text-gray-700 dark:text-gray-300',
                  ]"
                >
                  修改密码
                </button>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <button
                  @click="$emit('sign-out')"
                  class="w-full text-left px-4 py-2 text-sm"
                  :class="[
                    active
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      : 'text-gray-700 dark:text-gray-300',
                  ]"
                >
                  退出登录
                </button>
              </MenuItem>
            </div>
          </MenuItems>
        </transition>
      </Menu>
    </template>
    <template v-else>
      <button
        @click="$emit('sign-in')"
        class="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 flex items-center space-x-2"
      >
        <UserIcon class="h-4 w-4" />
        <span>登录</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { User as UserIcon } from 'lucide-vue-next'
import { computed } from 'vue'
import type { AuthUser } from '../../lib/auth'

const props = defineProps<{
  isSignedIn: boolean
  user: AuthUser | null
}>()

defineEmits<{
  (e: 'sign-in'): void
  (e: 'sign-out'): void
  (e: 'change-password'): void
}>()

const avatarInitial = computed(() => {
  const name = props.user?.displayName || props.user?.username || '?'
  return name.charAt(0).toUpperCase()
})
</script>
