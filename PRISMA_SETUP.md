# Prisma 数据库配置指南 (Supabase + PostgreSQL)

本文档详细说明了如何配置 Prisma ORM 与 Supabase PostgreSQL 数据库。

## 📋 目录
1. [环境变量配置](#1-环境变量配置)
2. [安装依赖](#2-安装依赖)
3. [创建和迁移数据库](#3-创建和迁移数据库)
4. [数据填充](#4-数据填充)
5. [验证数据](#5-验证数据)
6. [常用命令](#6-常用命令)

---

## 1. 环境变量配置

### 步骤 1.1: 获取 Supabase 连接字符串

1. 登录 [Supabase 控制面板](https://app.supabase.com)
2. 选择您的项目
3. 点击左侧 `Settings` → `Database` 
4. 在 "Connection String" 部分复制 `URI` 格式的连接字符串（选择 **Nodejs** 方式）
5. 复制的格式应该如下：

```
postgresql://postgres:[YOUR_PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres
```

### 步骤 1.2: 配置 .env 文件

编辑项目根目录的 `.env` 文件，将 `DATABASE_URL` 和 `DIRECT_URL` 设置为同一个连接字符串：

```env
# 标准连接字符串（用于迁移和 Prisma CLI）
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres?schema=public"

# 直连字符串（用于应用程序 - 可选，但推荐用于生产环境的连接池）
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres?schema=public"

# 开发环境
NODE_ENV="development"
```

⚠️ **重要**: 
- 将 `[YOUR_PASSWORD]` 替换为 Supabase 创建项目时设置的密码
- 将 `[PROJECT_REF]` 替换为您的 Supabase 项目引用 ID（如 `abc123xyz`)
- `.env` 文件已添加到 `.gitignore`，不会被提交到 Git

---

## 2. 安装依赖

### 步骤 2.1: 安装 npm 依赖

```bash
npm install
```

这将安装：
- `@prisma/client` - Prisma ORM 客户端
- `prisma` - Prisma CLI 工具（devDependency）

### 步骤 2.2: 验证安装

```bash
npx prisma --version
```

应该输出类似 `@prisma/cli X.Y.Z` 的版本信息。

---

## 3. 创建和迁移数据库

### 步骤 3.1: 推送 Schema 到数据库

此命令根据 `prisma/schema.prisma` 在 Supabase 中创建所有表：

```bash
npm run prisma:push
```

**预期输出:**
```
🚀  Your database is now in sync with your Prisma schema.

✅ Prisma schema has been updated in Supabase.
```

⚠️ **注意**: 第一次运行时，Prisma 可能会提示是否重置数据库。由于我们是新项目，可以安全地选择 "yes"。

### 步骤 3.2: 生成 Prisma Client

此命令生成最新的 Prisma Client（通常会自动运行）：

```bash
npx prisma generate
```

---

## 4. 数据填充

### 步骤 4.1: 填充初始数据

运行 seed 脚本将 mock 数据导入数据库：

```bash
npm run prisma:seed
```

**预期输出:**
```
🌱 开始填充数据...
🗑️  清空现有数据...
✅ 数据已清空

👤 创建用户...
✅ 用户创建: 销售经理

📦 创建产品...
✅ 创建了 5 个产品

🏢 创建客户...
✅ 创建了 10 个客户

📞 创建线索...
✅ 创建了 3 个线索

💼 创建商机...
✅ 创建了 4 个商机

✨ 数据填充完成！
```

---

## 5. 验证数据

### 步骤 5.1: 打开 Prisma Studio

Prisma Studio 是一个可视化数据库管理工具，可以查看和编辑数据：

```bash
npm run prisma:studio
```

此命令会打开本地 http://localhost:5555 ，显示所有表和数据。

### 步骤 5.2: 在 Supabase 中查看数据

1. 登录 [Supabase 控制面板](https://app.supabase.com)
2. 选择您的项目
3. 点击左侧 `SQL Editor`
4. 在右侧 `Quick start` 中选择任意表（如 `users`）
5. 执行查询查看数据

示例 SQL 查询：

```sql
-- 查看所有用户
SELECT * FROM "public"."users";

-- 查看所有商机
SELECT * FROM "public"."opportunities";

-- 查看所有线索
SELECT * FROM "public"."leads";

-- 查看所有客户
SELECT * FROM "public"."customers";

-- 按阶段统计商机
SELECT "stageId", COUNT(*) as count FROM "public"."opportunities" GROUP BY "stageId";
```

---

## 6. 常用命令

### 数据库操作

```bash
# 查看数据库状态
npm run prisma:push

# 重置数据库（删除所有表并重新创建）
npx prisma migrate reset

# 创建新的迁移（手动修改 schema 后）
npx prisma migrate dev --name add_new_field

# 应用待处理的迁移
npx prisma migrate deploy
```

### 数据管理

```bash
# 填充初始数据
npm run prisma:seed

# 打开 Prisma Studio（可视化管理界面）
npm run prisma:studio

# 生成最新的 Prisma Client
npx prisma generate
```

### 开发工具

```bash
# 查看 Prisma 版本
npx prisma --version

# 验证 schema 语法
npx prisma validate
```

---

## 📊 数据库 Schema 概览

### 核心表

| 表名 | 描述 | 主要字段 |
|------|------|---------|
| `users` | 用户表 | id, name, email, role, company |
| `leads` | 线索表 | id, wechatName, phone, source, status, urgency |
| `customers` | 客户表 | id, customerId, customerName, level, isLocked |
| `opportunities` | 商机表 | id, customerId, stageId, status, serviceType, estimatedAmount |
| `products` | 产品/服务表 | id, productCode, name, category, price, currency |
| `action_logs` | 操作日志表 | id, opportunityId, operatorId, actionType, timestamp |

### 关系表

- `opportunity_p2_data` - 商机 P2 阶段（方案匹配）
- `opportunity_p3_data` - 商机 P3 阶段（报价审核）
- `opportunity_p4_data` - 商机 P4 阶段（合同签署）
- `opportunity_p5_data` - 商机 P5 阶段（财务确认）
- `opportunity_p6_data` - 商机 P6 阶段（材料提交）
- `opportunity_p7_data` - 商机 P7 阶段（交付完成）
- `opportunity_p8_data` - 商机 P8 阶段（财务结算）

---

## 🔐 安全最佳实践

1. **保护 DATABASE_URL**
   - 不要在代码中硬编码连接字符串
   - 不要将 `.env` 提交到 Git
   - 定期轮换数据库密码

2. **使用 Row Level Security (RLS)**
   - 在 Supabase 中为表启用 RLS 策略
   - 确保只有授权用户能访问数据

3. **备份**
   - 定期在 Supabase 中进行备份
   - 下载和保存重要的数据导出

---

## 🆘 常见问题

### Q: "密码认证失败" 错误

**解决方案:**
- 确保 `.env` 中的密码正确
- 检查是否使用了特殊字符（如 `@`, `#`, `$`），可能需要 URL 编码
- 在 Supabase 控制面板中重置数据库密码

### Q: "关系 'public.xxx' 不存在"

**解决方案:**
- 运行 `npm run prisma:push` 确保所有表已创建
- 检查表名称大小写是否正确

### Q: 如何清除所有数据重新开始？

**解决方案:**
```bash
# 方式 1: 使用 Prisma 迁移重置
npx prisma migrate reset

# 方式 2: 手动清空然后重新填充
npm run prisma:seed
```

---

## 📚 进一步学习

- [Prisma 官方文档](https://www.prisma.io/docs/)
- [Supabase 指南](https://supabase.com/docs)
- [PostgreSQL 教程](https://www.postgresql.org/docs/)

---

**最后更新:** 2026-03-15
**状态:** ✅ 生产就绪
