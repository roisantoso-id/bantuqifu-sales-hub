'use client'

import type { Opportunity, Product, StageId, OpportunityP2Data, OpportunityP3Data } from '@/lib/types'
import { BreadcrumbStepper } from './breadcrumb-stepper'
import { P1RequirementForm } from './p1-requirement-form'
import { P2ProductMatcher } from './p2-product-matcher'
import { P3QuoteView } from './p3-quote-view'
import { ChevronRight, Save } from 'lucide-react'

interface WorkspaceProps {
  opportunity: Opportunity
  allProducts: Product[]
  viewingStage: StageId
  onViewingStageChange: (stage: StageId) => void
  onOpportunityUpdate: (data: Partial<Opportunity>) => void
  onSave: () => void
  onAdvanceStage: () => void
  onQuoteSent: () => void
}

const STAGE_ORDER: Record<StageId, number> = { P1: 0, P2: 1, P3: 2 }
const STAGE_NEXT_LABEL: Record<StageId, string> = {
  P1: '保存并推进至 P2',
  P2: '保存并推进至 P3',
  P3: '完成并赢单',
}

export function WorkspacePane({
  opportunity,
  allProducts,
  viewingStage,
  onViewingStageChange,
  onOpportunityUpdate,
  onSave,
  onAdvanceStage,
  onQuoteSent,
}: WorkspaceProps) {
  const isOnCurrentStage = viewingStage === opportunity.stageId
  const currentIdx = STAGE_ORDER[opportunity.stageId]
  const viewingIdx = STAGE_ORDER[viewingStage]
  const isHistorical = viewingIdx < currentIdx

  const handleP2DataChange = (data: OpportunityP2Data[]) => {
    onOpportunityUpdate({ p2Data: data })
  }

  const handleP3DataChange = (data: OpportunityP3Data[]) => {
    onOpportunityUpdate({ p3Data: data })
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-white">
      {/* Workspace header */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-2.5">
        <div className="flex items-center gap-3">
          {/* Client breadcrumb */}
          <div className="flex items-center gap-1 text-[12px] text-[#9ca3af]">
            <span>商机</span>
            <ChevronRight size={12} />
            <span className="text-[#374151]">{opportunity.customer.name}</span>
            <ChevronRight size={12} />
            <span className="font-mono text-[#374151]">{opportunity.id}</span>
          </div>
        </div>

        {/* Stage stepper */}
        <BreadcrumbStepper
          currentStage={opportunity.stageId}
          viewingStage={viewingStage}
          onStageClick={onViewingStageChange}
        />
      </div>

      {/* Historical view banner */}
      {isHistorical && (
        <div className="flex items-center gap-2 border-b border-[#fde68a] bg-[#fffbeb] px-5 py-1.5">
          <span className="text-[12px] text-[#92400e]">
            正在查看历史阶段 {viewingStage}，当前商机处于 {opportunity.stageId}
          </span>
          <button
            onClick={() => onViewingStageChange(opportunity.stageId)}
            className="text-[12px] font-medium text-[#2563eb] hover:underline"
          >
            返回当前
          </button>
        </div>
      )}

      {/* Stage content — scrollable */}
      <div className="flex-1 overflow-hidden">
        {viewingStage === 'P1' && (
          <div className="h-full overflow-y-auto px-5 py-4">
            <P1RequirementForm opportunity={opportunity} onUpdate={onOpportunityUpdate} />
          </div>
        )}
        {viewingStage === 'P2' && (
          <P2ProductMatcher
            allProducts={allProducts}
            selectedData={opportunity.p2Data || []}
            onDataChange={handleP2DataChange}
          />
        )}
        {viewingStage === 'P3' && (
          <P3QuoteView
            opportunity={opportunity}
            allProducts={allProducts}
            p3Data={opportunity.p3Data || []}
            onP3DataChange={handleP3DataChange}
            onQuoteSent={onQuoteSent}
          />
        )}
      </div>

      {/* Footer action bar */}
      {!isHistorical && viewingStage !== 'P3' && (
        <div className="flex items-center justify-between border-t border-[#e5e7eb] bg-[#f9fafb] px-5 py-2">
          <button
            onClick={onSave}
            className="flex h-8 items-center gap-1.5 rounded-sm border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#374151] hover:bg-white hover:border-[#d1d5db]"
          >
            <Save size={13} />
            保存草稿
          </button>
          {isOnCurrentStage && (
            <button
              onClick={onAdvanceStage}
              className="flex h-8 items-center gap-1.5 rounded-sm bg-[#2563eb] px-3 text-[13px] font-medium text-white hover:bg-[#1d4ed8]"
            >
              {STAGE_NEXT_LABEL[opportunity.stageId]}
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
