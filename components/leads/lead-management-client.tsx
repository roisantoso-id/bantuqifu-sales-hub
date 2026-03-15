'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LeadTable } from './lead-table'
import { CreateLeadDialog } from './create-lead-dialog'
import { toast } from 'sonner'
import type { LeadRow } from '@/app/actions/lead'

interface LeadManagementClientProps {
  initialLeads: LeadRow[]
  initialTab: 'my_leads' | 'pool'
  initialSearch: string
  initialLeadId: string | null
}

export function LeadManagementClient({
  initialLeads,
  initialTab,
  initialSearch,
  initialLeadId,
}: LeadManagementClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // 从 URL 读取状态
  const activeTab = (searchParams.get('tab') || initialTab) as 'my_leads' | 'pool'
  const searchQuery = searchParams.get('q') || initialSearch
  const selectedLeadId = searchParams.get('leadId') || initialLeadId

  // 创建 URL 查询字符串
  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })

      return params.toString()
    },
    [searchParams]
  )

  // 切换 Tab
  const handleTabChange = (tab: string) => {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ tab, q: null, leadId: null })}`)
    })
  }

  // 搜索（使用 replace 避免历史记录堆积）
  const handleSearch = (value: string) => {
    startTransition(() => {
      router.replace(`${pathname}?${createQueryString({ q: value || null })}`)
    })
  }

  // 选择线索
  const handleSelectLead = (lead: LeadRow) => {
    router.push(`${pathname}?${createQueryString({ leadId: lead.id })}`)
  }

  // 刷新数据
  const handleRefresh = () => {
    router.refresh()
  }

  // 数据统计
  const stats = {
    total: initialLeads.length,
    new: initialLeads.filter(l => l.status === 'NEW').length,
    pushing: initialLeads.filter(l => l.status === 'PUSHING').length,
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* ── 顶部工具栏 ── */}
      <div className="flex items-center justify-between border-b px-6 py-3 bg-slate-50/50">
        <div className="flex items-center gap-6">
          <h1 className="text-sm font-bold text-slate-900">线索管理</h1>

          {/* 视图切换 Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
            <TabsList className="h-8 bg-slate-100 p-0.5">
              <TabsTrigger value="my_leads" className="text-[12px] px-4 h-7">
                我的跟进
              </TabsTrigger>
              <TabsTrigger value="pool" className="text-[12px] px-4 h-7">
                待分配（公海）
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 数据统计 */}
          <div className="flex items-center gap-4 text-[12px] text-slate-600">
            <span>
              总计: <strong className="text-slate-900">{stats.total}</strong>
            </span>
            <span>
              新线索: <strong className="text-blue-600">{stats.new}</strong>
            </span>
            <span>
              跟进中: <strong className="text-amber-600">{stats.pushing}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="搜索线索编号、姓名、公司..."
              className="h-9 pl-8 text-[12px] bg-white"
              defaultValue={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-[12px]"
            onClick={handleRefresh}
            disabled={isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            刷新
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="h-9 gap-2 text-[12px] bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" /> 新增线索
          </Button>
        </div>
      </div>

      {/* ── 全屏表格区 ── */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {isPending ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">加载中...</div>
          </div>
        ) : initialLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <div>暂无线索数据</div>
            {searchQuery && <div className="text-sm mt-2">尝试修改搜索条件</div>}
          </div>
        ) : (
          <LeadTable
            leads={initialLeads}
            viewMode={activeTab === 'pool' ? 'public_pool' : 'my_leads'}
            onSelect={handleSelectLead}
            onRefresh={handleRefresh}
            selectedLeadId={selectedLeadId}
          />
        )}
      </div>

      {/* 新增线索对话框 */}
      <CreateLeadDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
