# 🚀 Bantu CRM - Prisma + Supabase 快速开始

## 30 秒快速启动

### 1️⃣ 获取 Supabase 连接字符串

1. 登录 [Supabase](https://app.supabase.com)
2. 创建新项目（或使用现有项目）
3. 进入 Settings → Database → Connection string
4. 复制 **URI** 格式的连接字符串

### 2️⃣ 配置环境变量

编辑或创建 `.env` 文件：

```bash
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres?schema=public"
NODE_ENV="development"
```

替换：
- `[YOUR_PASSWORD]` → Supabase 项目密码
- `[PROJECT_REF]` → Supabase 项目 ID（如 `abc123xyz`）

### 3️⃣ 运行自动化启动脚本

**macOS/Linux:**
```bash
bash scripts/setup-db.sh
```

**Windows:**
```bash
scripts\setup-db.bat
```

或手动执行以下命令：

```bash
npm install                    # 安装依赖
npm run prisma:push           # 创建数据库表
npm run prisma:seed           # 填充示例数据
```

### 4️⃣ 验证成功

```bash
npm run prisma:studio
```

打开 http://localhost:5555，应该能看到所有数据。

---

## 📊 数据库结构

自动创建的核心表：

| 表 | 描述 | 关键字段 |
|----|------|---------|
| `users` | 用户表 | id, name, email, role |
| `leads` | 线索表 | id, wechatName, status, urgency |
| `customers` | 客户表 | id, customerId, customerName, level |
| `opportunities` | 商机表 | id, customerId, stageId, status |
| `products` | 产品表 | id, productCode, name, price |
| `action_logs` | 操作日志 | id, opportunityId, actionType, timestamp |

以及 8 个关联表用于商机各个阶段（P1-P8）。

---

## 🛠️ 常用命令

```bash
# 数据库操作
npm run prisma:push          # 同步 schema 到数据库
npm run prisma:seed          # 填充初始数据
npm run prisma:studio        # 打开 Prisma Studio (GUI)

# 开发
npm run dev                   # 启动开发服务器 (http://localhost:3000)
npm run build                 # 构建生产版本
npm start                     # 启动生产服务器

# Prisma CLI
npx prisma generate          # 重新生成 Prisma Client
npx prisma migrate reset     # 重置数据库
npx prisma validate          # 验证 schema 语法
```

---

## 📝 初始化完成清单

- ✅ Prisma 和 @prisma/client 已安装
- ✅ prisma/schema.prisma 已创建（601 行）
- ✅ prisma/seed.ts 已创建（数据填充脚本）
- ✅ .env 已配置（需填入 Supabase 连接信息）
- ✅ 自动启动脚本已准备（bash 和 batch）
- ✅ package.json 已更新（包含 Prisma 命令）

---

## 🔍 验证步骤

### 检查 1: 连接验证
```bash
npx prisma db execute --stdin < /dev/null
```
成功则输出 Prisma 数据库连接状态。

### 检查 2: 查看表
```bash
npm run prisma:studio
```
应该看到 50+ 个表。

### 检查 3: 查看数据
访问 Supabase 控制面板：
- https://app.supabase.com → 选择项目 → 左侧 SQL Editor
- 执行：`SELECT COUNT(*) FROM opportunities;`
- 应返回结果 (默认 4 条商机)

---

## ⚠️ 常见错误排查

| 错误 | 解决方案 |
|------|---------|
| `Error: connect ECONNREFUSED` | 检查 DATABASE_URL 是否正确 |
| `password authentication failed` | 确认 Supabase 密码正确 |
| `relation "public.users" does not exist` | 运行 `npm run prisma:push` |
| `PrismaClientInitializationError` | 运行 `npx prisma generate` |

---

## 📚 下一步

1. **阅读详细指南**: 查看 [PRISMA_SETUP.md](./PRISMA_SETUP.md)
2. **集成到应用**: 在 API 路由中使用 Prisma（见下方示例）
3. **添加 RLS**: 在 Supabase 中为表启用 Row Level Security
4. **监控**: 使用 Prisma Data Proxy 或 Supabase 的日志功能

---

## 💡 示例代码

### 在 Next.js API 中使用 Prisma

```typescript
// app/api/opportunities/route.ts
import { prisma } from '@/lib/prisma'

export async function GET() {
  const opportunities = await prisma.opportunity.findMany({
    include: { customer: true, assignee: true },
    take: 10,
  })
  return Response.json(opportunities)
}

export async function POST(req: Request) {
  const data = await req.json()
  const opportunity = await prisma.opportunity.create({
    data: {
      customerId: data.customerId,
      assigneeId: data.assigneeId,
      stageId: 'P1',
      status: 'active',
      serviceType: data.serviceType,
      serviceTypeLabel: '需求记录',
      estimatedAmount: data.estimatedAmount,
      currency: 'IDR',
    },
  })
  return Response.json(opportunity)
}
```

### 创建 lib/prisma.ts 实例

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## 📞 技术支持

- [Prisma 文档](https://www.prisma.io/docs/)
- [Supabase 文档](https://supabase.com/docs)
- [PostgreSQL 指南](https://www.postgresql.org/docs/)

---

**版本**: 1.0.0  
**最后更新**: 2026-03-15  
**状态**: ✅ 就绪
