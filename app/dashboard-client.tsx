'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState, useMemo } from 'react'
import { PrimarySidebar } from '@/components/layout/primary-sidebar'
import { SecondarySidebar } from '@/components/layout/secondary-sidebar'
import { WorkspacePane } from '@/components/workspace/workspace-pane'
import { CustomerManagement } from '@/components/customers/customer-management'
import { LeadManagementClient } from '@/components/leads/lead-management-client'
import { OpportunityManagementClient } from '@/components/opportunities/opportunity-management-client'
import { MyDashboard } from '@/components/dashboard/my-dashboard'
import { AuditRail } from '@/components/audit-rail/audit-panel'
import { mockOpportunities, mockProducts, mockActionLogs, mockUser, mockLeads } from '@/lib/mock-data'
import { addAuditNote } from '@/app/actions/audit'
import type { Opportunity, NavSection, StageId, ActionLog, Lead, LeadRow, OpportunityRow } from '@/lib/types'

interface DashboardClientProps {
  initialNav: NavSection
  initialLeads: LeadRow[] | null
  initialOpportunities: OpportunityRow[] | null
  initialLeadTab: string
  initialLeadSearch: string
  selectedLeadId: string | null
}

export function DashboardClient({
  initialNav,
  initialLeads,
  initialOpportunities,
  initialLeadTab,
  initialLeadSearch,
  selectedLeadId,
}: DashboardClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 从 URL 读取当前导航状态
  const activeNav = (searchParams.get('nav') || initialNav) as NavSection

  // 商机相关状态（保持原有逻辑）
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities)
  const [leads, setLeads] = useState<Lead[]>(mockLeads)
  const [selectedId, setSelectedId] = useState<string>(mockOpportunities[0].id)
  const [viewingStage, setViewingStage] = useState<StageId>(mockOpportunities[0].stageId)
  const [actionLogs, setActionLogs] = useState<Record<string, ActionLog[]>>(mockActionLogs)
  const [showAuditRail, setShowAuditRail] = useState(true)

  // URL 更新辅助函数
  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, router]
  )

  // 导航切换 - 更新 URL
  const handleNavChange = useCallback(
    (nav: NavSection) => {
      // 切换导航时清除其他参数
      const params = new URLSearchParams()
      params.set('nav', nav)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router]
  )

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selectedOpportunity = useMemo(
    () => opportunities.find((o) => o.id === selectedId) ?? opportunities[0],
    [opportunities, selectedId]
  )

  const currentLogs = useMemo(() => actionLogs[selectedId] ?? [], [actionLogs, selectedId])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const appendLog = useCallback(
    (oppId: string, log: Omit<ActionLog, 'id' | 'opportunityId' | 'operatorId' | 'operatorName'>) => {
      const entry: ActionLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        opportunityId: oppId,
        operatorId: mockUser.id,
        operatorName: mockUser.name,
        ...log,
      }
      setActionLogs((prev) => ({
        ...prev,
        [oppId]: [...(prev[oppId] ?? []), entry],
      }))
    },
    []
  )

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSelectOpportunity = (opp: Opportunity) => {
    setSelectedId(opp.id)
    setViewingStage(opp.stageId)
  }

  const handleOpportunityUpdate = (data: Partial<Opportunity>) => {
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === selectedId ? { ...o, ...data, updatedAt: new Date().toISOString() } : o
      )
    )
  }

  const handleSave = () => {
    appendLog(selectedId, { actionType: 'FORM', actionLabel: '保存草稿' })
  }

  const handleAdvanceStage = () => {
    const stageMap: Record<StageId, StageId | null> = {
      P1: 'P2',
      P2: 'P3',
      P3: 'P4',
      P4: 'P5',
      P5: 'P6',
      P6: 'P7',
      P7: 'P8',
      P8: null,
    }
    const next = stageMap[selectedOpportunity.stageId]
    if (!next) return
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === selectedId ? { ...o, stageId: next, updatedAt: new Date().toISOString() } : o
      )
    )
    setViewingStage(next)
    appendLog(selectedId, {
      actionType: 'STAGE_CHANGE',
      actionLabel: `推进至 ${next}`,
      remark: `从 ${selectedOpportunity.stageId} 推进`,
    })
  }

  const handleQuoteSent = () => {
    appendLog(selectedId, {
      actionType: 'QUOTE',
      actionLabel: '发送报价',
      remark: '报价单已通过邮件/微信发送给客户',
    })
  }

  const handleAddNote = useCallback(
    async (remark: string, files: File[]) => {
      try {
        const newLog = await addAuditNote(selectedId, remark, files)
        setActionLogs((prev) => ({
          ...prev,
          [selectedId]: [...(prev[selectedId] ?? []), newLog],
        }))
      } catch (err) {
        console.error('[v0] Error adding note:', err)
        throw err
      }
    },
    [selectedId]
  )

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Pane 1 — 主导航栏 (56px) */}
      <PrimarySidebar activeNav={activeNav} onNavChange={handleNavChange} userName={mockUser.name} />

      {/* Pane 2+ — 根据 activeNav 显示不同内容 */}
      {activeNav === 'leads' ? (
        <div className="flex-1 overflow-hidden">
          <LeadManagementClient
            initialLeads={initialLeads || []}
            initialTab={initialLeadTab === 'pool' ? 'pool' : 'my_leads'}
            initialSearch={initialLeadSearch}
            initialLeadId={selectedLeadId}
          />
        </div>
      ) : activeNav === 'opportunities' ? (
        <div className="flex-1 overflow-hidden">
          <OpportunityManagementClient
            initialOpportunities={initialOpportunities || []}
          />
        </div>
      ) : activeNav === 'customers' ? (
        <div className="flex-1 overflow-hidden">
          <CustomerManagement />
        </div>
      ) : activeNav === 'analytics' ? (
        <div className="flex-1 overflow-hidden">
          <MyDashboard
            opportunities={opportunities}
            leads={leads}
            actionLogs={actionLogs}
            assignee={mockUser.name}
            userName={mockUser.name}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#9ca3af]">
          <div className="text-center">
            <div className="text-[14px] font-medium mb-2">此模块在建设中</div>
            <div className="text-[12px]">敬请期待</div>
          </div>
        </div>
      )}
    </div>
  )
}
