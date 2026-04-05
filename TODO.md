- [x] **Step 1: 开发通用表单组件 `components/interactions/interaction-form.tsx`**
  - 交互类型 Select
  - 记录内容 Textarea
  - 下一步计划 Input
  - 下次跟进时间 DatePicker
  - 提交 loading 状态

- [x] **Step 2: 开发时间轴展示组件 `components/interactions/interaction-timeline.tsx`**
  - 垂直时间轴布局
  - 不同 InteractionType 图标与颜色
  - 展示内容、时间、操作人、附件

- [x] **Step 3: 开发智能容器组件 `components/interactions/interaction-manager.tsx`**
  - 挂载时加载 timeline
  - 商机模式支持合并 lead 历史
  - 提交后乐观更新或重新拉取
  - 通过现有 Server Actions 获取附件

- [x] **Step 4: 导出与文档记录**
  - `components/interactions/index.ts` 导出
  - 更新 TODO 状态
  - 控制台汇报完成
