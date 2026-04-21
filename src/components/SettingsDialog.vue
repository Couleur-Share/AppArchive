<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog 
      as="div" 
      class="relative z-50" 
      :open="isOpen"
      :initialFocus="closeButtonRef"
      @close="$emit('update:isOpen', false)"
    >
      <div class="fixed inset-0">
        <TransitionChild as="div">
          <div class="fixed inset-0 app-modal-backdrop"
               v-gsap="{ duration: 0.18, to: { duration: 0.18, ease: 'power1.out' } }" />
        </TransitionChild>
      </div>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild as="div">
            <DialogPanel
             class="relative transform overflow-hidden
                    app-modal-panel app-modal-panel--interactive
                    text-left shadow-level3 will-change-transform will-change-opacity
                    flex flex-col
                    w-full h-[100dvh] rounded-none
                    sm:w-[min(960px,94vw)] sm:h-[min(86dvh,760px)] sm:rounded-2xl"
              v-gsap="{ y: 12, duration: 0.28, ease: 'power2.out', to: { y: 0, duration: 0.28, ease: 'power2.out' } }"
            >
              <!-- 移动端顶部栏：标题 + 关闭（桌面端在右侧内容头部承担） -->
              <div class="sm:hidden flex items-center justify-between gap-3 px-4 border-b border-gray-200 dark:border-gray-700 pt-safe">
                <DialogTitle as="h3" class="text-lg font-semibold text-gray-900 dark:text-white py-3">
                  {{ currentTab?.label || '设置' }}
                </DialogTitle>
                <button
                  type="button"
                  @click="$emit('update:isOpen', false)"
                  class="touch-target p-2 rounded-lg transition-all duration-200
                         text-gray-600 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-700
                         hover:text-gray-900 dark:hover:text-white
                         focus:outline-none focus:ring-2 focus:ring-gray-500/50 app-modal-close-btn"
                  title="关闭"
                  aria-label="关闭"
                >
                  <X class="h-5 w-5" />
                </button>
              </div>

              <!-- 主体：桌面两栏 / 移动端单列 -->
              <div class="flex flex-1 overflow-hidden sm:flex-row flex-col">
                <!-- 侧栏 / 顶部 tab 条 -->
                <div
                  class="flex flex-col bg-gray-50 dark:bg-gray-900/50
                         sm:w-48 sm:border-r border-gray-200 dark:border-gray-700
                         w-full border-b sm:border-b-0"
                >
                  <!-- 桌面端标题（移动端已在顶栏承担） -->
                  <div class="hidden sm:block p-6 border-b border-gray-200 dark:border-gray-700">
                    <DialogTitle as="h3" class="text-xl font-semibold text-gray-900 dark:text-white">
                      设置
                    </DialogTitle>
                  </div>

                  <!-- Tab 导航：桌面列、移动端横向滚动 -->
                  <div
                    class="sm:flex-1 sm:p-4 sm:space-y-2 sm:overflow-visible
                           flex sm:flex-col flex-row gap-1.5 p-2 overflow-x-auto settings-mobile-tab-strip"
                  >
                    <button
                      type="button"
                      v-for="tab in tabs"
                      :key="tab.id"
                      @click="activeTab = tab.id"
                      class="sm:w-full text-left px-4 py-2 rounded-lg transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/40 whitespace-nowrap shrink-0 touch-target text-sm"
                      :class="[
                        activeTab === tab.id
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      ]"
                    >
                      {{ tab.label }}
                    </button>
                  </div>

                  <!-- 桌面端底部按钮（移动端改为 sticky footer） -->
                  <div v-if="activeTab !== 'maintenance' && activeTab !== 'channels'" class="hidden sm:block p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <BaseButton
                      @click="resetSettings"
                      variant="secondary"
                      block
                      :disabled="isProfileSaving || isAvatarUploading"
                    >
                      重置
                    </BaseButton>
                    <BaseButton
                      @click="saveSettings"
                      variant="primary"
                      block
                      :disabled="isProfileSaving || isAvatarUploading"
                    >
                      {{ isProfileSaving ? '保存中...' : '保存' }}
                    </BaseButton>
                  </div>
                </div>

                <!-- 右侧内容区 -->
                <div class="flex-1 flex flex-col overflow-hidden">
                  <!-- 桌面端内容头部（标题 + 关闭）；移动端由顶栏承担 -->
                  <div class="hidden sm:flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h4 class="text-xl font-semibold text-gray-900 dark:text-white">
                      {{ currentTab?.label }}
                    </h4>
                    <button
                      ref="closeButtonRef"
                      type="button"
                      @click="$emit('update:isOpen', false)"
                      class="p-2 rounded-lg transition-all duration-200
                             text-gray-600 dark:text-gray-400
                             hover:bg-gray-100 dark:hover:bg-gray-700
                             hover:text-gray-900 dark:hover:text-white
                             focus:outline-none focus:ring-2 focus:ring-gray-500/50 app-modal-close-btn"
                      title="关闭"
                      aria-label="关闭"
                    >
                      <X class="h-5 w-5" />
                    </button>
                  </div>

                  <!-- 内容区主体：移动端底部留出 sticky footer 空间 -->
                  <div
                    class="flex-1 overflow-y-auto p-4 sm:p-6"
                    :class="showMobileFooter ? 'pb-[calc(120px+env(safe-area-inset-bottom))] sm:pb-6' : ''"
                  >
                    <!-- 账户设置 -->
                    <div v-if="activeTab === 'account'" class="space-y-6">
                      <div class="flex items-center gap-6">
                        <div class="relative group cursor-pointer shrink-0" @click="triggerAvatarUpload">
                          <div class="w-20 h-20 rounded-full overflow-hidden bg-primary flex items-center justify-center text-[rgb(18_18_18)] text-2xl font-semibold select-none">
                            <img v-if="editAvatar" :src="editAvatar" class="w-full h-full object-cover" alt="头像" />
                            <span v-else>{{ profileInitial }}</span>
                          </div>
                          <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Camera class="w-5 h-5 text-white" />
                          </div>
                          <div v-if="isAvatarUploading" class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                            <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">头像</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">点击更换头像，支持 JPG / PNG / WebP</p>
                        </div>
                        <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handleAvatarChange" />
                      </div>

                      <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">显示名称</label>
                        <input
                          v-model="editDisplayName"
                          type="text"
                          maxlength="100"
                          placeholder="设置你的显示名称"
                          class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                 bg-white dark:bg-gray-800
                                 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                 text-gray-900 dark:text-gray-100
                                 placeholder-gray-400 dark:placeholder-gray-500"
                        />
                      </div>

                      <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">用户名</label>
                        <div class="px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700
                                    bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm">
                          @{{ user?.username }}
                        </div>
                      </div>

                      <p v-if="profileMessage" class="text-sm" :class="profileError ? 'text-red-500' : 'text-green-600 dark:text-green-400'">
                        {{ profileMessage }}
                      </p>
                    </div>

                    <!-- 筛选条件 -->
                    <div v-if="activeTab === 'filters'" class="space-y-6">
                      <!-- 操作系统 -->
                      <div class="space-y-3">
                        <div class="flex items-baseline justify-between">
                          <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300">操作系统</h5>
                          <span class="text-xs text-gray-500 dark:text-gray-400">维度内多选 OR</span>
                        </div>
                        <div class="grid grid-cols-3 gap-3">
                          <button
                            v-for="system in SYSTEMS"
                            :key="system"
                            @click="toggleSystem(system)"
                            class="flex flex-col items-center justify-center p-4 rounded-lg border transition-colors"
                            :class="[
                              selectedSystems.includes(system)
                                ? 'bg-gray-900 dark:bg-gray-700 border-gray-900 dark:border-gray-700 text-white'
                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            ]"
                          >
                            <Monitor v-if="system === 'Windows' || system === 'macOS' || system === 'Linux'" class="w-6 h-6 mb-2" />
                            <Smartphone v-else class="w-6 h-6 mb-2" />
                            <span class="text-sm">{{ system }}</span>
                          </button>
                        </div>
                      </div>

                      <!-- 授权类型 -->
                      <div class="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-3">
                        <div class="flex items-baseline justify-between">
                          <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300">授权类型</h5>
                          <span class="text-xs text-gray-500 dark:text-gray-400">维度间 AND</span>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                          <button
                            v-for="license in LICENSES"
                            :key="license"
                            @click="toggleLicense(license)"
                            class="flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors"
                            :class="[
                              selectedLicenses.includes(license)
                                ? 'bg-gray-900 dark:bg-gray-700 border-gray-900 dark:border-gray-700 text-white'
                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            ]"
                          >
                            <component :is="licenseIcons[license]" class="w-4 h-4" />
                            <span class="text-sm">{{ license }}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- 排序方式 -->
                    <div v-if="activeTab === 'sort'" class="space-y-6">
                      <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">排序字段</label>
                        <select
                          v-model="sortSettings.field"
                          class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 
                                 bg-white dark:bg-gray-800 
                                 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                 text-gray-900 dark:text-gray-100"
                        >
                          <option value="name">名称</option>
                          <option value="category">分类</option>
                          <option value="created_at">创建时间</option>
                          <option value="updated_at">更新时间</option>
                        </select>
                      </div>
                      <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">排序方向</label>
                        <div class="flex gap-3">
                          <button
                            v-for="order in ['asc', 'desc'] as const"
                            :key="order"
                            @click="handleOrderChange(order)"
                            class="px-4 py-2 rounded-lg border transition-colors duration-100 flex items-center justify-center gap-2 text-sm"
                            :class="[
                              sortSettings.order === order
                                ? 'bg-gray-900 dark:bg-gray-700 border-gray-900 dark:border-gray-700 text-white'
                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            ]"
                          >
                            <ArrowUp v-if="order === 'asc'" class="w-4 h-4" />
                            <ArrowDown v-if="order === 'desc'" class="w-4 h-4" />
                            {{ order === 'asc' ? '升序' : '降序' }}
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- 布局设置 -->
                    <div v-if="activeTab === 'view'" class="space-y-6">
                      <div class="space-y-2">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">默认布局</label>
                        <div class="grid grid-cols-2 gap-3">
                          <button
                            v-for="mode in [
                              { value: 'grid', label: '卡片视图', icon: LayoutGrid },
                              { value: 'list', label: '列表视图', icon: List }
                            ] as const"
                            :key="mode.value"
                            @click="viewMode = mode.value"
                            class="flex flex-col items-center justify-center p-4 rounded-lg border transition-colors"
                            :class="[
                              viewMode === mode.value
                                ? 'bg-gray-900 dark:bg-gray-700 border-gray-900 dark:border-gray-700 text-white'
                                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                            ]"
                          >
                            <component :is="mode.icon" class="w-6 h-6 mb-2" />
                            <span class="text-sm">{{ mode.label }}</span>
                          </button>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 pt-2">
                          * 设置将自动保存并在下次访问时生效
                        </p>
                      </div>
                    </div>

                    <!-- AI 设置 -->
                    <div v-if="activeTab === 'ai'" class="space-y-6">
                      <!-- 加载状态 -->
                      <div v-if="aiLoading" class="flex items-center justify-center py-12">
                        <div class="w-6 h-6 border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white rounded-full animate-spin" />
                      </div>

                      <template v-else>
                        <!-- 供应商选择 -->
                        <div class="space-y-3">
                          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">AI 供应商</label>
                          <div class="grid grid-cols-2 gap-3">
                            <button
                              v-for="p in aiProviders"
                              :key="p.id"
                              @click="selectProvider(p.id)"
                              class="flex flex-col items-start p-3 rounded-lg border transition-colors text-left"
                              :class="[
                                aiForm.provider === p.id
                                  ? 'bg-gray-900 dark:bg-gray-700 border-gray-900 dark:border-gray-700 text-white'
                                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                              ]"
                            >
                              <span class="text-sm font-medium">{{ p.name }}</span>
                              <span class="text-xs mt-1" :class="aiForm.provider === p.id ? 'text-gray-300' : 'text-gray-400 dark:text-gray-500'">
                                {{ p.id === 'custom' ? '自定义 API 地址' : p.api_base }}
                              </span>
                            </button>
                          </div>
                        </div>

                        <!-- API 地址（自定义供应商时可编辑） -->
                        <div class="space-y-2">
                          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">API 地址</label>
                          <input
                            v-model="aiForm.api_base"
                            type="text"
                            :readonly="aiForm.provider !== 'custom'"
                            :placeholder="aiForm.provider === 'custom' ? '输入 OpenAI 兼容的 API 地址' : ''"
                            class="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                   bg-white dark:bg-gray-800
                                   focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                   text-gray-900 dark:text-gray-100
                                   placeholder-gray-400 dark:placeholder-gray-500"
                            :class="{ 'bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400': aiForm.provider !== 'custom' }"
                          />
                        </div>

                        <!-- 模型选择 -->
                        <div class="space-y-2">
                          <div class="flex items-center justify-between gap-3">
                            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">模型</label>
                            <span v-if="aiCurrentModel" class="text-xs text-gray-500 dark:text-gray-400">
                              当前生效: <span class="font-mono text-gray-700 dark:text-gray-300">{{ aiCurrentModel }}</span>
                            </span>
                          </div>
                          <div class="flex gap-2">
                            <select
                              v-if="currentProviderModels.length > 0"
                              v-model="aiForm.model"
                              class="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                     bg-white dark:bg-gray-800
                                     focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                     text-gray-900 dark:text-gray-100"
                            >
                              <option v-for="m in currentProviderModels" :key="m" :value="m">{{ m }}</option>
                              <option value="__custom__">自定义模型...</option>
                            </select>
                            <input
                              v-if="currentProviderModels.length === 0 || aiForm.model === '__custom__'"
                              v-model="aiCustomModel"
                              type="text"
                              placeholder="输入模型名称"
                              class="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600
                                     bg-white dark:bg-gray-800
                                     focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                     text-gray-900 dark:text-gray-100
                                     placeholder-gray-400 dark:placeholder-gray-500"
                            />
                          </div>
                        </div>

                        <!-- API Key -->
                        <div class="space-y-2">
                          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
                          <div class="relative">
                            <input
                              v-model="aiForm.api_key"
                              :type="showApiKey ? 'text' : 'password'"
                              placeholder="输入 API Key"
                              class="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-600
                                     bg-white dark:bg-gray-800
                                     focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                     text-gray-900 dark:text-gray-100
                                     placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm"
                            />
                            <button
                              type="button"
                              @click="showApiKey = !showApiKey"
                              class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Eye v-if="!showApiKey" class="w-4 h-4" />
                              <EyeOff v-else class="w-4 h-4" />
                            </button>
                          </div>
                          <p v-if="aiExistingConfig && !aiForm.api_key" class="text-xs text-gray-500 dark:text-gray-400">
                            当前密钥: {{ aiExistingConfig.api_key_masked }}
                            <span v-if="canKeepExistingApiKey">（留空则保持不变）</span>
                            <span v-else class="text-amber-500">（已切换供应商或 API 地址，需输入新 Key）</span>
                          </p>
                        </div>

                        <!-- 测试连接 + 状态提示 -->
                        <div class="flex items-center gap-3">
                          <BaseButton
                            @click="handleTestAI"
                            variant="secondary"
                            :disabled="aiTesting || !canTestAI"
                          >
                            {{ aiTesting ? '测试中...' : '测试连接' }}
                          </BaseButton>
                          <span v-if="aiTestResult" class="text-sm" :class="aiTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                            {{ aiTestResult.message }}
                          </span>
                        </div>

                        <!-- ====== 搜索增强 (Tavily) ====== -->
                        <div class="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                          <div class="flex items-center justify-between">
                            <div>
                              <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300">搜索增强</h5>
                              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                使用 Tavily 搜索 API 为 AI 分析提供网络搜索上下文，提升识别准确度
                              </p>
                            </div>
                            <button
                              @click="tavilyForm.enabled = !tavilyForm.enabled"
                              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                              :class="tavilyForm.enabled ? 'bg-gray-900 dark:bg-gray-600' : 'bg-gray-300 dark:bg-gray-700'"
                            >
                              <span
                                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                                :class="tavilyForm.enabled ? 'translate-x-6' : 'translate-x-1'"
                              />
                            </button>
                          </div>

                          <template v-if="tavilyForm.enabled">
                            <div class="space-y-2">
                              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Tavily API Key</label>
                              <div class="relative">
                                <input
                                  v-model="tavilyForm.api_key"
                                  :type="showTavilyKey ? 'text' : 'password'"
                                  placeholder="输入 Tavily API Key (tvly-...)"
                                  class="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 dark:border-gray-600
                                         bg-white dark:bg-gray-800
                                         focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500 duration-100
                                         text-gray-900 dark:text-gray-100
                                         placeholder-gray-400 dark:placeholder-gray-500 font-mono text-sm"
                                />
                                <button
                                  type="button"
                                  @click="showTavilyKey = !showTavilyKey"
                                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                  <Eye v-if="!showTavilyKey" class="w-4 h-4" />
                                  <EyeOff v-else class="w-4 h-4" />
                                </button>
                              </div>
                              <p v-if="tavilyExistingConfig && tavilyExistingConfig.tavily_api_key_masked && !tavilyForm.api_key" class="text-xs text-gray-500 dark:text-gray-400">
                                当前密钥: {{ tavilyExistingConfig.tavily_api_key_masked }}
                                <span v-if="tavilyExistingConfig.source === 'env'" class="text-amber-500">（来自环境变量）</span>
                                <span v-if="tavilyExistingConfig.source === 'database'">（留空则保持不变）</span>
                              </p>
                            </div>

                            <div class="flex items-center gap-3">
                              <BaseButton
                                @click="handleTestTavily"
                                variant="secondary"
                                :disabled="tavilyTesting || !tavilyForm.api_key"
                              >
                                {{ tavilyTesting ? '测试中...' : '测试 Tavily' }}
                              </BaseButton>
                              <span v-if="tavilyTestResult" class="text-sm" :class="tavilyTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                                {{ tavilyTestResult.message }}
                              </span>
                            </div>

                            <p class="text-xs text-gray-500 dark:text-gray-400">
                              <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" class="underline hover:text-gray-700 dark:hover:text-gray-300">Tavily</a>
                              免费版每月 1000 次搜索，无需信用卡
                            </p>
                          </template>
                        </div>

                        <!-- 状态提示 -->
                        <p v-if="aiMessage" class="text-sm" :class="aiError ? 'text-red-500' : 'text-green-600 dark:text-green-400'">
                          {{ aiMessage }}
                        </p>
                      </template>
                    </div>

                    <!-- 通知渠道：推送通道管理 -->
                    <div v-if="activeTab === 'channels'">
                      <ChannelsPanel />
                    </div>

                    <!-- 维护工具：批量重跑 AI 分析 -->
                    <div v-if="activeTab === 'maintenance'">
                      <BatchRerunPanel />
                    </div>

                  </div>
                </div>
              </div>

              <!-- 移动端 sticky Save/Reset 底栏（维护/通知渠道 tab 内置自己的操作，故隐藏） -->
              <div
                v-if="showMobileFooter"
                class="sm:hidden absolute bottom-0 inset-x-0 z-10 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80 backdrop-blur-md pb-safe"
              >
                <div class="grid grid-cols-2 gap-2 p-3">
                  <BaseButton
                    @click="resetSettings"
                    variant="secondary"
                    block
                    :disabled="isProfileSaving || isAvatarUploading"
                  >
                    重置
                  </BaseButton>
                  <BaseButton
                    @click="saveSettings"
                    variant="primary"
                    block
                    :disabled="isProfileSaving || isAvatarUploading"
                  >
                    {{ isProfileSaving ? '保存中...' : '保存' }}
                  </BaseButton>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { ArrowDown, ArrowUp, BadgeCheck, Camera, Code2, DollarSign, Eye, EyeOff, Gift, LayoutGrid, List, Monitor, Smartphone, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { LICENSES, SYSTEMS } from '@/types/constants'
import { isSignedIn, updateProfile, user } from '../lib/auth'
import { type AIConfig, type AIProvider, aiConfigService, type SearchConfig, searchConfigService } from '../services/aiConfig'
import { uploadService } from '../services/upload'
import BatchRerunPanel from './BatchRerunPanel.vue'
import BaseButton from './common/BaseButton.vue'
import ChannelsPanel from './subscription/ChannelsPanel.vue'

const props = defineProps<{
  isOpen: boolean
  initialSystems?: string[]
  initialLicenses?: string[]
  initialSort?: {
    field: string
    order: 'asc' | 'desc'
  }
  initialViewMode?: 'grid' | 'list'
}>()

// 首先定义正确的类型
interface SortSettings {
  field: string;  // 将 keyof Software 改为 string
  order: 'desc' | 'asc';
}

interface Settings {
  systems: string[];
  licenses: string[];
  sort: SortSettings;
  viewMode: 'grid' | 'list';
}

// 确保 emit 的类型定义正确
const emit = defineEmits<{
  'update:isOpen': [value: boolean];
  'update:settings': [settings: Settings];
}>();

// 导航标签页
type TabId = 'account' | 'filters' | 'sort' | 'view' | 'ai' | 'channels' | 'maintenance'
const tabs = computed(() => {
  const list: { id: TabId; label: string }[] = []
  if (isSignedIn.value) {
    list.push({ id: 'account', label: '账户设置' })
  }
  list.push(
    { id: 'filters', label: '筛选条件' },
    { id: 'sort', label: '排序方式' },
    { id: 'view', label: '布局设置' },
  )
  if (isSignedIn.value) {
    list.push(
      { id: 'ai', label: 'AI 设置' },
      { id: 'channels', label: '通知渠道' },
      { id: 'maintenance', label: '维护工具' },
    )
  }
  return list
})

// 当前选中的标签页
const activeTab = ref<TabId>('filters')

// 当前标签页信息
const currentTab = computed(() => tabs.value.find(tab => tab.id === activeTab.value))

// 移动端 sticky footer 是否显示：与桌面端左下 Save/Reset 同条件
const showMobileFooter = computed(() =>
  activeTab.value !== 'maintenance' && activeTab.value !== 'channels'
)

// 系统筛选设置
const selectedSystems = ref<string[]>(props.initialSystems || [])

// 授权类型筛选设置
const selectedLicenses = ref<string[]>(props.initialLicenses || [])

// 排序设置
const sortSettings = ref<SortSettings>({
  field: 'name',
  order: 'desc'
})

// 视图设置
const viewMode = ref<'grid' | 'list'>(props.initialViewMode || 'grid')
const closeButtonRef = ref<HTMLElement | null>(null)
const previousFocusedElement = ref<HTMLElement | null>(null)

// ===== 账户设置状态 =====
const editDisplayName = ref('')
const editAvatar = ref('')
const isAvatarUploading = ref(false)
const isProfileSaving = ref(false)
const profileMessage = ref('')
const profileError = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)

