# 快速设置指南

## 1. 创建系统用户

在 Supabase SQL Editor 中执行：

```bash
# 打开 Supabase Dashboard
# 进入 SQL Editor
# 复制并执行 scripts/seed-system-user.sql 中的内容
```

验证创建成功：

```sql
SELECT * FROM users_auth WHERE id = '00000000-0000-0000-0000-000000000001';
```

## 2. 配置 Cron 密钥

在 `.env` 或 Vercel 环境变量中添加：

```bash
CRON_SECRET=your-random-secret-key-here
```

生成随机密钥：

```bash
openssl rand -base64 32
```

## 3. 部署 Cron Job

### 方式 A: Vercel Cron (推荐)

已配置在 `vercel.json` 中，部署后自动生效：

- 每天凌晨 2:00 执行
- 自动回收 7 天未跟进的线索

### 方式 B: 外部 Cron 服务

使用 [cron-job.org](https://cron-job.org)：

1. 创建账号
2. 添加新任务：
   - URL: `https://your-domain.com/api/cron/auto-recycle-leads`
   - 方法: GET
   - Headers: `Authorization: Bearer your-secret-key`
   - 时间表: `0 2 * * *`

## 4. 测试功能

### 测试自动回收

```bash
curl -X GET https://your-domain.com/api/cron/auto-recycle-leads \
  -H "Authorization: Bearer your-secret-key"
```

预期响应：

```json
{
  "success": true,
  "count": 0,
  "message": "Successfully recycled 0 leads",
  "timestamp": "2026-03-15T02:00:00.000Z"
}
```

### 测试线索转商机

1. 打开线索管理页面
2. 点击线索行的"更多"按钮
3. 选择"转为商机"
4. 选择关联客户
5. 点击"确认转化"
6. 验证商机创建成功
7. 验证线索变为只读状态

## 5. 数据库表检查

确保以下表存在：

```sql
-- 检查 leads 表
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads';

-- 检查 opportunities 表
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'opportunities';

-- 检查 lead_follow_ups 表
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lead_follow_ups';
```

## 6. 常见问题

### Q: Cron Job 没有执行？

检查：

1. Vercel 环境变量中是否设置了 `CRON_SECRET`
2. `vercel.json` 是否已提交到 Git
3. 查看 Vercel Dashboard > Cron Jobs 页面

### Q: 转商机时提示"客户列表为空"？

需要先创建客户：

1. 进入客户管理页面
2. 创建至少一个客户
3. 再尝试转商机

### Q: 如何查看自动回收的日志？

在 Vercel Dashboard > Logs 中搜索 `auto-recycle`

## 7. 下一步

- [ ] 执行系统用户种子脚本
- [ ] 配置 CRON_SECRET 环境变量
- [ ] 部署到 Vercel
- [ ] 测试自动回收功能
- [ ] 测试线索转商机功能
- [ ] 创建至少一个测试客户

## 文档

详细文档请参考：

- `LEAD_LIFECYCLE_FEATURES.md` - 完整功能文档
- `URL_STATE_MANAGEMENT.md` - URL 状态管理文档
- `AUTH_IMPLEMENTATION.md` - 认证实现文档
