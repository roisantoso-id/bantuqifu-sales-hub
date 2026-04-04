-- ============================================================
-- Delivery Center (交付中心) — SQL Migration
-- Generated from Prisma schema for manual execution in Supabase
-- ============================================================

-- 1. delivery_projects 表
CREATE TABLE IF NOT EXISTS "delivery_projects" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "pmId" TEXT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "delivery_projects_opportunityId_key" ON "delivery_projects"("opportunityId");
CREATE INDEX "delivery_projects_organizationId_idx" ON "delivery_projects"("organizationId");
CREATE INDEX "delivery_projects_customerId_idx" ON "delivery_projects"("customerId");
CREATE INDEX "delivery_projects_pmId_idx" ON "delivery_projects"("pmId");
CREATE INDEX "delivery_projects_status_idx" ON "delivery_projects"("status");

-- Foreign keys
ALTER TABLE "delivery_projects" ADD CONSTRAINT "delivery_projects_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "delivery_projects" ADD CONSTRAINT "delivery_projects_opportunityId_fkey"
    FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_projects" ADD CONSTRAINT "delivery_projects_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_projects" ADD CONSTRAINT "delivery_projects_pmId_fkey"
    FOREIGN KEY ("pmId") REFERENCES "users_auth"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- 2. service_tasks 表
CREATE TABLE IF NOT EXISTS "service_tasks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "executorId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "dueDate" TIMESTAMP(3),
    "commissionBase" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_tasks_organizationId_idx" ON "service_tasks"("organizationId");
CREATE INDEX "service_tasks_projectId_idx" ON "service_tasks"("projectId");
CREATE INDEX "service_tasks_executorId_idx" ON "service_tasks"("executorId");
CREATE INDEX "service_tasks_status_idx" ON "service_tasks"("status");

ALTER TABLE "service_tasks" ADD CONSTRAINT "service_tasks_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "delivery_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "service_tasks" ADD CONSTRAINT "service_tasks_executorId_fkey"
    FOREIGN KEY ("executorId") REFERENCES "users_auth"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- 3. delivery_records 表
CREATE TABLE IF NOT EXISTS "delivery_records" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "content" TEXT,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "delivery_records_taskId_idx" ON "delivery_records"("taskId");
CREATE INDEX "delivery_records_userId_idx" ON "delivery_records"("userId");

ALTER TABLE "delivery_records" ADD CONSTRAINT "delivery_records_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "service_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "delivery_records" ADD CONSTRAINT "delivery_records_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users_auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- 4. commission_records 表
CREATE TABLE IF NOT EXISTS "commission_records" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'TASK',
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "settlementDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "commission_records_organizationId_idx" ON "commission_records"("organizationId");
CREATE INDEX "commission_records_userId_idx" ON "commission_records"("userId");
CREATE INDEX "commission_records_status_idx" ON "commission_records"("status");
CREATE INDEX "commission_records_sourceId_idx" ON "commission_records"("sourceId");

ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commission_records" ADD CONSTRAINT "commission_records_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users_auth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- 5. 在 opportunities 表添加 deliveryProject 外键（如果不存在）
-- 注意：Opportunity → DeliveryProject 是 1:1 关系，delivery_projects.opportunityId 已有 unique 约束
-- 无需在 opportunities 表添加列，通过 delivery_projects.opportunityId 反向查询即可

-- 6. 在 customers 表添加 deliveryProjects 关系（通过 delivery_projects.customerId 外键已实现）

-- 7. 在 users_auth 表添加 delivery 关系（通过各表的外键已实现）

-- ============================================================
-- Seed: Delivery 权限和角色
-- ============================================================

-- 新增权限
INSERT INTO "permissions" ("id", "code", "name", "module", "description", "createdAt") VALUES
    ('perm_delivery_view', 'delivery:view', '查看交付项目', 'DELIVERY', '查看交付项目列表和详情', NOW()),
    ('perm_delivery_create', 'delivery:create', '创建交付项目', 'DELIVERY', '从赢单商机创建交付项目', NOW()),
    ('perm_delivery_edit', 'delivery:edit', '编辑交付项目', 'DELIVERY', '编辑交付项目信息', NOW()),
    ('perm_delivery_tasks_view', 'delivery:tasks:view', '查看任务', 'DELIVERY', '查看交付任务', NOW()),
    ('perm_delivery_tasks_create', 'delivery:tasks:create', '创建任务', 'DELIVERY', '在交付项目中创建任务', NOW()),
    ('perm_delivery_tasks_edit', 'delivery:tasks:edit', '编辑任务', 'DELIVERY', '编辑任务状态和信息', NOW()),
    ('perm_delivery_tasks_review', 'delivery:tasks:review', '审核验收任务', 'DELIVERY', '审核验收交付任务', NOW()),
    ('perm_delivery_nudge', 'delivery:nudge', '催办任务', 'DELIVERY', '催办待处理任务', NOW()),
    ('perm_delivery_commission_view', 'delivery:commission:view', '查看提成', 'DELIVERY', '查看提成记录', NOW()),
    ('perm_delivery_commission_approve', 'delivery:commission:approve', '审批提成', 'DELIVERY', '审批和结算提成', NOW())
ON CONFLICT ("code") DO NOTHING;

-- 新增角色
INSERT INTO "roles" ("id", "code", "name", "createdAt") VALUES
    ('role_delivery_pm', 'DELIVERY_PM', '交付项目经理', NOW()),
    ('role_delivery_executor', 'DELIVERY_EXECUTOR', '交付执行人', NOW())
ON CONFLICT ("code") DO NOTHING;

-- DELIVERY_PM 角色关联所有 delivery 权限
INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT 'role_delivery_pm', "id" FROM "permissions" WHERE "module" = 'DELIVERY'
ON CONFLICT DO NOTHING;

-- DELIVERY_EXECUTOR 角色关联基础权限
INSERT INTO "role_permissions" ("roleId", "permissionId") VALUES
    ('role_delivery_executor', 'perm_delivery_view'),
    ('role_delivery_executor', 'perm_delivery_tasks_view'),
    ('role_delivery_executor', 'perm_delivery_tasks_edit'),
    ('role_delivery_executor', 'perm_delivery_nudge')
ON CONFLICT DO NOTHING;

-- ADMIN 角色关联所有 delivery 权限
INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT 'role_admin', "id" FROM "permissions" WHERE "module" = 'DELIVERY'
ON CONFLICT DO NOTHING;