const profileInitial = computed(() => {
  const name = editDisplayName.value || user.value?.username || '?'
  return name.charAt(0).toUpperCase()
})

const triggerAvatarUpload = () => {
  if (isAvatarUploading.value) return
  avatarInput.value?.click()
}

const handleAvatarChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    isAvatarUploading.value = true
    profileMessage.value = ''
    const result = await uploadService.uploadIcon(file)
    editAvatar.value = result.path
  } catch (err) {
    profileMessage.value = err instanceof Error ? err.message : '上传头像失败'
    profileError.value = true
  } finally {
    isAvatarUploading.value = false
    if (avatarInput.value) avatarInput.value.value = ''
  }
}

const saveProfile = async () => {
  try {
    isProfileSaving.value = true
    profileMessage.value = ''
    profileError.value = false
    await updateProfile({
      displayName: editDisplayName.value,
      avatar: editAvatar.value,
    })
  } catch (err) {
    profileMessage.value = err instanceof Error ? err.message : '保存资料失败'
    profileError.value = true
  } finally {
    isProfileSaving.value = false
  }
}

// 切换系统筛选
const toggleSystem = (system: string) => {
  const index = selectedSystems.value.indexOf(system)
  if (index === -1) {
    selectedSystems.value.push(system)
  } else {
    selectedSystems.value.splice(index, 1)
  }
}

