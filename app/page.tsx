'use client'

import { useState, useMemo, useCallback } from 'react'
import { PrimarySidebar } from '@/components/layout/primary-sidebar'
import { SecondarySidebar } from '@/components/layout/secondary-sidebar'
import { WorkspacePane } from '@/components/workspace/workspace-pane'
import { CustomerManagement } from '@/components/customers/customer-management'
import { AuditRail } from '@/components/audit-rail/audit-panel'
import { mockOpportunities, mockProducts, mockActionLogs, mockUser } from '@/lib/mock-data'
import { addAuditNote } from '@/app/actions/audit'
import type { Opportunity, NavSection, StageId, ActionLog, Customer } from '@/lib/types'
import { ClipboardList } from 'lucide-react'

export default function SalesHub() {
  const [activeNav, setActiveNav] = useState<NavSection>('opportunities')
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities)
  const [selectedId, setSelectedId] = useState<string>(mockOpportunities[0].id)
  const [viewingStage, setViewingStage] = useState<StageId>(mockOpportunities[0].stageId)
  const [actionLogs, setActionLogs] = useState<Record<string, ActionLog[]>>(mockActionLogs)
  const [showAuditRail, setShowAuditRail] = useState(true)

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selectedOpportunity = useMemo(
    () => opportunities.find((o) => o.id === selectedId) ?? opportunities[0],
    [opportunities, selectedId]
  )

  const currentLogs = useMemo(
    () => actionLogs[selectedId] ?? [],
    [actionLogs, selectedId]
  )

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

  const handleCreateCustomer = (customerData: any) => {
    const newCustomerId = `CUST-${Date.now()}`
    const newCustomer: Customer = {
      id: newCustomerId,
      name: customerData.customerName,
      passportNo: customerData.passportNo || `PASSPORT-${Date.now()}`,
      phone: customerData.phone || '',
      email: customerData.email || '',
      wechat: customerData.wechat || '',
    }

    // Create a new opportunity with this customer
    const newOpportunity: Opportunity = {
      id: `OPP-${Date.now()}`,
      customerId: newCustomerId,
      customer: newCustomer,
      stageId: 'P1',
      status: 'active',
      serviceType: 'VISA',
      serviceTypeLabel: '旅游签证',
      estimatedAmount: 0,
      currency: 'CNY',
      requirements: '',
      notes: '',
      destination: customerData.industry || '',
      travelDate: '',
      assignee: mockUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setOpportunities((prev) => [newOpportunity, ...prev])
    setActionLogs((prev) => ({
      ...prev,
      [newOpportunity.id]: [
        {
          id: `log-${Date.now()}`,
          opportunityId: newOpportunity.id,
          operatorId: mockUser.id,
          operatorName: mockUser.name,
          actionType: 'CREATE',
          actionLabel: '创建商机',
          remark: `创建新客户 ${customerData.customerName} 及其首个商机`,
          timestamp: new Date().toISOString(),
        },
      ],
    }))

    alert('客户已创建，并自动生成了一个新商机')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Pane 1 — primary nav (64px) */}
      <PrimarySidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        userName={mockUser.name}
      />

      {/* Pane 2 — conditional content based on activeNav */}
      {activeNav === 'opportunities' ? (
        <>
          {/* Opportunity list (280px) */}
          <SecondarySidebar
            opportunities={opportunities}
            selectedId={selectedId}
            onSelect={handleSelectOpportunity}
          />

          {/* Pane 3 — workspace (flex-1) */}
          <WorkspacePane
            opportunity={selectedOpportunity}
            allProducts={mockProducts}
            viewingStage={viewingStage}
            onViewingStageChange={setViewingStage}
            onOpportunityUpdate={handleOpportunityUpdate}
            onSave={handleSave}
            onAdvanceStage={handleAdvanceStage}
            onQuoteSent={handleQuoteSent}
          />

          {/* Audit rail toggle button (shown when rail is hidden) */}
          {!showAuditRail && (
            <button
              onClick={() => setShowAuditRail(true)}
              title="查看操作记录"
              aria-label="打开操作记录面板"
              className="flex h-8 w-8 shrink-0 items-center justify-center self-start border-l border-[#e5e7eb] text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151] mt-[52px]"
            >
              <ClipboardList size={14} />
            </button>
          )}

          {/* Pane 4 — audit rail (256px, toggleable) */}
          {showAuditRail && (
            <AuditRail
              logs={currentLogs}
              opportunityId={selectedId}
              onClose={() => setShowAuditRail(false)}
              onAddNote={handleAddNote}
            />
          )}
        </>
      ) : activeNav === 'customers' ? (
        <div className="flex-1">
          <CustomerManagement opportunities={opportunities} onCustomerCreate={handleCreateCustomer} />
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
