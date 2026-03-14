'use client'

import { useState, useMemo, useCallback } from 'react'
import { PrimarySidebar } from '@/components/layout/primary-sidebar'
import { SecondarySidebar } from '@/components/layout/secondary-sidebar'
import { WorkspacePane } from '@/components/workspace/workspace-pane'
import { CustomerManagement } from '@/components/customers/customer-management'
import { LeadManagement } from '@/components/leads/lead-management'
import { MyDashboard } from '@/components/dashboard/my-dashboard'
import { AuditRail } from '@/components/audit-rail/audit-panel'
import { mockOpportunities, mockProducts, mockActionLogs, mockUser, mockLeads } from '@/lib/mock-data'
import { addAuditNote } from '@/app/actions/audit'
import type { Opportunity, NavSection, StageId, ActionLog, Customer, Lead } from '@/lib/types'

export default function SalesHub() {
  const [activeNav, setActiveNav] = useState<NavSection>('opportunities')
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities)
  const [leads, setLeads] = useState<Lead[]>(mockLeads)
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

  const handleConvertLeadToOpportunity = (lead: Lead, opportunityData: Partial<Opportunity>) => {
    // 生成商机ID（从线索ID派生）
    const newOpportunityId = `${lead.id.replace('LEAD-', '21231231')}`
    
    // 创建新商机
    const newOpportunity: Opportunity = {
      id: newOpportunityId,
      customerId: opportunityData.customer?.id || `CUST-${Date.now()}`,
      customer: opportunityData.customer || { id: '', name: '', passportNo: '', phone: '', email: '' },
      stageId: 'P1',
      status: 'active',
      serviceType: 'VISA',
      serviceTypeLabel: '需求收集中',
      estimatedAmount: 0,
      currency: 'CNY',
      requirements: opportunityData.requirements || '',
      notes: opportunityData.notes || `[线索转化] ${lead.id}`,
      destination: '',
      travelDate: '',
      assignee: mockUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 更新线索状态为待转商机，然后标记为已转化
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? {
              ...l,
              status: 'ready_for_opportunity',
              convertedOpportunityId: newOpportunityId,
              updatedAt: new Date().toISOString(),
            }
          : l
      )
    )

    // 添加新商机
    setOpportunities((prev) => [newOpportunity, ...prev])
    setActionLogs((prev) => ({
      ...prev,
      [newOpportunityId]: [
        {
          id: `log-${Date.now()}`,
          opportunityId: newOpportunityId,
          operatorId: mockUser.id,
          operatorName: mockUser.name,
          actionType: 'CREATE',
          actionLabel: '线索转商机',
          remark: `从线索 ${lead.id} (${lead.wechatName}) 转化而来`,
          timestamp: new Date().toISOString(),
        },
      ],
    }))

    alert('线索已转为商机，商机ID：' + newOpportunityId)
  }

  const handleLeadStatusChange = (leadId: string, status: Lead['status']) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, status, updatedAt: new Date().toISOString() } : lead
      )
    )
  }

  const handleAddLead = (lead: Lead) => {
    setLeads((prev) => [lead, ...prev])
  }

  const handleDeleteLead = (leadId: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== leadId))
  }

  const handleDiscardLead = (leadId: string, reason: any, discardedBy: string) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status: 'discarded' as const,
              discardedAt: new Date().toISOString(),
              discardReason: reason,
              discardedBy,
              assignee: undefined, // 清空负责人，进入公海池
            }
          : lead
      )
    )
  }

  const handleClaimLead = (lead: Lead, newAssignee: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? {
              ...l,
              status: 'new' as const,
              assignee: newAssignee,
              lastActionAt: new Date().toISOString(),
              nextFollowDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 重置为7天后
            }
          : l
      )
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Pane 1 — 主导航栏 (56px) */}
      <PrimarySidebar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        userName={mockUser.name}
      />

      {/* Pane 2+ — 根据 activeNav 显示不同内容 */}
      {activeNav === 'leads' ? (
        <div className="flex-1 overflow-hidden">
          <LeadManagement
            leads={leads}
            opportunities={opportunities}
            onCreateCustomer={handleCreateCustomer}
            onConvertLeadToOpportunity={handleConvertLeadToOpportunity}
            onLeadStatusChange={handleLeadStatusChange}
            onAddLead={handleAddLead}
            onDeleteLead={handleDeleteLead}
            onDiscardLead={handleDiscardLead}
            onClaimLead={handleClaimLead}
          />
        </div>
      ) : activeNav === 'opportunities' ? (
        <>
          {/* 商机列表 (280px) */}
          <SecondarySidebar
            activeNav={activeNav}
            opportunities={opportunities}
            selectedId={selectedId}
            onSelect={handleSelectOpportunity}
          />

          {/* 工作区 (flex-1) */}
          <WorkspacePane
            opportunity={selectedOpportunity}
            allProducts={mockProducts}
            viewingStage={viewingStage}
            onOpportunityUpdate={handleOpportunityUpdate}
            onSave={handleSave}
            onAdvanceStage={handleAdvanceStage}
            onQuoteSent={handleQuoteSent}
            logs={currentLogs}
            onAddNote={handleAddNote}
          />

          {/* 审计栏 (256px) */}
          <AuditRail
            visible={showAuditRail}
            onToggle={setShowAuditRail}
            opportunity={selectedOpportunity}
            logs={currentLogs}
          />
        </>
      ) : activeNav === 'customers' ? (
        <>
          <SecondarySidebar
            activeNav={activeNav}
            opportunities={opportunities}
            selectedId={selectedId}
            onSelect={handleSelectOpportunity}
          />
          <div className="flex-1 overflow-hidden">
            <CustomerManagement
              customers={opportunities.map((o) => ({
                customerId: o.customerId,
                customerName: o.customer.name,
                contactName: mockUser.name,
                phone: o.customer.phone,
                email: o.customer.email,
                level: 'A',
                isLocked: false,
              }))}
              opportunities={opportunities}
              leads={leads}
              actionLogs={actionLogs}
            />
          </div>
        </>
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
