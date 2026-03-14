'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, Plus, Edit2, Archive } from 'lucide-react'
import type { Opportunity, ActionLog, Lead } from '@/lib/types'

interface CustomerProfileProps {
  customerId: string
  customerName: string
  opportunities: Opportunity[]
  leads: Lead[]
  actionLogs: Record<string, ActionLog[]>
  onBack: () => void
  onCreateOpportunity?: () => void
  onAddNote?: (note: string) => void
}

type TabId = 'opportunities' | 'leads' | 'actions'

interface ConsolidatedAction {
  id: string
  timestamp: string
  operatorName: string
  actionType: string
  actionLabel: string
  opportunityId?: string
  opportunityStage?: string
  remark: string
  files?: any[]
}

export function CustomerProfile({
  customerId,
  customerName,
  opportunities,
  leads,
  actionLogs,
  onBack,
  onCreateOpportunity,
  onAddNote,
}: CustomerProfileProps) {
  const [activeTab, setActiveTab] = useState<TabId>('opportunities')
  const [newNote, setNewNote] = useState('')

  // Filter customer's opportunities and leads
  const customerOpportunities = useMemo(
    () => opportunities.filter((o) => o.customerId === customerId),
    [opportunities, customerId]
  )

  const customerLeads = useMemo(
    () => leads.filter((l) => l.convertedOpportunityId && customerOpportunities.some((o) => o.id === l.convertedOpportunityId)),
    [leads, customerOpportunities]
  )

  // Consolidate action logs from all customer opportunities
  const consolidatedActions = useMemo(() => {
    const allActions: ConsolidatedAction[] = []
    
    customerOpportunities.forEach((opp) => {
      const logs = actionLogs[opp.id] ?? []
      logs.forEach((log) => {
        allActions.push({
          id: log.id,
          timestamp: log.timestamp,
          operatorName: log.operatorName,
          actionType: log.actionType,
          actionLabel: log.actionLabel,
          opportunityId: opp.id,
          opportunityStage: opp.stageId,
          remark: log.remark,
          files: log.files,
        })
      })
    })

    // Sort by timestamp descending
    return allActions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [customerOpportunities, actionLogs])

  // Calculate core metrics
  const metrics = useMemo(
    () => ({
      totalRevenue: customerOpportunities.reduce((sum, o) => sum + (o.estimatedAmount || 0), 0),
      activeOpportunities: customerOpportunities.filter((o) => o.status === 'active').length,
      lastInteraction: consolidatedActions[0]?.timestamp || '',
    }),
    [customerOpportunities, consolidatedActions]
  )

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote?.(newNote)
      setNewNote('')
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[12px] text-[#2563eb]">{customerId}</span>
                <span className="text-[14px] font-semibold text-[#111827]">{customerName}</span>
              </div>
              <div className="mt-1 flex gap-1">
                <span className="inline-flex rounded-sm bg-[#f0f9ff] px-1.5 py-0.5 text-[10px] text-[#0369a1]">#制造业</span>
                <span className="inline-flex rounded-sm bg-[#f0f9ff] px-1.5 py-0.5 text-[10px] text-[#0369a1]">#外资PMA</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="font-mono text-[13px] font-semibold text-[#111827]">
                ¥{(metrics.totalRevenue / 10000).toFixed(1)}万
              </div>
              <div className="text-[11px] text-[#9ca3af]">累计成交额</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-[13px] font-semibold text-[#111827]">{metrics.activeOpportunities}</div>
              <div className="text-[11px] text-[#9ca3af]">合作中商机</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-medium text-[#111827]">
                {metrics.lastInteraction
                  ? new Date(metrics.lastInteraction).toLocaleDateString('zh-CN')
                  : '—'}
              </div>
              <div className="text-[11px] text-[#9ca3af]">最后跟进</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1.5">
            <button
              onClick={onCreateOpportunity}
              className="flex h-8 items-center gap-1 rounded-sm bg-[#2563eb] px-2 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
            >
              <Plus size={14} />
              新建商机
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]">
              <Edit2 size={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f9fafb]">
              <Archive size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#e5e7eb] px-5">
        <div className="flex gap-6">
          {(['opportunities', 'leads', 'actions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`h-10 text-[13px] font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-[#2563eb] text-[#2563eb]'
                  : 'border-b-2 border-transparent text-[#6b7280] hover:text-[#111827]'
              }`}
            >
              {tab === 'opportunities' && `关联商机 (${customerOpportunities.length})`}
              {tab === 'leads' && `关联线索 (${customerLeads.length})`}
              {tab === 'actions' && '全量跟进记录'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'opportunities' && (
          <OpportunitiesTab opportunities={customerOpportunities} />
        )}
        {activeTab === 'leads' && (
          <LeadsTab leads={customerLeads} />
        )}
        {activeTab === 'actions' && (
          <ActionsTab 
            actions={consolidatedActions} 
            newNote={newNote}
            onNewNoteChange={setNewNote}
            onAddNote={handleAddNote}
          />
        )}
      </div>
    </div>
  )
}

function OpportunitiesTab({ opportunities }: { opportunities: Opportunity[] }) {
  return (
    <div className="p-4">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">商机编号</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">产品名称</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">阶段</th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">金额</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">创建人</th>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">状态</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opp) => (
            <tr key={opp.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]">
              <td className="px-3 py-2">
                <span className="font-mono text-[12px] text-[#2563eb]">{opp.id}</span>
              </td>
              <td className="px-3 py-2 text-[13px] text-[#111827]">{opp.serviceTypeLabel}</td>
              <td className="px-3 py-2">
                <span className="inline-flex rounded-sm bg-[#e0e7ff] px-1.5 py-0.5 text-[11px] font-medium text-[#4f46e5]">
                  {opp.stageId}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-mono text-[13px] text-[#111827]">
                ¥{opp.estimatedAmount?.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-[13px] text-[#6b7280]">{opp.assignee}</td>
              <td className="px-3 py-2">
                <span className={`inline-flex rounded-sm px-1.5 py-0.5 text-[11px] font-medium ${
                  opp.status === 'active' ? 'bg-[#dcfce7] text-[#16a34a]' :
                  opp.status === 'won' ? 'bg-[#dbeafe] text-[#0284c7]' :
                  'bg-[#fee2e2] text-[#dc2626]'
                }`}>
                  {opp.status === 'active' ? '活跃' : opp.status === 'won' ? '成交' : '丢失'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LeadsTab({ leads }: { leads: Lead[] }) {
  return (
    <div className="p-4">
      {leads.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-[13px] text-[#9ca3af]">
          暂无关联线索记录
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-sm border border-[#e5e7eb] bg-white p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[13px] font-medium text-[#111827]">{lead.wechatName}</div>
                  <div className="mt-1 text-[12px] text-[#6b7280]">{lead.initialIntent}</div>
                </div>
                <span className="text-[11px] text-[#9ca3af]">
                  {new Date(lead.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-[#6b7280]">
                <span className="inline-flex rounded-sm bg-[#f3f4f6] px-1.5 py-0.5">来源：{lead.source}</span>
                <span className="inline-flex rounded-sm bg-[#f3f4f6] px-1.5 py-0.5">
                  转化：{lead.convertedOpportunityId ? '已转化' : '未转化'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionsTab({
  actions,
  newNote,
  onNewNoteChange,
  onAddNote,
}: {
  actions: ConsolidatedAction[]
  newNote: string
  onNewNoteChange: (note: string) => void
  onAddNote: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Quick Add Note */}
      <div className="border-b border-[#e5e7eb] p-4">
        <div className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => onNewNoteChange(e.target.value)}
            placeholder="添加客户级备注..."
            rows={2}
            className="flex-1 rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb] resize-none"
          />
          <button
            onClick={onAddNote}
            className="h-16 rounded-sm bg-[#2563eb] px-3 text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
          >
            添加
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {actions.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-[13px] text-[#9ca3af]">
              暂无跟进记录
            </div>
          ) : (
            actions.map((action, idx) => (
              <div key={action.id} className="relative pb-4">
                {/* Timeline dot and line */}
                <div className="absolute left-[5px] top-2 h-3 w-3 rounded-full bg-[#2563eb]" />
                {idx < actions.length - 1 && (
                  <div className="absolute left-[14px] top-5 bottom-0 w-px bg-[#e5e7eb]" />
                )}

                {/* Content */}
                <div className="ml-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[12px] font-medium text-[#111827]">{action.operatorName}</span>
                    <span className="text-[11px] text-[#6b7280]">{action.actionLabel}</span>
                    {action.opportunityId && (
                      <span className="inline-flex rounded-sm bg-[#f3f4f6] px-1 py-0.5 font-mono text-[10px] text-[#2563eb]">
                        {action.opportunityId} / {action.opportunityStage}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[12px] text-[#6b7280]">{action.remark}</div>
                  <div className="mt-1 text-[11px] text-[#9ca3af]">
                    {new Date(action.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
