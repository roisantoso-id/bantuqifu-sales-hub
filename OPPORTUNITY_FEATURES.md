# 商机管理功能实现文档

## 功能概述

本次实现了商机管理的核心功能，包括数据血缘追溯和手动新建商机两大模块。

## 1. 数据血缘与共享跟进记录

### 核心概念

当线索转化为商机后，商机不仅继承线索的字段数据，还能追溯"前世今生"，查看线索阶段的所有沟通记录。

### 后端实现

#### A. 商机 Actions (`app/actions/opportunity.ts`)

**主要功能：**

1. **getOpportunityTimelineAction** - 获取商机完整时间轴
   - 查询商机信息，获取关联的 `convertedFromLeadId`
   - 联合查询商机阶段和线索阶段的跟进记录
   - 返回统一的时间轴数据

2. **createOpportunityAction** - 手动新建商机
   - 支持非线索转化的商机创建（如老客户复购）
   - 自动生成商机编号（格式：OPP-YYMMDD-XXXX）
   - 默认进入 P1（初步接触）阶段
   - 自动记录系统日志

3. **getOpportunitiesAction** - 获取商机列表
   - 支持多维度过滤（状态、阶段、负责人、客户）
   - 租户隔离

4. **updateOpportunityStageAction** - 更新商机阶段
   - 自动记录阶段变更日志

#### B. 交互记录增强 (`app/actions/interaction.ts`)

新增 **getOpportunityTimelineWithLeadHistoryAction**：
- 统一查询商机和线索的跟进记录
- 支持数据血缘追溯

### 前端组件

#### 1. OpportunityHeader (`components/opportunities/opportunity-header.tsx`)

**功能：**
- 展示商机基本信息（编号、标题、金额、状态）
- 数据血缘徽章：显示"转化自线索"或"手动新建"
- 点击线索ID可快速查看原始线索信息

**使用示例：**
```tsx
import { OpportunityHeader } from '@/components/opportunities/opportunity-header'

<OpportunityHeader
  opportunity={opportunityData}
  onViewLead={(leadId) => {
    // 处理查看线索逻辑
    console.log('View lead:', leadId)
  }}
/>
```

#### 2. OpportunityTimeline (`components/opportunities/opportunity-timeline.tsx`)

**功能：**
- 展示商机的完整跟进时间轴
- 自动加载线索阶段的历史记录
- 区分线索阶段和商机阶段的记录（蓝色徽章标识）
- 支持多种交互类型（备注、电话、拜访、会议、邮件、阶段变更、系统）

**使用示例：**
```tsx
import { OpportunityTimeline } from '@/components/opportunities/opportunity-timeline'

<OpportunityTimeline opportunityId={oppId} />
```

#### 3. CreateOpportunityDialog (`components/opportunities/create-opportunity-dialog.tsx`)

**功能：**
- 手动新建商机对话框
- 表单字段：
  - 商机标题（必填）
  - 服务类型（签证、公司注册、税务等）
  - 预估金额和币种（必填）
  - 预计成交日期
  - 需求描述
- 自动关联客户
- 创建成功后自动刷新列表

**使用示例：**
```tsx
import { CreateOpportunityDialog } from '@/components/opportunities/create-opportunity-dialog'

<CreateOpportunityDialog
  customerId={customer.id}
  customerName={customer.name}
  isOpen={dialogOpen}
  onClose={() => setDialogOpen(false)}
  onSuccess={() => {
    // 刷新商机列表
    refreshOpportunities()
  }}
/>
```

## 2. 数据模型

### OpportunityRow 接口

