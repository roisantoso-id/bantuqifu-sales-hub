'use client'

import { useState, useMemo } from 'react'
import { OpportunityList } from '@/components/sales-hub/opportunity-list'
import { OperationPane } from '@/components/sales-hub/operation-pane'
import { ActionTimeline } from '@/components/sales-hub/action-timeline'
import { UserProfileBar } from '@/components/sales-hub/user-profile'
import {
  mockOpportunities,
  mockProducts,
  mockActionLogs,
  mockUser,
} from '@/lib/mock-data'
import type { Opportunity, StageId, SelectedProduct, ActionLog } from '@/lib/types'

export default function SalesHub() {
  // State
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities)
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(
    mockOpportunities[0]?.id || null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<StageId | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, SelectedProduct[]>
  >({})
  const [actionLogs, setActionLogs] = useState<Record<string, ActionLog[]>>(mockActionLogs)

  // Derived state
  const selectedOpportunity = useMemo(() => {
    return opportunities.find((opp) => opp.id === selectedOpportunityId) || null
  }, [opportunities, selectedOpportunityId])

  const currentProducts = useMemo(() => {
    return selectedOpportunityId ? selectedProducts[selectedOpportunityId] || [] : []
  }, [selectedProducts, selectedOpportunityId])

  const currentLogs = useMemo(() => {
    return selectedOpportunityId ? actionLogs[selectedOpportunityId] || [] : []
  }, [actionLogs, selectedOpportunityId])

  // Handlers
  const handleSelectOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunityId(opportunity.id)
  }

  const handleOpportunityUpdate = (data: Partial<Opportunity>) => {
    if (!selectedOpportunityId) return
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === selectedOpportunityId
          ? { ...opp, ...data, updatedAt: new Date().toISOString() }
          : opp
      )
    )
  }

  const handleProductsChange = (products: SelectedProduct[]) => {
    if (!selectedOpportunityId) return
    setSelectedProducts((prev) => ({
      ...prev,
      [selectedOpportunityId]: products,
    }))
  }

  const handleSave = () => {
    if (!selectedOpportunity) return
    
    const newLog: ActionLog = {
      id: `log-${Date.now()}`,
      opportunityId: selectedOpportunity.id,
      operatorId: mockUser.id,
      operatorName: mockUser.name,
      actionType: 'FORM',
      actionLabel: '保存变更',
      timestamp: new Date().toISOString(),
    }
    
    setActionLogs((prev) => ({
      ...prev,
      [selectedOpportunity.id]: [...(prev[selectedOpportunity.id] || []), newLog],
    }))
  }

  const handleAdvanceStage = () => {
    if (!selectedOpportunity) return
    
    const stageMap: Record<StageId, StageId | null> = {
      P1: 'P2',
      P2: 'P3',
      P3: null,
    }
    
    const nextStage = stageMap[selectedOpportunity.stageId]
    if (!nextStage) return
    
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === selectedOpportunity.id
          ? { ...opp, stageId: nextStage, updatedAt: new Date().toISOString() }
          : opp
      )
    )
    
    const newLog: ActionLog = {
      id: `log-${Date.now()}`,
      opportunityId: selectedOpportunity.id,
      operatorId: mockUser.id,
      operatorName: mockUser.name,
      actionType: 'STAGE_CHANGE',
      actionLabel: `推进至 ${nextStage}`,
      timestamp: new Date().toISOString(),
    }
    
    setActionLogs((prev) => ({
      ...prev,
      [selectedOpportunity.id]: [...(prev[selectedOpportunity.id] || []), newLog],
    }))
  }

  return (
    <div className="flex h-screen flex-col bg-[#f9fafb]">
      {/* Top Bar */}
      <header className="flex h-10 items-center justify-between border-b border-[#e5e7eb] bg-white px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[13px] font-semibold text-[#111827]">Bantu Sales Hub</h1>
          <span className="rounded-sm bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] font-medium text-[#6b7280]">
            商机管理
          </span>
        </div>
        <UserProfileBar user={mockUser} />
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Pane A: Opportunity List */}
        <OpportunityList
          opportunities={opportunities}
          selectedId={selectedOpportunityId}
          onSelect={handleSelectOpportunity}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          stageFilter={stageFilter}
          onStageFilterChange={setStageFilter}
        />

        {/* Pane B: Operation Area */}
        {selectedOpportunity ? (
          <OperationPane
            opportunity={selectedOpportunity}
            products={mockProducts}
            selectedProducts={currentProducts}
            onOpportunityUpdate={handleOpportunityUpdate}
            onProductsChange={handleProductsChange}
            onSave={handleSave}
            onAdvanceStage={handleAdvanceStage}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-white text-[13px] text-[#9ca3af]">
            请从左侧选择一个商机
          </div>
        )}

        {/* Pane C: Action Timeline */}
        {selectedOpportunity && <ActionTimeline logs={currentLogs} />}
      </div>
    </div>
  )
}
