'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, RefreshCw } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LeadTable } from './lead-table'
import { toast } from 'sonner'
import {
  getLeadsAction,
  createLeadAction,
  type LeadRow,
} from '@/app/actions/lead'

export function LeadManagement() {
  const [activeTab, setActiveTab] = useState<'my_leads' | 'public_pool'>('my_leads')
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // 加载线索数据
  const loadLeads = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLeadsAction(activeTab)
      setLeads(data)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  // 根据搜索过滤数据
  const filteredLeads = leads.filter(lead => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      lead.personName.toLowerCase().includes(query) ||
      lead.leadCode.toLowerCase().includes(query) ||
      lead.company?.toLowerCase().includes(query) ||
      lead.notes?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="flex h-full flex-col bg-white">
      {/* ── 顶部工具栏 (Global Toolbar) ── */}
      <div className="flex items-center justify-between border-b px-6 py-3 bg-slate-50/50">
        <div className="flex items-center gap-6">
          <h1 className="text-sm font-bold text-slate-900">线索管理</h1>

          {/* 视图切换 Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'my_leads' | 'public_pool')}
            className="w-auto"
          >
            <TabsList className="h-8 bg-slate-100 p-0.5">
              <TabsTrigger value="my_leads" className="text-[12px] px-4 h-7">
                我的跟进
              </TabsTrigger>
              <TabsTrigger value="public_pool" className="text-[12px] px-4 h-7">
                待分配（公海）
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 数据统计 */}
          <div className="flex items-center gap-4 text-[12px] text-slate-600">
            <span>总计: <strong className="text-slate-900">{filteredLeads.length}</strong></span>
            <span>新线索: <strong className="text-blue-600">
              {filteredLeads.filter(l => l.status === 'NEW').length}
            </strong></span>
            <span>跟进中: <strong className="text-amber-600">
              {filteredLeads.filter(l => l.status === 'PUSHING').length}
            </strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 搜索与快捷筛选 */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="搜索微信名、需求..."
              className="h-9 pl-8 text-[12px] bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-[12px]"
            onClick={loadLeads}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>

          <Button
            size="sm"
            onClick={() => toast.info('新增线索功能开发中')}
            className="h-9 gap-2 text-[12px] bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" /> 新增线索
          </Button>
        </div>
      </div>

      {/* ── 全屏表格区 ── */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-400">加载中...</div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="text-4xl mb-2">📭</div>
            <div>暂无线索数据</div>
          </div>
        ) : (
          <LeadTable
            leads={filteredLeads}
            viewMode={activeTab}
            onSelect={(lead) => console.log('选中线索:', lead.leadCode)}
            onRefresh={loadLeads}
          />
        )}
      </div>
    </div>
  )
}