// 切换授权类型筛选
const toggleLicense = (license: string) => {
  const index = selectedLicenses.value.indexOf(license)
  if (index === -1) {
    selectedLicenses.value.push(license)
  } else {
    selectedLicenses.value.splice(index, 1)
  }
}

// 授权类型图标映射（保持设置面板中性观感，不引入语义色）
const licenseIcons: Record<string, typeof Gift> = {
  免费: Gift,
  收费: DollarSign,
  开源: Code2,
  已购: BadgeCheck,
}

// 重置设置
const resetSettings = () => {
  if (activeTab.value === 'maintenance') {
    return
  }
  if (activeTab.value === 'account') {
    editDisplayName.value = user.value?.displayName || ''
    editAvatar.value = user.value?.avatar || ''
    profileMessage.value = ''
    profileError.value = false
    return
  }
  if (activeTab.value === 'ai') {
    loadAIConfig()
    return
  }
  selectedSystems.value = []
  selectedLicenses.value = []
  sortSettings.value = {
    field: 'name',
    order: 'asc'
  }
  viewMode.value = 'grid'
}

// 保存设置
const saveSettings = async () => {
  if (activeTab.value === 'maintenance') {
    return
  }
  if (activeTab.value === 'account') {
    await saveProfile()
    if (profileError.value) return
    emit('update:isOpen', false)
    return
  }
  if (activeTab.value === 'ai') {
    await saveAISettings()
    return
  }
  emit('update:settings', {
    systems: selectedSystems.value,
    licenses: selectedLicenses.value,
    sort: sortSettings.value,
    viewMode: viewMode.value
  })
  emit('update:isOpen', false)
}

