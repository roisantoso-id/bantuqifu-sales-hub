# Bantu 多租户 RBAC 核心架构实施指南

## 📋 概览

本指南描述了完整的多租户权限控制系统，用于支持"班兔印尼"和"班兔中国"两个独立站点，同一用户可在不同租户拥有不同角色。

---

## 🎯 核心设计原则

### 1. **租户隔离 (Organization)**
- 所有业务数据（Lead、Opportunity、Customer 等）都强制绑定 `organizationId`
- 数据库查询必须始终包含 `WHERE organizationId = ?` 过滤
- 在数据库层面实施 Row Level Security (RLS) 防止 SQL 注入跨租户访问

### 2. **角色-权限模型 (RBAC)**
- 用户（User）→ 用户-租户映射（UserOrganization）→ 角色（Role）
- 一个用户在一个租户内只有一条 UserOrganization 记录
- 同一用户在不同租户可拥有不同角色（如：在印尼站是 ADMIN，在中国站是 SALES）

### 3. **权限系统 (Permission)**
- 权限以 `module:action` 格式定义（如：`leads:view`, `quotes:approve`）
- 权限通过角色分配，每个角色拥有多个权限
- 前端通过 Cookie 中的权限列表进行 UI 控制

---

## 🏗️ 数据模型

### 核心表

```plaintext
┌─────────────────────────────────────────────────────┐
│ Organization (租户)                                 │
│ - code: BANTU_ID / BANTU_CN (唯一)                 │
│ - name: 班兔印尼 / 班兔中国                         │
└─────────────────────────────────────────────────────┘
        ↓ (1:N)
┌─────────────────────────────────────────────────────┐
│ User (用户 - Supabase Auth 桥接)                    │
│ - id: 必须与 Supabase auth.users.id 一致          │
│ - email: 唯一                                       │
└─────────────────────────────────────────────────────┘
        ↓ (1:N)
┌─────────────────────────────────────────────────────┐
│ UserOrganization (用户-租户-角色映射)               │
│ - userId, organizationId 组合唯一键                 │
│ - roleId: 该用户在该租户下的角色                   │
└─────────────────────────────────────────────────────┘
        ↓ (1:N)
┌─────────────────────────────────────────────────────┐
│ Role (角色)                                         │
│ - code: ADMIN / SALES / FINANCE                    │
│ - permissions: 多对多关联                          │
└─────────────────────────────────────────────────────┘
        ↓ (1:N)
┌─────────────────────────────────────────────────────┐
│ Permission (权限)                                   │
│ - code: leads:view, quotes:approve, ...            │
│ - module: CRM, FINANCE, ADMIN                      │
└─────────────────────────────────────────────────────┘
```

### 业务表（已添加 organizationId）

所有业务表现在都包含 `organizationId` 字段用于租户隔离：
- `Lead` ← organizationId
- `Opportunity` ← organizationId
- `Customer` ← organizationId
- `Product` ← organizationId
- `ActionLog` ← organizationId

---

## 🚀 实施步骤

### 第 1 步：数据库迁移

已完成：
- ✅ `prisma/schema.prisma` - 添加了 Organization、Role、Permission、UserOrganization、User 模型
- ✅ 所有业务表添加了 `organizationId` 外键约束

执行迁移：
```bash
npm run prisma:push
```

### 第 2 步：初始化数据

运行多租户种子脚本：
```bash
npx ts-node prisma/seed-multitenant.ts
```

这会创建：
- 2 个租户：班兔印尼、班兔中国
- 3 个角色：ADMIN、SALES、FINANCE
- 18 个权限：涵盖 CRM、FINANCE、ADMIN 模块
- 1 个测试用户：admin@bantuqifu.com

**重要**：请替换脚本中的 `testUserId` 为您在 Supabase 中实际创建的用户 UUID。

### 第 3 步：前端登录流程

在 `app/login/page.tsx` 中集成租户选择器：

```tsx
// 用户选择租户后调用
const handleLoginWithTenant = async (tenantCode: string) => {
  // 1. 调用登录 API 验证身份
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      tenantCode, // 用户选择的租户
    }),
  })

  // 2. API 会返回该用户在该租户的角色和权限
  const { tenantId, permissions } = await response.json()

  // 3. 前端不需要存储，Cookie 已由服务端设置
  // 4. 重定向到主应用
  router.push('/')
}
```

### 第 4 步：后端 API 路由示例