```typescript
interface OpportunityRow {
  id: string
  organizationId: string
  opportunityCode: string              // 商机编号
  customerId: string                   // 关联客户
  convertedFromLeadId?: string | null  // 转化来源线索ID（数据血缘）
  stageId: string                      // 当前阶段
  status: string                       // 状态：active/won/lost
  serviceType: string                  // 服务类型
  serviceTypeLabel?: string | null     // 服务类型标签
  estimatedAmount: number              // 预估金额
  currency: string                     // 币种
  requirements?: string | null         // 需求描述
  notes?: string | null                // 备注
  assigneeId?: string | null           // 负责人
  expectedCloseDate?: string | null    // 预计成交日期
  actualCloseDate?: string | null      // 实际成交日期
  createdAt: string
  updatedAt: string
}
```

## 3. 使用场景

### 场景 1：线索转化为商机

1. 在线索列表中点击"转为商机"
2. 选择关联客户
3. 系统自动创建商机，继承线索数据
4. `convertedFromLeadId` 字段记录数据血缘
5. 商机详情页可查看线索阶段的所有跟进记录

### 场景 2：老客户复购（手动新建商机）

1. 在客户详情页点击"新建关联商机"
2. 填写商机信息（标题、金额、服务类型等）
3. 系统创建商机，`convertedFromLeadId` 为 null
4. 商机头部显示"手动新建"徽章

### 场景 3：查看商机完整历史

1. 打开商机详情页
2. 查看 OpportunityHeader，了解商机来源
3. 查看 OpportunityTimeline，浏览完整跟进历史
4. 线索阶段的记录带有"线索阶段"蓝色徽章

## 4. 技术要点

### 数据血缘追溯

- 通过 `convertedFromLeadId` 字段建立线索和商机的关联
- 使用 Supabase 的 `OR` 查询同时获取两个阶段的数据
- 前端通过徽章和颜色区分不同阶段的记录

### 租户隔离

- 所有查询都通过 `getCurrentTenantId()` 获取租户上下文
- 确保数据安全和多租户隔离

### 自动日志记录

- 商机创建、阶段变更等操作自动记录到 interactions 表
- 便于审计和追溯

## 5. 下一步扩展

1. **商机看板视图**：按阶段展示商机卡片
2. **商机转化漏斗**：可视化展示各阶段转化率
3. **商机预测**：基于历史数据预测成交概率
4. **批量操作**：批量分配、批量变更阶段
5. **商机模板**：预设常见服务类型的商机模板

## 6. API 参考

### Server Actions

```typescript
// 获取商机时间轴（含线索历史）
getOpportunityTimelineAction(oppId: string)

// 手动新建商机
createOpportunityAction(data: {
  customerId: string
  title: string
  serviceType: string
  estimatedAmount: number
  currency?: string
  requirements?: string
  expectedCloseDate?: string
})

// 获取商机列表
getOpportunitiesAction(filters?: {
  status?: string
  stageId?: string
  assigneeId?: string
  customerId?: string
})

// 更新商机阶段
updateOpportunityStageAction(oppId: string, newStageId: string)

// 更新商机信息
updateOpportunityAction(oppId: string, updates: Partial<OpportunityRow>)
```

## 7. 文件清单

### 新增文件

- `app/actions/opportunity.ts` - 商机相关 Server Actions
- `components/opportunities/opportunity-header.tsx` - 商机头部组件
- `components/opportunities/opportunity-timeline.tsx` - 商机时间轴组件
- `components/opportunities/create-opportunity-dialog.tsx` - 新建商机对话框

### 修改文件

- `app/actions/interaction.ts` - 新增商机时间轴查询函数

## 8. 测试建议

1. **数据血缘测试**：
   - 创建线索 → 转化为商机 → 验证商机头部显示"转化自线索"
   - 查看商机时间轴，确认包含线索阶段的记录

2. **手动新建测试**：
   - 在客户详情页新建商机
   - 验证商机头部显示"手动新建"
   - 确认 `convertedFromLeadId` 为 null

3. **时间轴测试**：
   - 在线索阶段添加跟进记录
   - 转化为商机后，验证时间轴包含线索记录
   - 在商机阶段添加新记录，验证正确显示

4. **租户隔离测试**：
   - 切换租户，验证只能看到当前租户的商机
   - 尝试访问其他租户的商机，应返回空或错误
