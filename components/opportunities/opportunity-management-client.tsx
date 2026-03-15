'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, RefreshCw, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getOpportunitiesAction, type OpportunityRow } from '@/app/actions/opportunity'
import { getCustomersAction, type CustomerRow } from '@/app/actions/customer'
import { CreateOpportunityDialog } from './create-opportunity-dialog'
import { OpportunityCard } from './opportunity-card'
import { OpportunityDetail } from './opportunity-detail'
import { toast } from 'sonner'

interface OpportunityManagementClientProps {
  initialOpportunities: OpportunityRow[]
}

export function OpportunityManagementClient({
  initialOpportunities,
}: OpportunityManagementClientProps) {
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>(initialOpportunities)
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [selectedOppId, setSelectedOppId] = useState<string | null>(
    initialOpportunities[0]?.id || null
  )
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    stageId: 'all',
    search: '',
  })

  // 加载客户列表
  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const data = await getCustomersAction()
      setCustomers(data)
    } catch (error) {
      console.error('Failed to load customers:', error)
    }
  }

  const loadOpportunities = async () => {
    setLoading(true)
    try {
      const filterParams: any = {}
      if (filters.status !== 'all') filterParams.status = filters.status
      if (filters.stageId !== 'all') filterParams.stageId = filters.stageId

      const data = await getOpportunitiesAction(filterParams)
      setOpportunities(data)

      // 如果当前选中的商机不在新列表中，选择第一个
      if (selectedOppId && !data.find(o => o.id === selectedOppId)) {
        setSelectedOppId(data[0]?.id || null)
      }
    } catch (error) {
      console.error('Failed to load opportunities:', error)
      toast.error('加载商机失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadOpportunities()
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleCreateOpportunity = (customer: CustomerRow) => {
    setSelectedCustomer(customer)
    setCreateDialogOpen(true)
  }

  const selectedOpportunity = opportunities.find(o => o.id === selectedOppId)

  // 过滤商机列表
  const filteredOpportunities = opportunities.filter(opp => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        opp.opportunityCode.toLowerCase().includes(searchLower) ||
        opp.serviceTypeLabel?.toLowerCase().includes(searchLower) ||
        opp.requirements?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // 统计数据
  const stats = {
    total: opportunities.length,
    active: opportunities.filter(o => o.status === 'active').length,
    won: opportunities.filter(o => o.status === 'won').length,
    lost: opportunities.filter(o => o.status === 'lost').length,
  }

  return (
    <div className="flex h-full">
      {/* 左侧：商机列表 */}
      <div className="w-80 border-r flex flex-col bg-slate-50">
        {/* 头部 */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">商机管理</h2>
            <Button
              size="sm"
              onClick={() => {
                if (customers.length === 0) {
                  toast.error('请先创建客户')
                  return
                }
                setSelectedCustomer(customers[0])
                setCreateDialogOpen(true)
              }}
              className="h-8 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              新建商机
            </Button>
          </div>

          {/* 搜索 */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="搜索商机..."
              className="h-9 pl-8 text-xs"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* 过滤器 */}
          <div className="grid grid-cols-2 gap-2">
            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="won">已赢单</SelectItem>
                <SelectItem value="lost">已失败</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.stageId} onValueChange={(v) => handleFilterChange('stageId', v)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部阶段</SelectItem>
                <SelectItem value="P1">P1 初步接触</SelectItem>
                <SelectItem value="P2">P2 需求确认</SelectItem>
                <SelectItem value="P3">P3 方案设计</SelectItem>
                <SelectItem value="P4">P4 报价</SelectItem>
                <SelectItem value="P5">P5 谈判</SelectItem>
                <SelectItem value="P6">P6 合同</SelectItem>
                <SelectItem value="P7">P7 执行</SelectItem>
                <SelectItem value="P8">P8 交付</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 统计 */}
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-600">
            <span>总计: <strong>{stats.total}</strong></span>
            <span>进行中: <strong className="text-blue-600">{stats.active}</strong></span>
            <span>赢单: <strong className="text-green-600">{stats.won}</strong></span>
          </div>
        </div>

        {/* 商机列表 */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-slate-400">
              加载中...
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm">暂无商机</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOpportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  isSelected={opp.id === selectedOppId}
                  onClick={() => setSelectedOppId(opp.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：商机详情 */}
      <div className="flex-1 overflow-hidden">
        {selectedOpportunity ? (
          <OpportunityDetail
            opportunity={selectedOpportunity}
            onRefresh={handleRefresh}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <div className="text-sm">请选择一个商机</div>
            </div>
          </div>
        )}
      </div>

      {/* 新建商机对话框 */}
      {selectedCustomer && (
        <CreateOpportunityDialog
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.customerName}
          isOpen={createDialogOpen}
          onClose={() => {
            setCreateDialogOpen(false)
            setSelectedCustomer(null)
          }}
          onSuccess={() => {
            handleRefresh()
          }}
        />
      )}
    </div>
  )
}
