# 认证拦截功能说明

## 已实现功能

### 1. Middleware 认证检查
- ✅ 检查所有非公开路径的访问
- ✅ 验证 Supabase session 是否有效
- ✅ Token 过期自动重定向到登录页
- ✅ 保存原始请求路径，登录后自动返回

### 2. 公开路径
不需要认证的路径：
- `/login` - 登录页面
- `/api/auth/*` - 认证相关 API
- 静态资源（图片、CSS、JS 等）

### 3. 登录重定向
- 未认证访问受保护页面 → 重定向到 `/login?redirect=/原路径`
- 登录成功后 → 自动返回原页面

### 4. 登出功能
- 创建了 `app/actions/auth.ts` 提供 `signOut()` 函数
- 登出后清除 session 并重定向到登录页

## 工作流程

```
用户访问 /leads
    ↓
Middleware 检查认证
    ↓
没有 session / token 过期
    ↓
重定向到 /login?redirect=/leads
    ↓
用户登录成功
    ↓
自动返回 /leads
```

## 测试步骤

### 测试 1: 未登录访问
1. 清除浏览器 cookies
2. 访问 http://localhost:3000/
3. ✅ 应该自动重定向到 `/login?redirect=/`

### 测试 2: Token 过期
1. 登录后等待 token 过期（或手动删除 auth cookie）
2. 刷新页面或访问任意页面
3. ✅ 应该重定向到登录页

### 测试 3: 登录后重定向
1. 访问 http://localhost:3000/leads（未登录）
2. 重定向到 `/login?redirect=/leads`
3. 输入账号密码登录
4. ✅ 应该自动返回 `/leads` 页面

### 测试 4: 登出功能
1. 在主页面调用 `signOut()` 函数
2. ✅ 应该清除 session 并重定向到登录页

## 代码位置

- **Middleware**: `middleware.ts`
- **登录页面**: `app/login/page.tsx`
- **登出 Action**: `app/actions/auth.ts`
- **Supabase 客户端**: `lib/supabase/client.ts` 和 `lib/supabase/server.ts`

## 注意事项

1. **开发环境**: Middleware 会检查所有请求，确保 Supabase 配置正确
2. **Session 刷新**: Supabase 会自动刷新 token，通常不会过期
3. **Cookie 设置**: 确保 cookies 正确设置（httpOnly, secure, sameSite）
4. **多租户**: 登录时需要选择租户（班兔印尼/班兔中国）
