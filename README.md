# 软件记录管理系统

一个基于 Vue 3 + TypeScript 开发的软件记录管理系统，用于管理和展示各类软件信息。

## 🚀 技术栈

- **前端**: Vue 3 + TypeScript + Tailwind CSS
- **后端**: Express.js + Node.js
- **数据库**: PostgreSQL
- **认证**: Clerk
- **构建工具**: Vite
- **动画**: GSAP

## ✨ 主要功能

- 软件信息管理（增删改查）
- 软件对比分析
- 分类筛选和搜索
- 用户认证系统
- 响应式设计 + 暗色模式

## 📁 项目结构

```text
├── src/                # 前端源码
│   ├── components/     # Vue 组件
│   ├── services/       # 业务逻辑服务
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   └── App.vue         # 主应用组件
├── server/             # 后端源码
│   ├── index.js        # Express 服务器
│   └── database.js     # 数据库配置
└── package.json        # 项目配置
```

## 🛠️ 开发环境

### 环境要求
- Node.js 18+
- npm / pnpm

### 环境变量
参考 `env.example` 创建 `.env` 或 `.env.local`，关键项：

```env
# 后端服务
PORT=3001
JSON_LIMIT=1mb
CORS_ORIGINS=http://localhost:5173

# PostgreSQL（或使用 DATABASE_URL）
PGHOST=localhost
PGPORT=5432
PGDATABASE=Softwares
PGUSER=postgres
PGPASSWORD=your_password
PGSSL=false

# 腾讯云 COS（填写后务必轮换旧密钥并清理历史）
COS_SECRET_ID=
COS_SECRET_KEY=
COS_BUCKET=
COS_REGION=ap-guangzhou
COS_STORAGE_PATH=AppArchive/
COS_DOMAIN=https://<bucket>.cos.<region>.myqcloud.com

# AI
KIMI_API_KEY=sk-xxxxxx
KIMI_API_BASE=https://api.moonshot.cn/v1

# 认证
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_API_BASE_URL=http://your-server-ip:3001/api
```

> 密钥曾经入库的请立即吊销旧密钥并清理 Git 历史。后台仅接受带 `X-User-Id` 的请求。

### 快速开始

1. 安装依赖
   
   ```bash
   npm install
   ```

2. 启动开发环境
   
   ```bash
   # 方式一：同时启动前后端（推荐）
   npm run dev:full
   
   # 方式二：分别启动
   npm run server    # 启动后端服务器 (端口3001)
   npm run dev       # 启动前端开发服务器 (端口5173)
   ```
  
   > 注意：`dev:full` 使用 `concurrently` 确保跨平台兼容性

3. 网络访问配置
   
   - **本地访问**: [http://localhost:5173/](http://localhost:5173/)
   - **IP访问**: [http://你的本机IP:5173/](http://你的本机IP:5173/)
   - **移动端测试**: 确保设备在同一网络下
  
   > 提示：前后端都已配置监听所有网络接口，支持通过 IP 地址访问

4. 构建生产版本
   
   ```bash
   npm run build
   ```

## 🗄️ 数据库迁移
- 配置好 PG 环境变量后执行 `npm run migrate:up` 完成当前 schema。
- 仅在本地/测试需要回滚时使用 `npm run migrate:down`。
- 服务启动不再自动执行 DDL，如日志出现 `[SCHEMA]` 提示，请先跑迁移。

## 🖼️ 图标下载脚本
- 配置好 PG 环境变量后执行 `npm run download-icons`，会把外链图标下载到 `public/icons` 并回写数据库字段 `softwares.icon`。

## 🔒 认证与限流
- 所有写接口（新增/更新/删除/上传/AI）需要 `X-User-Id` 请求头；前端通过 Clerk 自动附带。
- 上传/AI/写接口已启用速率限制（默认 15 分钟窗口），可用环境变量 `UPLOAD_MAX`/`AI_MAX`/`WRITE_MAX` 调整。
- 上传 MIME/大小在后端复核，日志会记录耗时与失败原因。

## ✅ 手动验证清单
- 跑通 `npm run migrate:up`，启动后端无 `[SCHEMA]` 警告。
- 未登录请求写接口返回 401，登录后正常。
- 上传非图片或超限文件返回 400；频繁上传命中 429。
- 打开“对比结果”弹窗默认展示详情，不再空白。
- 图片多次加载后无 `localStorage` 满额报错（已改为 IndexedDB 缓存）。

## ❓ 常见问题排查（通用）

- 无法解析 `vuenime`：报错 `[plugin:vite:import-analysis] Failed to resolve import "vuenime" from "src/main.ts"`。
  - 原因：项目未安装该依赖，且当前未实际使用。
  - 解决：已在本仓库移除相关导入与类型声明。如确需使用请安装 `npm i vuenime` 并在 `src/main.ts` 中 `app.use(Vuenime)`。
- 端口被占用（如 5173/3001）：结束占用进程或修改端口后重启。
  - Windows 可在 PowerShell 使用 `Get-Process -Id <PID>` / `Stop-Process -Id <PID>`。

## 📝 数据模型

### 软件信息
```typescript
interface Software {
  id: number
  name: string
  category: string
  description: string
  icon: string
  license: '免费' | '收费' | '开源' | '已购'
  systems: ('Windows' | 'Android')[]
  website: string
  pros: string[]
  cons: string[]
}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

MIT License

## 🔌 AI 使用说明（Kimi 后端代理）

- 项目已内置后端代理调用 Kimi，前端不会直接携带 API Key。
- 后端新增路由：
  - `POST /api/ai/analyze`：软件优缺点分析，Body: `{ software }`
  - `POST /api/ai/compare`：多软件对比分析，Body: `{ softwares }`
- 后端会从环境变量读取 `KIMI_API_KEY`，并调用 `https://api.moonshot.cn/v1/chat/completions`。

### 常见问题排查
- 500 后端缺少 Key：请在项目根目录 `.env.local` 或部署环境中设置 `KIMI_API_KEY=sk-...`
- 401 Invalid Authentication：确认使用的是 Kimi 平台颁发的 Key，且未过期/未禁用。
- Windows 保存 `.env.local` 可能变为 `.env.local.txt`：请检查真实扩展名。
- 如果你想继续前端直连（不推荐），可设置 `VITE_KIMI_API_KEY` 并修改前端代码，但存在泄露风险。

> 文档参考：Kimi 开放平台使用指南（`https://platform.moonshot.cn/docs/guide/start-using-kimi-api`）