// 监听 props 变化
watch(() => props.initialSystems, (newSystems) => {
  if (newSystems) {
    selectedSystems.value = [...newSystems]
  }
}, { deep: true })

watch(() => props.initialLicenses, (newLicenses) => {
  if (newLicenses) {
    selectedLicenses.value = [...newLicenses]
  }
}, { deep: true })

watch(() => props.initialSort, (newSort) => {
  if (newSort) {
    sortSettings.value = { ...newSort }
  }
}, { deep: true })

watch(() => props.initialViewMode, (newMode) => {
  if (newMode) {
    viewMode.value = newMode
  }
})



// 对话框打开时初始化
watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      previousFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (user.value) {
        editDisplayName.value = user.value.displayName || ''
        editAvatar.value = user.value.avatar || ''
        profileMessage.value = ''
        profileError.value = false
      }
      await nextTick()
      closeButtonRef.value?.focus()
      return
    }
    const restoreTarget = previousFocusedElement.value
    if (restoreTarget) {
      nextTick(() => restoreTarget.focus())
    }
  }
)

// 切到 AI Tab 时加载配置（懒加载）
watch(activeTab, (tab) => {
  if (tab === 'ai' && aiProviders.value.length === 0) {
    loadAIConfig()
  }
})

// 修改点击处理器
const handleOrderChange = (order: 'asc' | 'desc') => {
  sortSettings.value.order = order
}

