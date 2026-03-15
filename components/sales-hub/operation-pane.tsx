'use client'

import { BreadcrumbStepper } from './breadcrumb-stepper'
import { P1RequirementForm } from './p1-requirement-form'
import { P2ProductMatcher } from './p2-product-matcher'
import { P3QuoteView } from './p3-quote-view'
import type { Opportunity, Product, SelectedProduct, StageId } from '@/lib/types'

interface OperationPaneProps {
  opportunity: Opportunity
  products: Product[]
  selectedProducts: SelectedProduct[]
  onOpportunityUpdate: (data: Partial<Opportunity>) => void
  onProductsChange: (products: SelectedProduct[]) => void
  onSave: () => void
  onAdvanceStage: () => void
}

const stageOrder: Record<StageId, number> = {
  P1: 0,
  P2: 1,
  P3: 2,
}

const nextStageLabel: Record<StageId, string | null> = {
  P1: '推进至 P2 方案',
  P2: '推进至 P3 报价',
  P3: null,
}

export function OperationPane({
  opportunity,
  products,
  selectedProducts,
  onOpportunityUpdate,
  onProductsChange,
  onSave,
  onAdvanceStage,
}: OperationPaneProps) {
  const canAdvance = opportunity.stageId !== 'P3'

  return (
    <div className="flex h-full flex-1 flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-2">
        <BreadcrumbStepper currentStage={opportunity.stageId} />
        <div className="text-[12px] text-[#6b7280]">
          商机编号: <span className="font-mono">{opportunity.opportunityCode}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {opportunity.stageId === 'P1' && (
          <P1RequirementForm
            opportunity={opportunity}
            onUpdate={onOpportunityUpdate}
          />
        )}
        {opportunity.stageId === 'P2' && (
          <P2ProductMatcher
            products={products}
            selectedProducts={selectedProducts}
            onProductsChange={onProductsChange}
          />
        )}
        {opportunity.stageId === 'P3' && (
          <P3QuoteView
            opportunity={opportunity}
            selectedProducts={selectedProducts}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-[#e5e7eb] px-4 py-2">
        <button
          onClick={onSave}
          className="h-7 rounded-sm border border-[#e5e7eb] bg-white px-3 text-[12px] font-medium text-[#374151] transition-colors hover:bg-[#f3f4f6]"
        >
          保存
        </button>
        {canAdvance && nextStageLabel[opportunity.stageId] && (
          <button
            onClick={onAdvanceStage}
            className="h-7 rounded-sm bg-[#2563eb] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#1d4ed8]"
          >
            {nextStageLabel[opportunity.stageId]}
          </button>
        )}
        {opportunity.stageId === 'P3' && (
          <button className="h-7 rounded-sm bg-[#22c55e] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#16a34a]">
            生成报价单
          </button>
        )}
      </div>
    </div>
  )
}
