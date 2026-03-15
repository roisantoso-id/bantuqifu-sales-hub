# URL 状态管理实现文档

## 概述

将线索管理系统从 `useState` 迁移到 URL 状态管理，实现可分享、可书签、SEO 友好的 URL。

## URL 结构设计

### 支持的 URL 参数

```
/leads?tab=my_leads              # 我的跟进
/leads?tab=public_pool           # 公海池
/leads?q=王总                    # 搜索"王总"
/leads?tab=my_leads&leadId=xxx   # 打开特定线索详情
/leads?tab=public_pool&q=签证    # 公海池中搜索"签证"
```

### URL 参数说明

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `tab` | string | 视图模式 | `my_leads` / `public_pool` |
| `q` | string | 搜索关键词 | `王总` / `LED-260315-0001` |
| `leadId` | string | 选中的线索 ID | `clxxx...` |

## 架构设计

### 1. 服务端组件（SSR）
**文件**: `app/leads/page.tsx`

```typescript
// 服务端直接读取 URL 参数
export default async function LeadsPage({ searchParams }) {
  const tab = searchParams.tab || 'my_leads'
  const search = searchParams.q || ''

  // 服务端查询，只返回需要的数据
  const leads = await getLeadsAction(tab, { search })

  return <LeadManagementClient initialLeads={leads} />
}
```

**优势**:
- ✅ 服务端直接查询，减少数据传输
- ✅ SEO 友好，搜索引擎可以索引
- ✅ 首屏加载快，数据已准备好
- ✅ 支持分享链接，接收者看到相同状态

### 2. 客户端组件
**文件**: `components/leads/lead-management-client.tsx`

```typescript
'use client'

export function LeadManagementClient({ initialLeads }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 从 URL 读取状态
  const activeTab = searchParams.get('tab') || 'my_leads'

  // 更新 URL 而不是 setState
  const handleTabChange = (tab) => {
    router.push(`/leads?tab=${tab}`)
  }

  return <Tabs value={activeTab} onValueChange={handleTabChange} />
}
```

**特性**:
- ✅ 使用 `useSearchParams` 读取 URL
- ✅ 使用 `router.push` 更新 URL
- ✅ 使用 `router.replace` 避免历史堆积（搜索）
- ✅ 使用 `useTransition` 显示加载状态

### 3. 数据层优化
**文件**: `app/actions/lead.ts`

```typescript
export async function getLeadsAction(
  viewMode: 'my_leads' | 'pool',
  filters?: { search?: string }
) {
  // 服务端搜索，使用数据库 ILIKE
  if (filters?.search) {
    query = query.or(
      `personName.ilike.%${search}%,leadCode.ilike.%${search}%`
    )
  }
}
```

**优势**:
- ✅ 数据库层面搜索，性能高
- ✅ 支持模糊匹配
- ✅ 减少前端数据量

## 核心功能实现

### 1. Tab 切换

```typescript
// 切换 Tab 时清除其他参数
const handleTabChange = (tab: string) => {
  router.push(`/leads?tab=${tab}`)
  // 自动清除 q 和 leadId 参数
}
```

### 2. 搜索功能

```typescript
// 使用 replace 避免历史堆积
const handleSearch = (value: string) => {
  router.replace(`/leads?${createQueryString({ q: value })}`)
}
```

### 3. 线索详情

```typescript
// 点击线索行
const handleSelectLead = (lead: LeadRow) => {
  router.push(`/leads?${createQueryString({ leadId: lead.id })}`)
}

// 关闭抽屉
const handleCloseSheet = () => {
  window.history.back() // 返回上一个 URL
}
```

### 4. 刷新数据

```typescript
// 保持 URL 不变，重新获取数据
const handleRefresh = () => {
  router.refresh()
}
```

## 用户体验提升

### 1. 可分享链接

