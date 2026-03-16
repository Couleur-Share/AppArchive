# 软件记录管理系统

一个基于 Vue 3 + TypeScript 开发的软件记录管理系统，用于管理和展示各类软件信息。

## 🚀 技术栈

- **前端**: Vue 3 + TypeScript + Tailwind CSS
- **后端**: Express.js + Node.js
- **数据库**: PostgreSQL
- **认证**: 自建 JWT（bcrypt + jsonwebtoken）
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

## 🎨 品牌与图标资源

- 站点头部 Logo：`public/logo-header.svg`（在 `src/components/layout/AppHeader.vue` 中使用）
- Favicon 资源：
  - `public/favicon.ico`
  - `public/favicon.svg`
  - `public/favicon-16x16.png`
  - `public/favicon-32x32.png`
  - `public/favicon-96x96.png`
- PWA/Manifest 资源：
  - `public/site.webmanifest`
  - `public/web-app-manifest-192x192.png`
  - `public/web-app-manifest-512x512.png`

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
# 多个来源用逗号分隔；生产环境请把你的 https 域名也加上
CORS_ORIGINS=http://localhost:5173,https://your-domain.com

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

# AI 配置通过界面管理，不再需要环境变量

# 认证（自建 JWT）
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# 生产环境（HTTPS）推荐使用同源 /api（需在反向代理中把 /api 转发到后端 3001）
VITE_API_BASE_URL=/api
```

> 密钥曾经入库的请立即吊销旧密钥并清理 Git 历史。写接口需要 JWT 认证（`Authorization: Bearer <token>`）。

### 快速开始

1. 安装依赖
   
   ```bash
   npm install
   ```

2. 启动开发环境（前后端同时）
   
   ```bash
   npm run dev
   ```

   > `npm run dev` 已通过 `concurrently` 同时启动后端（3001）和前端（5173）

3. 仅启动后端服务（可选）

   ```bash
   npm run server
   ```

4. 网络访问配置
   
   - **本地访问**: [http://localhost:5173/](http://localhost:5173/)
   - **IP访问**: [http://你的本机IP:5173/](http://你的本机IP:5173/)
   - **移动端测试**: 确保设备在同一网络下
  
   > 提示：前后端都已配置监听所有网络接口，支持通过 IP 地址访问

5. 构建生产版本
   
   ```bash
   npm run build
   ```

## 🧰 常用脚本
- `npm run dev`：并行启动前后端开发服务。
- `npm run server`：仅启动后端服务。
- `npm run build`：构建前端生产包。
- `npm run start`：启动后端服务（生产环境常用）。
- `npm run lint`：运行 Biome 检查。
- `npm run format`：使用 Biome 格式化代码。
- `npm run deploy:local`：执行本地部署脚本。
- `npm run full-rebuild`：执行全量重建脚本。

## 🗄️ 数据库迁移
- 当前仓库未配置 `npm run migrate:up/down` 快捷命令。
- 如需补齐 `related_articles` 字段，可执行：

```bash
node scripts/migrate-related-articles.js
```

- 若后端日志出现 `[SCHEMA]` 提示，请按日志缺失字段执行对应迁移脚本或手动 SQL 迁移。

## 🔒 认证与限流
- 所有写接口（新增/更新/删除/上传/AI）需要 JWT 认证（`Authorization: Bearer <token>`）。
- 首次使用需执行 `node scripts/migrate-users.js` 创建 users 表和初始管理员账户。
- 上传/AI/写接口已启用速率限制（默认 15 分钟窗口），可用环境变量 `UPLOAD_MAX`/`AI_MAX`/`WRITE_MAX` 调整。
- 上传 MIME/大小在后端复核，日志会记录耗时与失败原因。

## ✅ 手动验证清单
- 启动后端后无 `[SCHEMA]` 迁移警告。
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

### HTTPS 域名访问提示（Mixed Content）
- 若你用 `https://your-domain.com` 访问前端，但前端去请求 `http://.../api`，浏览器会拦截并出现“获取数据失败 / Mixed Content”。
- 生产环境推荐做法：
  - **域名(443)反向代理到后端 3001**（或至少把 `/api` 反代到 3001）
  - 构建时设置 `VITE_API_BASE_URL=/api`，然后重新构建再部署

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
  related_articles: RelatedArticle[]
}

interface RelatedArticle {
  id: string
  title: string
  url: string
  type: 'document' | 'tips' | 'faq' | 'changelog' | 'other'
  description?: string
  sortOrder: number
}
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

MIT License

## 🔌 AI 使用说明

- AI 功能通过界面配置，无需手动编辑环境变量。
- 首次使用请执行迁移脚本创建 `ai_config` 表：
  ```bash
  node scripts/migrate-ai-config.js
  ```
- 登录后进入「设置 → AI 设置」，选择供应商、模型并填写 API Key。
- 支持的供应商：Perplexity、OpenAI、Moonshot (Kimi)、DeepSeek、自定义 (OpenAI 兼容)。
- API Key 在数据库中以 AES-256-GCM 加密存储，前端不会接触明文密钥。
- 后端 AI 路由：
  - `POST /api/ai/analyze`：软件优缺点分析，Body: `{ software }`
  - `POST /api/ai/compare`：多软件对比分析，Body: `{ softwares }`
  - `GET /api/ai/providers`：获取支持的供应商列表
  - `GET /api/ai/config`：获取当前 AI 配置（脱敏）
  - `PUT /api/ai/config`：保存 AI 配置
  - `POST /api/ai/config/test`：测试 AI 配置连通性

### 常见问题排查
- AI 分析提示"AI 尚未配置"：请在「设置 → AI 设置」中完成配置。
- 401 认证失败：确认 API Key 正确且未过期。
- 配置保存后可点击"测试连接"验证是否生效。