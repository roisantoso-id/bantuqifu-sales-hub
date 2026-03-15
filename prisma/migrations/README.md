# 数据库迁移说明

本目录包含手动 SQL 迁移脚本。由于项目使用 `prisma db push` 而非 `prisma migrate`，需要手动在 Supabase Dashboard 中执行这些 SQL 脚本。

## 如何执行迁移

### 方法 1: Supabase Dashboard (推荐)

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 创建新查询
5. 复制对应的 SQL 文件内容并粘贴
6. 点击 **Run** 执行

### 方法 2: 使用 psql 命令行

```bash
# 设置环境变量
export DATABASE_URL="your_database_url_here"

# 执行迁移
psql $DATABASE_URL -f prisma/migrations/your_migration_file.sql
```

## 迁移列表

### ✅ add_opportunity_pin_feature.sql
- **日期**: 2026-03-15
- **描述**: 为 opportunities 表添加 pinnedByUsers 字段，支持用户级别的商机置顶功能
- **状态**: 需要手动执行

### ✅ add_opportunity_close_dates.sql
- **日期**: 2026-03-15
- **描述**: 为 opportunities 表添加 expectedCloseDate 和 actualCloseDate 字段
- **字段**:
  - `expectedCloseDate`: 预计成交日期 (可空)
  - `actualCloseDate`: 实际成交日期 (可空)
- **索引**: 为两个日期字段添加索引以提升查询性能
- **状态**: 需要手动执行

### ✅ update_service_type_enum.sql
- **日期**: 2026-03-15
- **描述**: 更新 ServiceType 枚举以匹配实际业务类目
- **新枚举值**:
  - `VISA`: 签证服务
  - `COMPANY_REGISTRATION`: 公司注册
  - `FACTORY_SETUP`: 工厂落地
  - `TAX_SERVICES`: 税务服务
  - `PERMIT_SERVICES`: 许可证服务
  - `FINANCIAL_SERVICES`: 财务服务
  - `IMMIGRATION`: 移民服务
  - `OTHER`: 其他
- **数据迁移**: 自动将旧值映射到新值
- **状态**: 需要手动执行

## 注意事项

1. **执行顺序**: 按照文件名或日期顺序执行迁移
2. **幂等性**: 所有迁移脚本都使用 `IF NOT EXISTS` 确保可以安全重复执行
3. **备份**: 在执行迁移前建议备份数据库
4. **验证**: 执行后使用 `\d opportunities` 命令验证字段是否添加成功

## 验证迁移

执行迁移后，可以运行以下 SQL 验证：

```sql
-- 查看 opportunities 表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'opportunities'
ORDER BY ordinal_position;

-- 查看索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'opportunities';
```

## 同步 Prisma Client

执行 SQL 迁移后，需要重新生成 Prisma Client：

```bash
npx prisma generate
```