```
# 分享公海池
https://app.bantuqifu.com/leads?tab=public_pool

# 分享搜索结果
https://app.bantuqifu.com/leads?q=签证服务

# 分享特定线索
https://app.bantuqifu.com/leads?leadId=LED-260315-0001
```

接收者点击链接后，看到完全相同的视图状态。

### 2. 浏览器导航

- ✅ 后退按钮：返回上一个视图
- ✅ 前进按钮：前进到下一个视图
- ✅ 刷新按钮：保持当前状态刷新数据
- ✅ 书签：保存当前视图状态

### 3. 加载状态

```typescript
const [isPending, startTransition] = useTransition()

startTransition(() => {
  router.push('/leads?tab=public_pool')
})

// isPending 为 true 时显示加载动画
```

## 性能优化

### 1. 服务端搜索

**旧方案**（客户端过滤）:
```typescript
// ❌ 传输所有数据到前端
const allLeads = await getLeadsAction() // 10000 条
const filtered = allLeads.filter(l => l.name.includes(search))
```

**新方案**（服务端搜索）:
```typescript
// ✅ 只传输匹配的数据
const leads = await getLeadsAction('my_leads', { search: '王总' }) // 5 条
```

### 2. 按需加载

- Tab 切换时，服务端只查询对应视图的数据
- 搜索时，服务端只返回匹配的结果
- 减少网络传输和内存占用

### 3. 缓存策略

Next.js 自动缓存服务端组件：
- 相同 URL 参数的请求会被缓存
- 使用 `router.refresh()` 强制刷新
- 使用 `revalidatePath()` 使缓存失效

## 迁移指南

### 从旧版本迁移

**旧代码**:
```typescript
const [activeTab, setActiveTab] = useState('my_leads')
const [search, setSearch] = useState('')

<Tabs value={activeTab} onValueChange={setActiveTab} />
```

**新代码**:
```typescript
const searchParams = useSearchParams()
const activeTab = searchParams.get('tab') || 'my_leads'

<Tabs
  value={activeTab}
  onValueChange={(tab) => router.push(`/leads?tab=${tab}`)}
/>
```

### 注意事项

1. **客户端组件标记**: 使用 `useSearchParams` 的组件必须标记 `'use client'`
2. **服务端组件**: 页面组件默认是服务端组件，可以直接访问 `searchParams`
3. **历史管理**: 搜索使用 `replace`，导航使用 `push`
4. **错误处理**: URL 参数可能被用户手动修改，需要验证

## 测试场景

### 1. 基本导航
- [ ] 切换 Tab，URL 更新
- [ ] 刷新页面，状态保持
- [ ] 后退/前进按钮正常工作

### 2. 搜索功能
- [ ] 输入搜索词，URL 更新
- [ ] 刷新页面，搜索结果保持
- [ ] 清空搜索，URL 参数移除

### 3. 线索详情
- [ ] 点击线索，抽屉打开，URL 包含 leadId
- [ ] 关闭抽屉，URL 恢复
- [ ] 直接访问带 leadId 的 URL，抽屉自动打开

### 4. 分享链接
- [ ] 复制 URL 在新标签页打开，状态一致
- [ ] 分享给他人，对方看到相同视图

## 未来扩展

### 1. 分页支持

```
/leads?tab=my_leads&page=2&pageSize=50
```

### 2. 高级筛选

```
/leads?tab=my_leads&status=NEW&urgency=HOT&source=REFERRAL
```

### 3. 排序

```
/leads?tab=my_leads&sortBy=createdAt&order=desc
```

### 4. 多选

```
/leads?tab=my_leads&selected=id1,id2,id3
```

## 总结

URL 状态管理带来的核心价值：

1. **可分享性**: 任何视图状态都可以通过 URL 分享
2. **性能优化**: 服务端查询，减少数据传输
3. **用户体验**: 浏览器导航、书签、刷新都正常工作
4. **SEO 友好**: 搜索引擎可以索引不同状态
5. **代码简化**: 减少客户端状态管理复杂度

这是 Next.js App Router 的最佳实践！