// ===== AI 设置状态 =====
const aiProviders = ref<AIProvider[]>([])
const aiExistingConfig = ref<AIConfig | null>(null)
const aiLoading = ref(false)
const aiTesting = ref(false)
const aiMessage = ref('')
const aiError = ref(false)
const aiTestResult = ref<{ success: boolean; message: string } | null>(null)
const showApiKey = ref(false)
const aiCustomModel = ref('')

const aiForm = ref({
  provider: '',
  api_base: '',
  api_key: '',
  model: '',
})

const currentProviderModels = computed(() => {
  const p = aiProviders.value.find(x => x.id === aiForm.value.provider)
  return p?.models || []
})

const aiCurrentModel = computed(() => aiExistingConfig.value?.model || '')

// ===== Tavily 搜索增强状态 =====
const tavilyExistingConfig = ref<SearchConfig | null>(null)
const tavilyTesting = ref(false)
const tavilyTestResult = ref<{ success: boolean; message: string } | null>(null)
const showTavilyKey = ref(false)

const tavilyForm = ref({
  enabled: false,
  api_key: '',
})

const canTestAI = computed(() => {
  const f = aiForm.value
  const hasKey = Boolean(f.api_key)
  const hasModel = f.model === '__custom__' ? Boolean(aiCustomModel.value) : Boolean(f.model)
  const hasBase = Boolean(f.api_base)
  return f.provider && hasKey && hasModel && hasBase
})

