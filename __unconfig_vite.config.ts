
let __unconfig_data;
let __unconfig_stub = function (data = {}) { __unconfig_data = data };
__unconfig_stub.default = (data = {}) => { __unconfig_data = data };
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { splitVendorChunkPlugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
// 自动按需引入组件与图标
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

const __unconfig_default =  defineConfig({
  plugins: [
    vue(),
    splitVendorChunkPlugin(),
    Components({
      resolvers: [
        IconsResolver({
          prefix: 'i',
          enabledCollections: ['simple-icons', 'logos', 'uil']
        })
      ]
    }),
    Icons({
      compiler: 'vue3',
      autoInstall: true
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // 开发服务器配置
  server: {
    host: '0.0.0.0', // 监听所有网络接口，包括本机IP
    port: 5173,      // 默认端口
    strictPort: false, // 端口被占用时自动尝试下一个可用端口
    open: false      // 不自动打开浏览器
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', '@headlessui/vue'],
          'icons': ['lucide-vue-next'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除调试器并将非错误日志作为纯函数移除，保留 console.error
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      }
    }
  }
})
if (typeof __unconfig_default === "function") __unconfig_default(...[{"command":"serve","mode":"development"}]);export default __unconfig_data;