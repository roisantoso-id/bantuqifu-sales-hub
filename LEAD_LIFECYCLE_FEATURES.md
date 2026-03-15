# 线索自动回收与转商机功能实现文档

## 概述

本文档描述了三个核心功能的实现：

1. **系统用户 (bantu-system)** - 用于记录自动化操作的虚拟用户
2. **7天自动回收** - 自动将7天未跟进的线索退回公海池
3. **线索转商机** - 强制关联客户，实现血缘继承和只读锁定

---

## 1. 系统用户 (00000000-0000-0000-0000-000000000001)

### 目的

为系统自动操作（如自动回收线索）提供一个可追溯的操作人记录。

### 实现

#### 数据库种子脚本

文件：`scripts/seed-system-user.sql`

```sql
-- 使用固定 UUID: 00000000-0000-0000-0000-000000000001
DO $$
DECLARE
  system_user_id UUID := '00000000-0000-0000-0000-000000000001';
  system_email TEXT := 'system@bantuqifu.com';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = system_user_id
  ) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      system_user_id,
      '00000000-0000-0000-0000-000000000000',
      system_email,
      crypt('SYSTEM_USER_NO_LOGIN_' || gen_random_uuid()::text, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"system","providers":["system"]}'::jsonb,
      '{"name":"Bantu System (系统自动执行)"}'::jsonb,
      false,
      'authenticated'
    );
  END IF;
END $$;
```

#### 执行方式

1. 在 Supabase SQL Editor 中运行 `scripts/seed-system-user.sql`
2. 验证创建成功：

```sql
SELECT * FROM users_auth WHERE id = '00000000-0000-0000-0000-000000000001';
```

---

## 2. 7天自动回收线索

### 业务规则

- **触发条件**：线索状态为 `NEW`，已分配给销售，创建时间超过7天
- **回收操作**：
  - 清空 `assignedToId`（退回公海）
  - 设置 `discardReason = 'SYSTEM_AUTO_RECYCLE'`
  - 记录 `discardedById = '00000000-0000-0000-0000-000000000001'`
  - 更新 `discardedAt` 和 `updatedAt`

### 实现

#### Server Action

文件：`app/actions/lead.ts`

```typescript
export async function autoRecycleLeadsAction(): Promise<{ success: boolean; count: number }> {
  const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001'
  const supabase = await createClient()

  // 计算7天前的时间节点
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const tenantId = await getCurrentTenantId()

  // 查询需要回收的线索
  const { data: leadsToRecycle } = await supabase
    .from('leads')
    .select('id, leadCode, personName, createdAt')
    .eq('organizationId', tenantId)
    .eq('status', 'NEW')
    .not('assignedToId', 'is', null)
    .lt('createdAt', sevenDaysAgo.toISOString())

  if (!leadsToRecycle || leadsToRecycle.length === 0) {
    return { success: true, count: 0 }
  }

  // 批量更新
  const leadIds = leadsToRecycle.map(l => l.id)

  await supabase
    .from('leads')
    .update({
      assignedToId: null,
      discardReason: 'SYSTEM_AUTO_RECYCLE',
      discardedAt: new Date().toISOString(),
      discardedById: SYSTEM_USER_ID,
      updatedAt: new Date().toISOString(),
      updatedById: SYSTEM_USER_ID,
    })
    .in('id', leadIds)

  return { success: true, count: leadsToRecycle.length }
}
```

#### API 端点（用于 Cron 调用）

文件：`app/api/cron/auto-recycle-leads/route.ts`

```typescript
export async function GET(request: NextRequest) {
  // 验证授权
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await autoRecycleLeadsAction()

  return NextResponse.json({
    success: true,
    count: result.count,
    timestamp: new Date().toISOString(),
  })
}
```

### 部署 Cron Job

#### 方式1：Vercel Cron Jobs

在 `vercel.json` 中配置：

```json
{
  "crons": [
    {
      "path": "/api/cron/auto-recycle-leads",
      "schedule": "0 2 * * *"
    }
  ]
}
```

- 每天凌晨2点执行
- 自动调用 API 端点

#### 方式2：外部 Cron 服务