const selectProvider = (id: string) => {
  const p = aiProviders.value.find(x => x.id === id)
  if (!p) return
  aiForm.value.provider = id
  aiForm.value.api_base = p.api_base
  aiForm.value.model = p.models.length > 0
    ? (p.default_model || p.models[0] || '__custom__')
    : '__custom__'
  aiCustomModel.value = ''
  aiTestResult.value = null
  aiMessage.value = ''
}

const resolveModel = () => {
  if (aiForm.value.model === '__custom__') {
    return aiCustomModel.value.trim()
  }
  if (currentProviderModels.value.length === 0) {
    return (aiCustomModel.value || aiForm.value.model).trim()
  }
  return aiForm.value.model
}

const isProviderOrBaseChanged = () => {
  if (!aiExistingConfig.value) return false
  const currentBase = (aiForm.value.api_base || '').trim()
  const existingBase = (aiExistingConfig.value.api_base || '').trim()
  return aiExistingConfig.value.provider !== aiForm.value.provider || existingBase !== currentBase
}

const canKeepExistingApiKey = computed(() => {
  return Boolean(aiExistingConfig.value) && !isProviderOrBaseChanged()
})

const buildAIPayload = () => ({
  provider: aiForm.value.provider,
  api_base: aiForm.value.api_base,
  api_key: aiForm.value.api_key.trim(),
  model: resolveModel(),
})

