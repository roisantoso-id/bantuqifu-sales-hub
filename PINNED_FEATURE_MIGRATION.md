# 商机置顶功能 - 数据库迁移指南

## 问题
当前数据库中 `opportunities` 表缺少 `pinnedByUsers` 字段，导致置顶功能无法使用。

错误信息：
```
column opportunities.pinnedByUsers does not exist
```

## 解决方案

### 方法 1: 通过 Supabase Dashboard（推荐）

1. 登录 Supabase Dashboard
2. 进入项目 > SQL Editor
3. 创建新查询
4. 复制粘贴以下 SQL：

```sql
-- 添加 pinnedByUsers 字段
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS "pinnedByUsers" TEXT[] DEFAULT '{}';

-- 添加 GIN 索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_opportunities_pinned_by_users
ON opportunities USING GIN ("pinnedByUsers");

-- 验证字段已添加
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'opportunities' AND column_name = 'pinnedByUsers';
```

5. 点击 "Run" 执行
6. 验证结果应该显示：
   - column_name: pinnedByUsers
   - data_type: ARRAY
   - column_default: '{}'::text[]

### 方法 2: 使用命令行（如果有 psql 访问权限）

```bash
psql "$DATABASE_URL" -f prisma/migrations/add_opportunity_pin_feature.sql
```

### 方法 3: 使用 Node.js 脚本

```bash
node scripts/add-pinned-field.js
```

这个脚本会显示需要执行的 SQL 语句。

## 验证迁移成功

执行以下查询验证字段已添加：

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'opportunities' AND column_name = 'pinnedByUsers';
```

应该返回一行数据，表示字段已成功添加。

## 功能说明

添加此字段后，用户可以：
- 点击商机卡片上的图钉图标置顶商机
- 置顶的商机会显示在列表顶部
- 每个用户的置顶状态独立保存
- 置顶状态持久化存储在数据库中

## 字段详情

- **字段名**: `pinnedByUsers`
- **类型**: `TEXT[]` (文本数组)
- **默认值**: `'{}'` (空数组)
- **用途**: 存储置顶该商机的用户ID列表
- **索引**: GIN 索引，优化数组查询性能

## 相关文件

- SQL 迁移: `prisma/migrations/add_opportunity_pin_feature.sql`
- Prisma Schema: `prisma/schema.prisma` (已更新)
- Server Action: `app/actions/opportunity.ts` (toggleOpportunityPinAction)
- 前端组件: `components/layout/secondary-sidebar.tsx`
