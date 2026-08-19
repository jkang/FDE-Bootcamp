# DESIGN.md · 分仓智能补货 Agent 原型设计系统

> **锚定优先级：** P3 中性默认
> **锚定来源：** 无（FDE 未提供客户品牌规范/参照物，暂用中性占位）
> **版本：** v1.0 | **更新日期：** 2026-08-16
> **锁定状态：** ⚠️ 未锁定（兜底）

> ⚠️ **本 DESIGN.md 处于未锁定状态。** 所有 token 为中性占位，客户 / FDE 规范确认后必须覆盖，HTML 原型会通过替换 `assets/tokens.css` 一键切换而无需重做页面。

## 1. Visual Theme & Atmosphere（视觉主题与气质）

- **一句话气质：** 专业、克制、企业级 SaaS 气质，偏供应链计划工作台
- **密度取向：** 中高（分货数据密集，信息密度重于动效）
- **光影取向：** 浅色为主，阴影极少，依赖描边分层
- **Agentic 特质强调：** Thinking 区与正文视觉差异化；Tool Call 有独立卡片；HITL 触发有显式强提示
- **参考气质：** 企业级 SaaS 中性（Tailwind slate + indigo）

## 2. Color Palette & Roles（颜色调色板与语义角色）

| 语义名 | Hex | Tailwind 近似 | 用途 |
|---|---|---|---|
| color.accent.primary | #4F46E5 | indigo-600 | 主按钮、关键链接、Agent 头像 |
| color.accent.muted | #EEF2FF | indigo-50 | 主色背景弱化 |
| color.success | #10B981 | emerald-500 | 成功状态、在线指示 |
| color.warning | #F59E0B | amber-500 | HITL 待确认、中风险 |
| color.danger | #EF4444 | red-500 | 错误、破坏性动作 |
| color.text.primary | #0F172A | slate-900 | 正文主文字 |
| color.text.secondary | #475569 | slate-600 | 辅助文字 |
| color.text.muted | #94A3B8 | slate-400 | 占位/提示 |
| color.border | #E2E8F0 | slate-200 | 常规描边 |
| color.surface.base | #FFFFFF | white | 主要表面 |
| color.surface.subtle | #F8FAFC | slate-50 | 次要表面 |
| color.thinking.bg | #F5F3FF | violet-50 | Agent 思考区背景 |
| color.thinking.text | #6D28D9 | violet-700 | Agent 思考区文字 |

## 3. Typography Rules（字体规则）

| 级别 | 字号/行高/字重 | 用途 | 字体 |
|---|---|---|---|
| display | 28/36/600 | 导航页标题 | Inter 600 |
| title | 20/28/600 | 页面主标题、Artifact 标题 | Inter 600 |
| section | 16/24/600 | 分段标题 | Inter 600 |
| body | 14/22/400 | 正文、气泡文字 | Inter 400 |
| caption | 12/18/400 | 辅助文字、徽章、时间戳 | Inter 400 |
| mono | 13/20/500 | Thinking 区、工具调用 | SF Mono/ui-monospace |

- **字体族：** Inter + 系统等宽
- **字重用法：** 400/500/600 三档

## 4. Component Stylings（组件样式）

- **Button：** primary(indigo)/secondary(白描边)/ghost/danger；圆角 10px
- **Chat Bubble：** user 右对齐 indigo 底、agent 左对齐白底描边
- **Tool Call Card：** 灰底、mono 字体、状态图标
- **State Badge：** 药丸徽章（idle 灰/thinking 紫/tool_calling 蓝/awaiting_human 黄/error 红）
- **HITL Banner：** amber 底 + 描边 + 「待你确认」徽章
- **Citation Footnote：** 内联 [n] 脚标 + 悬浮来源卡
- **Input Textarea：** 白底描边、圆角 10px

## 5. Layout Principles（布局原则）

- **三栏主布局：** 左 Shell 240px / 中 Conversation Pane 弹性 / 右 Artifact Pane 440px
- **间距单位：** 4/8/12/16/20/24/32（禁用奇数 px）

## 6. Depth & Elevation（深度与层级）

- 阴影最多 3 级：shadow.0 / shadow.1 / shadow.2
- 圆角：卡片 12px、按钮 10px、小标签 8px、徽章 999px

## 7. Do's and Don'ts

- ✅ 用描边分层，少用阴影；✅ 痛点/风险用 amber/red 强调，不用大面积色块；✅ HITL 强提示
- ❌ 深色模式；❌ 大面积渐变/动效；❌ 硬编码魔术色（一律走 tokens.css）

## 8. Responsive Behavior（响应式）

- 原型阶段仅保证桌面（≥1280px）完美

## 9. Agent Prompt Guide（给后续工程/AI 的快速上下文）

```
你是「分仓智能补货」Agent 产品中的分货方案助理，服务于伊利奶粉事业部物流计划岗。
目标：在基地仓→销售仓分货补货场景下，通过多约束全局优化，提升分货效率、分仓有货率、周转率、新鲜度。
职责：识别全仓网缺口、算优先级/备货率/分配量、生成补货单并校验、跟踪在途/入库、出复盘调参建议。
约束：任何补货单下发前必须经人工确认；分配量偏离建议量需解释；不得脱离库存/在途/效期约束。
语气：专业、克制、数字驱动。
```