const loadAIConfig = async () => {
  aiLoading.value = true
  aiMessage.value = ''
  aiError.value = false
  aiTestResult.value = null
  try {
    const [providers, config] = await Promise.all([
      aiConfigService.getProviders(),
      aiConfigService.getConfig(),
    ])
    // 并行加载 Tavily 配置
    loadTavilyConfig()
    aiProviders.value = providers
    aiExistingConfig.value = config

    if (config) {
      aiForm.value.provider = config.provider
      aiForm.value.api_base = config.api_base
      aiForm.value.api_key = ''

      const p = providers.find(x => x.id === config.provider)
      // 如果供应商没有预置模型，始终走自定义输入回填，确保当前模型可见
      if (!p || p.models.length === 0) {
        aiForm.value.model = '__custom__'
        aiCustomModel.value = config.model
      } else if (p.models.includes(config.model)) {
        aiForm.value.model = config.model
        aiCustomModel.value = ''
      } else {
        // 预置供应商下的自定义模型
        aiForm.value.model = '__custom__'
        aiCustomModel.value = config.model
      }
    } else if (providers.length > 0) {
      selectProvider(providers[0].id)
    }
  } catch (err) {
    aiMessage.value = err instanceof Error ? err.message : '加载 AI 配置失败'
    aiError.value = true
  } finally {
    aiLoading.value = false
  }
}