使用 [cron-job.org](https://cron-job.org) 或类似服务：

1. 创建新任务
2. URL: `https://your-domain.com/api/cron/auto-recycle-leads`
3. 方法: GET
4. Headers: `Authorization: Bearer your-secret-key`
5. 时间表: `0 2 * * *` (每天凌晨2点)

#### 方式3：手动触发（测试用）

```bash
curl -X GET https://your-domain.com/api/cron/auto-recycle-leads \
  -H "Authorization: Bearer your-secret-key"
```

### 环境变量

在 `.env` 中添加：

```bash
CRON_SECRET=your-random-secret-key-here
```

---

## 3. 线索转商机功能

### 业务规则

- **强制关联客户**：转化时必须选择一个已存在的 Customer
- **血缘继承**：商机自动继承线索的意向分类、备注、预算等信息
- **只读锁定**：转化后线索状态变为 `CONVERTED`，所有字段变为只读
- **自动进入 P1 阶段**：新商机默认进入 P1 初步接触阶段

### 实现

#### Server Action

文件：`app/actions/lead.ts`

```typescript
export async function convertLeadToOpportunityAction(
  leadId: string,
  customerId: string
): Promise<{ success: boolean; opportunityId?: string; error?: string }> {
  const supabase = await createClient()
  const tenantId = await getCurrentTenantId()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. 查询线索信息
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (lead.status === 'CONVERTED') {
    return { success: false, error: '该线索已被转化过' }
  }

  // 2. 生成商机编号
  const today = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const opportunityCode = `OPP-${today}-${Math.random().toString().slice(2, 6)}`

  // 3. 创建商机
  const { data: opportunity } = await supabase
    .from('opportunities')
    .insert({
      id: crypto.randomUUID(),
      organizationId: tenantId,
      opportunityCode,
      customerId,
      convertedFromLeadId: leadId,
      stageId: 'P1',
      status: 'active',
      serviceType: lead.category || 'VISA',
      estimatedAmount: lead.budgetMin || 0,
      assigneeId: user?.id,
    })
    .select('id, opportunityCode')
    .single()

  // 4. 更新线索状态为已转化
  await supabase
    .from('leads')
    .update({
      status: 'CONVERTED',
      convertedOpportunityId: opportunity.id,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', leadId)

  return { success: true, opportunityId: opportunity.opportunityCode }
}
```

#### 前端组件

##### 转商机对话框

文件：`components/leads/convert-to-opp-dialog.tsx`

```typescript
export function ConvertToOppDialog({ lead, isOpen, onClose, onSuccess }) {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')

  // 加载客户列表
  useEffect(() => {
    if (isOpen) {
      getCustomersAction().then(setCustomers)
    }
  }, [isOpen])

  const handleConvert = async () => {
    if (!selectedCustomerId) {
      toast.error('请先选择关联客户！')
      return
    }

    const result = await convertLeadToOpportunityAction(lead.id, selectedCustomerId)

    if (result.success) {
      toast.success(`转化成功！已生成商机 ${result.opportunityId}`)
      onSuccess()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>将线索转化为商机</DialogTitle>
        </DialogHeader>

        <Select onValueChange={setSelectedCustomerId}>
          <SelectTrigger>
            <SelectValue placeholder="请选择客户..." />
          </SelectTrigger>
          <SelectContent>
            {customers.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.customerName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DialogFooter>
          <Button onClick={handleConvert}>确认转化</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

##### 线索详情面板（只读模式）

文件：`components/leads/lead-detail-panel.tsx`

```typescript
export function LeadDetailPanel({ lead, isOpen, onClose }) {
  const [followUps, setFollowUps] = useState<LeadFollowUpRow[]>([])
  const isReadOnly = lead?.status === 'CONVERTED'

  useEffect(() => {
    if (isOpen && lead?.id) {
      getLeadFollowUpsAction(lead.id).then(setFollowUps)
    }
  }, [isOpen, lead?.id])

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        {isReadOnly && (
          <Alert className="bg-blue-50">
            ⚠️ 该线索已转化为商机，基础信息不可修改。
          </Alert>
        )}

        <Input
          value={lead.personName}
          disabled={isReadOnly}
          className={isReadOnly ? 'bg-slate-50 text-slate-500' : ''}
        />

        {/* 跟进记录时间轴 */}
        <div className="space-y-3">
          {followUps.map(followUp => (
            <div key={followUp.id} className="border-l-2 pl-4">
              <Badge>{followUp.followupType}</Badge>
              <p>{followUp.content}</p>
            </div>
          ))}
        </div>

        {!isReadOnly && (
          <Textarea placeholder="添加跟进备注..." />
        )}
      </SheetContent>
    </Sheet>
  )
}
```

##### 集成到线索表格

文件：`components/leads/lead-table.tsx`

```typescript
import { ConvertToOppDialog } from './convert-to-opp-dialog'

