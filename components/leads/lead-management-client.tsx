'use client'

import { useCallback, useState, useTransition, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LeadTable } from './lead-table'
import { CreateLeadDialog } from './create-lead-dialog'
import { LeadDetailPanel } from './lead-detail-panel'
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

  // Dialog / Panel state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(
    initialLeadId ? initialLeads.find(l => l.id === initialLeadId) || null : null
  )
  const [detailPanelOpen, setDetailPanelOpen] = useState(!!initialLeadId)

  // Read state from URL
  const activeTab = (searchParams.get('tab') || initialTab) as 'my_leads' | 'pool'
  const searchQuery = searchParams.get('q') || initialSearch

  // 本地输入框状态（用于防抖）
  const [inputValue, setInputValue] = useState(searchQuery)

  // 防抖搜索逻辑
  useEffect(() => {
    if (inputValue !== searchQuery) {
      const timeoutId = setTimeout(() => {
        startTransition(() => {
          const params = new URLSearchParams(searchParams.toString())
          if (inputValue) {
            params.set('q', inputValue)
          } else {
            params.delete('q')
          }
          router.replace(`${pathname}?${params.toString()}`, { scroll: false })
        })
      }, 500) // 500ms 延迟

      return () => clearTimeout(timeoutId)
    }
  }, [inputValue, searchQuery, pathname, router, searchParams])

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value)
        else params.delete(key)
      })
      return params.toString()
    },
    [searchParams]
  )

  const handleTabChange = (tab: string) => {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ tab, q: null, lead: null })}`)
    })
  }

  const handleSearch = (value: string) => {
    startTransition(() => {
      router.replace(`${pathname}?${createQueryString({ q: value || null })}`)
    })
  }

  const handleRefresh = () => {
    router.refresh()
  }

  const handleSelectLead = (lead: LeadRow) => {
    setSelectedLead(lead)
    setDetailPanelOpen(true)
    // Update URL with lead id
    startTransition(() => {
      router.replace(`${pathname}?${createQueryString({ lead: lead.id })}`)
    })
  }

  const handleCloseDetail = () => {
    setDetailPanelOpen(false)
    setSelectedLead(null)
    // Remove lead id from URL
    startTransition(() => {
      router.replace(`${pathname}?${createQueryString({ lead: null })}`)
    })
  }

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false)
    handleRefresh()
  }

  // Stats
  const stats = {
    total: initialLeads.length,
    new: initialLeads.filter((l) => l.status === 'new').length,
    pushing: initialLeads.filter(
      (l) => l.status === 'contacted' || l.status === 'ready_for_opportunity'
    ).length,
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#fafafa] px-6 py-3">
        <div className="flex items-center gap-5">
          <h1 className="text-[13px] font-bold text-[#111827]">线索管理</h1>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-8 bg-[#f3f4f6] p-0.5">
              <TabsTrigger value="my_leads" className="h-7 px-4 text-[12px]">
                我的跟进
              </TabsTrigger>
              <TabsTrigger value="pool" className="h-7 px-4 text-[12px]">
                待分配（公海）
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-4 text-[12px] text-[#6b7280]">
            <span>
              总计:{' '}
              <strong className="text-[#111827]">{stats.total}</strong>
            </span>
            <span>
              新线索:{' '}
              <strong className="text-[#2563eb]">{stats.new}</strong>
            </span>
            <span>
              跟进中:{' '}
              <strong className="text-amber-600">{stats.pushing}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9ca3af]" />
            <Input
              placeholder="搜索线索编号、微信名..."
              className="h-8 pl-8 text-[12px] bg-white border-[#e5e7eb]"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            {isPending && (
              <div className="absolute right-2.5 top-2.5 h-3.5 w-3.5 animate-spin rounded-full border border-[#e5e7eb] border-t-[#2563eb]" />
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-[12px] border-[#e5e7eb]"
            onClick={handleRefresh}
            disabled={isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            刷新
          </Button>

          <Button
            size="sm"
            className="h-8 gap-1.5 bg-[#2563eb] text-[12px] hover:bg-[#1d4ed8]"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            新增线索
          </Button>
        </div>
      </div>

      {/* Table area */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {isPending ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#2563eb]" />
          </div>
        ) : initialLeads.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <p className="text-[13px] text-[#6b7280]">暂无线索数据</p>
            {searchQuery && (
              <p className="mt-1 text-[12px] text-[#9ca3af]">尝试修改搜索条件</p>
            )}
          </div>
        ) : (
          <LeadTable
            leads={initialLeads}
            viewMode={activeTab === 'pool' ? 'public_pool' : 'my_leads'}
            onRefresh={handleRefresh}
            onSelect={handleSelectLead}
            selectedLeadId={selectedLead?.id}
          />
        )}
      </div>

      {/* Create Lead Dialog */}
      <CreateLeadDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Lead Detail Panel (Drawer) */}
      <LeadDetailPanel
        lead={selectedLead}
        isOpen={detailPanelOpen}
        onClose={handleCloseDetail}
      />
    </div>
  )
}
