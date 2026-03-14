# Bantu CRM P4-P7 后半程流水线实现完成

## 已实现的组件

### 1. P4: 合同签署 (`components/workspace/p4-contract.tsx`)
**功能:**
- 虚线边框的 PDF 拖拽上传区域
- 支持点击选择文件上传
- 合同状态显示 (待签署 / 已回传 / 归档中)
- 右侧显示合同预览缩略图和全屏预览按钮
- 备注输入框
- 上传时间戳记录

**交互:**
- 拖拽或点击上传 PDF
- 标记不同的合同状态
- 可编辑备注

---

### 2. P5: 财务确认 (`components/workspace/p5-finance.tsx`)
**功能:**
- 左侧显示收款详情 (银行账号/应收金额/已收金额/待收余额)
- 银行账号支持点击复制功能
- 应收/已收/待收金额使用大号等宽字体显示
- 收款状态指示器 (待收款 / 已确认 / 驳回)
- 右侧显示付款凭证缩略图
- "确认收款" 和 "驳回" 按钮 (财务角色可见)
- 驳回时可输入原因

**交互:**
- 实时计算待收余额
- 确认收款后显示确认时间
- 驳回时输入驳回原因，保存在记录中

---

### 3. P6: 材料提交 (`components/workspace/p6-materials.tsx`)
**功能:**
- 动态资料清单表格 (每行代表一项资料)
- 状态标签: [缺失 / 待审核 / 已通过 / 驳回]
- OCR 状态指示器 (待处理 / 已完成 / 失败)
- 完成进度条 (已通过数 / 总数)
- 操作列: 通过/驳回/删除按钮
- 驳回时可输入具体原因
- 支持新增材料行

**交互:**
- 编辑材料名称
- 标记审核状态 (待审核 → 通过 或 驳回)
- 输入驳回原因
- 添加/删除材料行
- 实时更新进度百分比

---

### 4. P7: 交付与完成 (`components/workspace/p7-delivery.tsx`)
**功能:**
- 左侧垂直进度时间轴，显示办件各阶段
- 每个进度节点有状态 (待处理 / 进行中 / 完成)
- 完成时记录时间戳
- 支持添加新的进度节点
- 右侧显示交付状态和最终文件下载区
- 最终凭证上传/下载功能
- "完成交付并关闭商机" 按钮
- 交付备注输入框

**交互:**
- 添加新的进度节点
- 点击按钮更新节点状态 (待处理 → 进行中 → 完成)
- 节点完成时自动记录时间戳
- 可删除进度节点
- 上传最终文件凭证

---

## 类型定义扩展 (`lib/types.ts`)

新增类型:
- `OpportunityP4Data`: 合同签署数据
- `OpportunityP5Data`: 财务确认数据
- `MaterialItem`: 单个材料项
- `OpportunityP6Data`: 材料提交数据
- `ProgressPoint`: 进度时间线点
- `OpportunityP7Data`: 交付完成数据
- 更新 `StageId` 为 `'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7'`
- 更新 `Opportunity` 接口添加 `p4Data`, `p5Data`, `p6Data`, `p7Data` 字段

---

## 数据流和集成

### WorkspacePane (`components/workspace/workspace-pane.tsx`)
- 根据 `viewingStage` 动态渲染 P1-P7 各个组件
- 所有 P4-P7 组件的数据变化通过 `onOpportunityUpdate` 回调保存到商机对象
- 底部操作栏支持各阶段的"推进"按钮流转

### BreadcrumbStepper (`components/workspace/breadcrumb-stepper.tsx`)
- 扩展显示全部 7 个阶段
- 支持点击切换查看各阶段
- 可达阶段 (已完成和当前) 可点击切换查看

### Mock 数据 (`lib/mock-data.ts`)
新增 4 个演示商机:
- `opp-007` (P4): 合同已回传
- `opp-008` (P5): 待收款确认
- `opp-009` (P6): 材料审核中
- `opp-010` (P7): 进度追踪中

---

## 设计规范遵循

✓ 极致紧凑: `text-[13px]`, `h-8` 按钮, `py-1.5` 行高
✓ 工业风格: 无阴影, `rounded-sm` 圆角, `#e5e7eb` 细线分割
✓ 数据对齐: 日期、金额、证件号使用 `font-mono`
✓ 状态驱动: UI 完全由数据状态控制
✓ 模块化: 每个阶段独立组件文件

---

## 使用示例

```tsx
// 在 app/page.tsx 中集成
<WorkspacePane
  opportunity={selectedOpportunity}
  allProducts={mockProducts}
  viewingStage={viewingStage}
  onViewingStageChange={setViewingStage}
  onOpportunityUpdate={handleOpportunityUpdate}
  onSave={handleSave}
  onAdvanceStage={handleAdvanceStage}
  onQuoteSent={handleQuoteSent}
/>
```

---

## 后续可扩展功能

1. **文件上传集成**: 替换模拟的 URL 为真实的 OSS 上传
2. **审计流集成**: 每个操作自动添加 ActionLog 记录
3. **权限控制**: 根据用户角色显示/隐藏操作按钮
4. **企业微信 SSO**: 集成企业微信登录状态显示
5. **并发控制**: 添加乐观锁或版本控制
6. **工作流通知**: 推进阶段时发送通知