创建 `app/api/auth/login.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setTenantContext } from '@/lib/multitenant/tenant-context'

export async function POST(req: NextRequest) {
  const { email, password, tenantCode } = await req.json()

  try {
    // 1. 通过 Supabase 验证用户
    const supabaseUser = await verifySupabaseAuth(email, password)
    if (!supabaseUser) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 })
    }

    // 2. 查询用户在该租户的角色
    const org = await prisma.organization.findUnique({
      where: { code: tenantCode },
    })
    if (!org) {
      return NextResponse.json({ error: '租户不存在' }, { status: 400 })
    }

    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: supabaseUser.id,
          organizationId: org.id,
        },
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    })

    if (!userOrg) {
      return NextResponse.json({ error: '您无权访问此租户' }, { status: 403 })
    }

    // 3. 提取权限代码列表
    const permissions = userOrg.role.permissions.map(rp => rp.permission.code)

    // 4. 设置租户上下文 Cookie
    await setTenantContext(org.id, org.code, permissions)

    return NextResponse.json({
      success: true,
      tenantId: org.id,
      role: userOrg.role.code,
      permissions,
    })
  } catch (error) {
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
```

### 第 5 步：在业务代码中使用 DAL

**❌ 错误做法**（会导致数据泄露）：
```typescript
const leads = await prisma.lead.findMany() // 返回所有租户的数据！
```

**✅ 正确做法**：
```typescript
import { getLeads } from '@/lib/multitenant/dal'

const leads = await getLeads() // 只返回当前租户的数据
```

### 第 6 步：权限检查

前端：
```typescript
import { hasPermission } from '@/lib/multitenant/tenant-context'

function OpportunityForm() {
  if (!hasPermission('quotes:approve')) {
    return <div>您无权执行此操作</div>
  }
  // 显示表单
}
```

后端：
```typescript
import { getCurrentTenantId } from '@/lib/multitenant/tenant-context'
import { getOpportunities } from '@/lib/multitenant/dal'

export async function GET() {
  const tenantId = getCurrentTenantId() // 验证租户上下文
  const opps = await getOpportunities() // 自动过滤该租户
  return NextResponse.json(opps)
}
```

---

## 🔐 安全检查清单

- [ ] 所有数据查询都通过 DAL 层（不直接调用 prisma）
- [ ] 所有 API 路由都调用 `getCurrentTenantId()` 验证上下文
- [ ] Cookie `x-tenant-id` 设置为 `httpOnly` 防止 XSS
- [ ] 登出时调用 `clearTenantContext()` 清除 Cookie
- [ ] Supabase 启用了 Row Level Security (RLS) 作为第二防线
- [ ] 数据库级别的外键约束确保了租户隔离

---

## 📁 文件结构

```
prisma/
  ├── schema.prisma              # 已添加 RBAC 模型和 organizationId
  └── seed-multitenant.ts        # 初始化租户、角色、权限、用户

lib/
  └── multitenant/
      ├── tenant-context.ts      # 租户上下文 Cookie 管理
      └── dal.ts                 # 数据访问层（强制租户隔离）

app/
  └── api/
      └── auth/
          └── login.ts           # 登录路由示例
```

---

## 🧪 测试场景

### 测试 1：用户在两个租户的不同角色
```bash
# 登录并选择班兔印尼 → admin 角色
# 应看到所有权限

# 登出并用同一用户登录班兔中国 → 可能是 sales 角色
# 应看到有限权限
```

### 测试 2：租户数据隔离
```bash
# 在班兔印尼创建商机 A
# 切换到班兔中国
# 商机 A 应该不可见

# 切换回班兔印尼
# 商机 A 应该再次可见
```

### 测试 3：权限检查
```bash
# 用 SALES 角色登录
# 尝试访问 /api/admin/users （需要 admin:users 权限）
# 应返回 403 Forbidden
```

---

## 📞 常见问题

### Q: 如何为新用户分配租户？
**A**: 在 Supabase 创建用户后，运行：
```sql
INSERT INTO user_organizations (user_id, organization_id, role_id)
VALUES ('USER_UUID', 'ORG_UUID', 'ROLE_UUID');
```

### Q: 用户可以同时在两个租户工作吗？
**A**: 可以，但需要切换租户。每次切换时：
1. 清除旧的 `x-tenant-id` Cookie
2. 设置新的 `x-tenant-id` 和权限 Cookie
3. 重新加载应用

### Q: 如何添加新权限？
**A**: 在 seed-multitenant.ts 中添加新权限，然后：
```bash
npx ts-node prisma/seed-multitenant.ts
```

### Q: 为什么数据查询必须通过 DAL？
**A**: DAL 层确保每个查询都强制附加 `organizationId` 过滤，防止意外的跨租户数据泄露。

---

## ✅ 实施完成标志

- [ ] Prisma schema 已迁移（包含 Organization、Role、Permission）
- [ ] 种子数据已初始化（两个租户、角色、权限）
- [ ] 登录流程已集成租户选择
- [ ] 所有业务代码使用 DAL 层进行查询
- [ ] 权限检查已在前端和后端实施
- [ ] 测试用例已验证租户隔离

---

**完成日期**: 2024 年 [日期]  
**责任人**: [您的名字]  
**状态**: 🟢 实施中