const handleTestAI = async () => {
  aiTesting.value = true
  aiTestResult.value = null
  try {
    const payload = buildAIPayload()
    if (!payload.api_key && aiExistingConfig.value) {
      throw new Error('请输入 API Key 后再测试')
    }
    const result = await aiConfigService.testConfig(payload)
    aiTestResult.value = { success: true, message: result.message }
  } catch (err) {
    aiTestResult.value = { success: false, message: err instanceof Error ? err.message : '测试失败' }
  } finally {
    aiTesting.value = false
  }
}

const handleTestTavily = async () => {
  tavilyTesting.value = true
  tavilyTestResult.value = null
  try {
    const result = await searchConfigService.testTavily(tavilyForm.value.api_key)
    tavilyTestResult.value = { success: true, message: result.message }
  } catch (err) {
    tavilyTestResult.value = { success: false, message: err instanceof Error ? err.message : '测试失败' }
  } finally {
    tavilyTesting.value = false
  }
}

const loadTavilyConfig = async () => {
  try {
    const config = await searchConfigService.getConfig()
    tavilyExistingConfig.value = config
    tavilyForm.value.enabled = config.tavily_enabled
    tavilyForm.value.api_key = ''
  } catch {
    // 搜索配置加载失败不阻塞 AI 设置
    tavilyExistingConfig.value = null
    tavilyForm.value.enabled = false
  }
}

const saveTavilySettings = async () => {
  const payload: { tavily_api_key?: string; tavily_enabled: boolean } = {
    tavily_enabled: tavilyForm.value.enabled,
  }
  if (tavilyForm.value.api_key) {
    payload.tavily_api_key = tavilyForm.value.api_key
  }
  await searchConfigService.saveConfig(payload)
  const config = await searchConfigService.getConfig()
  tavilyExistingConfig.value = config
  tavilyForm.value.api_key = ''
}

// 为移动端横向 tab 条隐藏滚动条（桌面端不生效）
// （放在 script 中只是为了就近维护；实际样式通过下方 <style> 注入）

const saveAISettings = async () => {
  aiMessage.value = ''
  aiError.value = false
  isProfileSaving.value = true
  try {
    const payload = buildAIPayload()
    const mustProvideApiKey = !aiExistingConfig.value || isProviderOrBaseChanged()
    if (!payload.api_key && mustProvideApiKey) {
      const reason = aiExistingConfig.value
        ? '切换供应商或 API 地址时，请输入新的 API Key'
        : 'API Key 不能为空'
      throw new Error(reason)
    }
    await aiConfigService.saveConfig(payload)

    // 同时保存 Tavily 搜索增强配置
    await saveTavilySettings()

    aiMessage.value = 'AI 配置已保存'
    const config = await aiConfigService.getConfig()
    aiExistingConfig.value = config
    aiForm.value.api_key = ''
  } catch (err) {
    aiMessage.value = err instanceof Error ? err.message : '保存 AI 配置失败'
    aiError.value = true
  } finally {
    isProfileSaving.value = false
  }
}
</script>

<style scoped>
/* 移动端横向 tab 条：隐藏滚动条，保留可滚动行为 */
.settings-mobile-tab-strip {
	scrollbar-width: none;
	-ms-overflow-style: none;
	scroll-snap-type: x proximity;
}

.settings-mobile-tab-strip::-webkit-scrollbar {
	display: none;
}

.settings-mobile-tab-strip > button {
	scroll-snap-align: start;
}
</style>
