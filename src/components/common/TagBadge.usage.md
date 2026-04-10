# TagBadge 使用规范

`TagBadge` 是项目内统一的标签组件，用于替代零散的手写 `span` 胶囊样式。

## 基础示例

```vue
<TagBadge size="xs" variant="neutral">未分类</TagBadge>
<TagBadge size="sm" variant="primary" strong>GPT-4.1</TagBadge>
```

## 可选参数

- `variant`: `neutral` | `primary` | `info` | `success` | `warning` | `danger` | `violet` | `fuchsia`
- `size`: `xs` | `sm` | `md`
- `radius`: `md` | `full`
- `strong`: `true | false`（加粗）

## 推荐语义映射

- 统一函数：`getLicenseTagVariant()`（`src/utils/license.ts`）
- 授权 `免费` -> `info`
- 授权 `收费` -> `primary`
- 授权 `开源` -> `success`
- 授权 `已购` -> `violet`
- 风险/告警 -> `danger`
- 状态提示（如缓存/预发布）-> `warning`
