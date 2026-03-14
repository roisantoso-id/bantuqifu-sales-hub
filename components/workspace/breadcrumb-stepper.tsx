'use client'

import { ChevronRight } from 'lucide-react'
import type { StageId } from '@/lib/types'

interface BreadcrumbStepperProps {
  currentStage: StageId
  onStageClick: (stage: StageId) => void
  viewingStage: StageId
}

const STAGES: { id: StageId; label: string; desc: string }[] = [
  { id: 'P1', label: 'P1', desc: '需求收集' },
  { id: 'P2', label: 'P2', desc: '产品匹配' },
  { id: 'P3', label: 'P3', desc: '报价确认' },
]

const STAGE_ORDER: Record<StageId, number> = { P1: 0, P2: 1, P3: 2 }

export function BreadcrumbStepper({ currentStage, onStageClick, viewingStage }: BreadcrumbStepperProps) {
  const currentIdx = STAGE_ORDER[currentStage]

  return (
    <nav aria-label="阶段进度" className="flex items-center gap-0.5">
      {STAGES.map((stage, i) => {
        const stageIdx = STAGE_ORDER[stage.id]
        const isCompleted = stageIdx < currentIdx
        const isCurrent = stage.id === currentStage
        const isViewing = stage.id === viewingStage
        const isReachable = stageIdx <= currentIdx

        return (
          <div key={stage.id} className="flex items-center gap-0.5">
            <button
              onClick={() => isReachable && onStageClick(stage.id)}
              disabled={!isReachable}
              className={[
                'flex items-center gap-1 rounded-sm px-2 py-1 text-[12px] font-medium transition-colors',
                isViewing
                  ? 'bg-[#eff6ff] text-[#2563eb]'
                  : isCompleted
                  ? 'text-[#16a34a] hover:bg-[#f0fdf4]'
                  : isCurrent
                  ? 'text-[#111827] hover:bg-[#f3f4f6]'
                  : 'cursor-default text-[#d1d5db]',
              ].join(' ')}
            >
              {/* Stage dot */}
              <span
                className={[
                  'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold',
                  isViewing
                    ? 'bg-[#2563eb] text-white'
                    : isCompleted
                    ? 'bg-[#16a34a] text-white'
                    : isCurrent
                    ? 'bg-[#111827] text-white'
                    : 'bg-[#e5e7eb] text-[#9ca3af]',
                ].join(' ')}
              >
                {isCompleted && !isViewing ? '✓' : stageIdx + 1}
              </span>
              <span>{stage.desc}</span>
            </button>

            {i < STAGES.length - 1 && (
              <ChevronRight size={12} className="text-[#d1d5db]" />
            )}
          </div>
        )
      })}
    </nav>
  )
}