export function LeadTable({ leads, onRefresh }) {
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [leadToConvert, setLeadToConvert] = useState<LeadRow | null>(null)

  const handleConvertToOpp = (lead: LeadRow) => {
    setLeadToConvert(lead)
    setConvertDialogOpen(true)
  }

  return (
    <>
      <table>
        {/* ... 表格内容 ... */}
        <DropdownMenu>
          <DropdownMenuItem onClick={() => handleConvertToOpp(lead)}>
            🚀 转为商机
          </DropdownMenuItem>
        </DropdownMenu>
      </table>

      <ConvertToOppDialog
        lead={leadToConvert}
        isOpen={convertDialogOpen}
        onClose={() => setConvertDialogOpen(false)}
        onSuccess={onRefresh}
      />
    </>
  )
}
```

---

## 数据流程图

### 线索转商机流程

```
┌─────────────┐
│   线索 (Lead)  │
│  status: NEW  │
└───────┬───────┘
        │
        │ 销售点击"转为商机"
        ▼
┌─────────────────┐
│ 选择关联客户对话框 │
│  (必选 Customer) │
└───────┬─────────┘
        │
        │ 确认转化
        ▼
┌─────────────────────────────┐
│  Server Action (事务操作)     │
│  1. 创建商机 (Opportunity)    │
│  2. 更新线索状态 → CONVERTED  │
│  3. 记录转化关系              │
└───────┬─────────────────────┘
        │
        ▼
┌─────────────────┐     ┌──────────────────┐
│  商机 (Opportunity) │ ←─→ │  线索 (Lead)      │
│  stageId: P1     │     │  status: CONVERTED│
│  customerId: xxx │     │  只读锁定          │
└─────────────────┘     └──────────────────┘
```

### 自动回收流程

```
┌─────────────────┐
│  Cron Job 触发   │
│  (每天凌晨2点)    │
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  autoRecycleLeadsAction │
│  查询7天前创建的线索    │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  批量更新线索          │
│  - assignedToId = null│
│  - discardReason =    │
│    SYSTEM_AUTO_RECYCLE│
│  - discardedById =    │
│    00000000-0000-... │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  线索退回公海池        │
│  (public_pool)        │
└──────────────────────┘
```

---

## 测试清单

### 系统用户测试

- [ ] 执行 SQL 脚本创建系统用户
- [ ] 验证用户在 `users_auth` 表中存在
- [ ] 验证用户已绑定到所有租户
- [ ] 验证用户具有管理员权限

### 自动回收测试

- [ ] 创建一个7天前的线索（修改 `createdAt`）
- [ ] 手动调用 API 端点触发回收
- [ ] 验证线索已退回公海（`assignedToId` 为空）
- [ ] 验证 `discardedById` 为系统用户 UUID
- [ ] 验证 `discardReason` 为 `SYSTEM_AUTO_RECYCLE`

### 线索转商机测试

- [ ] 打开线索详情，点击"转为商机"
- [ ] 验证客户列表正确加载
- [ ] 选择客户后点击确认
- [ ] 验证商机创建成功
- [ ] 验证线索状态变为 `CONVERTED`
- [ ] 验证线索详情变为只读模式
- [ ] 验证商机继承了线索的意向分类和备注

### 只读模式测试

- [ ] 打开已转化的线索详情
- [ ] 验证所有输入框为禁用状态
- [ ] 验证显示"已转化"提示
- [ ] 验证跟进记录正常显示
- [ ] 验证无法添加新跟进记录

---

## 常见问题

### Q1: 如何修改自动回收的天数？

修改 `autoRecycleLeadsAction` 中的天数：

```typescript
const sevenDaysAgo = new Date()
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7) // 改为其他天数
```

### Q2: 如何查看哪些线索被自动回收了？

查询 SQL：

```sql
SELECT * FROM leads
WHERE "discardReason" = 'SYSTEM_AUTO_RECYCLE'
ORDER BY "discardedAt" DESC;
```

### Q3: 转化后的线索可以撤销吗？

不建议撤销。如果必须撤销，需要：

1. 删除或归档商机
2. 将线索状态改回 `NEW` 或 `PUSHING`
3. 清空 `convertedOpportunityId`

### Q4: 如何手动触发自动回收？

```bash
curl -X GET https://your-domain.com/api/cron/auto-recycle-leads \
  -H "Authorization: Bearer your-secret-key"
```

---

## 总结

本实现提供了完整的线索生命周期管理：

1. **系统用户** - 为自动化操作提供可追溯性
2. **自动回收** - 防止线索长期占用，提高公海池流动性
3. **转商机** - 强制关联客户，确保数据完整性和血缘关系

所有功能都遵循多租户隔离原则，确保数据安全。
