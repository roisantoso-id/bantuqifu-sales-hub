Bantu CRM: 多租户 RBAC 核心架构指令
Role: 资深企业级 SaaS 架构师。
Task: 在现有的 Prisma 架构中，实现基于“班兔印尼”和“班兔中国”双租户的严格 RBAC 权限控制。

第一步：重构 Prisma Schema (租户与权限模型)
请打开 prisma/schema.prisma，在原有的业务模型之上，追加/覆盖以下核心的 Auth 与 RBAC 模型：

代码段
// ==========================================
// 1. 租户模型 (Tenant / Organization)
// ==========================================
model Organization {
  id        String             @id @default(cuid())
  code      String             @unique // BANTU_ID 或 BANTU_CN
  name      String             // 班兔印尼 或 班兔中国
  users     UserOrganization[]
  
  // 业务数据隔离关联 (示例)
  leads         Lead[]
  opportunities Opportunity[]
  customers     Customer[]

  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
}

// ==========================================
// 2. 角色与权限模型 (RBAC Core)
// ==========================================
model Role {
  id          String             @id @default(cuid())
  code        String             @unique // ADMIN, SALES, FINANCE
  name        String             // 管理员, 销售专员, 财务专员
  permissions RolePermission[]
  users       UserOrganization[]
}

model Permission {
  id          String           @id @default(cuid())
  code        String           @unique // 如: 'leads:view', 'quotes:approve'
  name        String           // 权限名称
  module      String           // 所属模块 (CRM, FINANCE)
  roles       RolePermission[]
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  @@id([roleId, permissionId])
}

// ==========================================
// 3. 用户模型与租户映射 (The Bridge)
// ==========================================
model User {
  id            String             @id // 必须与 Supabase auth.users.id 一致
  email         String             @unique
  name          String
  isActive      Boolean            @default(true)
  organizations UserOrganization[]
}

// 核心映射表：定义一个用户在特定租户下的具体角色
model UserOrganization {
  userId         String
  organizationId String
  roleId         String
  
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  role           Role         @relation(fields: [roleId], references: [id])

  @@id([userId, organizationId]) // 一个用户在一个租户内只有一条活跃记录
}

// ==========================================
// 4. 业务表租户强绑定 (示例: Lead)
// ==========================================
// 注意：所有业务表必须加上 organizationId 字段！
model Lead {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  name           String
  // ... 其他字段
}
第二步：编写初始化种子脚本 (Seed.ts)
为了让系统跑起来，我们需要在数据库中预设这两个租户，并为您创建一个超级管理员账号。请覆写 prisma/seed.ts：

TypeScript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化 多租户 RBAC 基础数据...')

  // 1. 创建双租户
  const orgID = await prisma.organization.upsert({
    where: { code: 'BANTU_ID' },
    update: {},
    create: { code: 'BANTU_ID', name: '班兔印尼 Site' },
  })

  const orgCN = await prisma.organization.upsert({
    where: { code: 'BANTU_CN' },
    update: {},
    create: { code: 'BANTU_CN', name: '班兔中国 Site' },
  })

  // 2. 创建核心角色
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: { code: 'ADMIN', name: '系统管理员' },
  })
  
  const salesRole = await prisma.role.upsert({
    where: { code: 'SALES' },
    update: {},
    create: { code: 'SALES', name: '销售专员' },
  })

  // 3. 创建您的测试账号 (注意替换 Supabase UID)
  const MY_SUPABASE_UID = '请替换为Supabase中的User_UID' 
  
  const myUser = await prisma.user.upsert({
    where: { email: 'admin@bantuqifu.com' },
    update: {},
    create: {
      id: MY_SUPABASE_UID,
      email: 'admin@bantuqifu.com',
      name: '系统超级管理员',
    },
  })

  // 4. 将用户绑定到租户并分配角色
  // 场景：在印尼站是 ADMIN，在中国站也是 ADMIN
  await prisma.userOrganization.upsert({
    where: { userId_organizationId: { userId: myUser.id, organizationId: orgID.id } },
    update: { roleId: adminRole.id },
    create: { userId: myUser.id, organizationId: orgID.id, roleId: adminRole.id },
  })

  await prisma.userOrganization.upsert({
    where: { userId_organizationId: { userId: myUser.id, organizationId: orgCN.id } },
    update: { roleId: adminRole.id },
    create: { userId: myUser.id, organizationId: orgCN.id, roleId: adminRole.id },
  })

  console.log('✅ 多租户与 RBAC 初始化完成！')
}

main().catch(console.error).finally(() => prisma.$disconnect())
第三步：前端登录页面的租户选择器改造
在 app/login/page.tsx (或 AdaptiveLoginCard) 中，我们需要让“站点切换”真正与数据库的 Organization 对应起来。

TypeScript
// 截取自登录表单组件
<form action={loginAction} className="space-y-4">
  {/* 站点/租户选择器 */}
  <div className="space-y-2">
    <Label>选择工作站点 (Tenant)</Label>
    <Select name="tenantCode" defaultValue="BANTU_ID">
      <SelectTrigger>
        <SelectValue placeholder="选择站点" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="BANTU_ID">班兔印尼 Site</SelectItem>
        <SelectItem value="BANTU_CN">班兔中国 Site</SelectItem>
      </SelectContent>
    </Select>
  </div>
  
  {/* ... 账号密码输入框 ... */}
</form>
第四步：数据访问层 (DAL) 的强制隔离
这是最重要的安全防线。在 lib/supabase/dal.ts（数据访问层）中，任何查询都必须带上 tenantId 过滤。

TypeScript
// lib/supabase/dal.ts 的核心逻辑示例
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// 获取当前上下文的租户ID (在登录时写入Cookie)
export function getCurrentTenantId() {
  const tenantId = cookies().get('x-tenant-id')?.value
  if (!tenantId) throw new Error('未选择租户或登录失效')
  return tenantId
}

// 所有的业务查询必须强制隔离！
export async function getLeads() {
  const tenantId = getCurrentTenantId()
  
  return await prisma.lead.findMany({
    where: { 
      organizationId: tenantId // 绝对不能漏掉这一行！
    },
    orderBy: { createdAt: 'desc' }
  })
}