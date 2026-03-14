'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StageId } from '@/lib/types'

interface BreadcrumbStepperProps {
  currentStage: StageId
}

const stages: { id: StageId; label: string }[] = [
  { id: 'P1', label: 'P1 需求' },
  { id: 'P2', label: 'P2 方案' },
  { id: 'P3', label: 'P3 报价' },
]

const stageOrder: Record<StageId, number> = {
  P1: 0,
  P2: 1,
  P3: 2,
}

export function BreadcrumbStepper({ currentStage }: BreadcrumbStepperProps) {
  const currentIndex = stageOrder[currentStage]

  return (
    <nav className="flex items-center gap-1 text-[12px]">
      {stages.map((stage, index) => {
        const isActive = index === currentIndex
        const isCompleted = index < currentIndex

        return (
          <div key={stage.id} className="flex items-center">
            <span
              className={cn(
                'rounded-sm px-2 py-1 font-medium transition-colors',
                isActive && 'bg-[#2563eb] text-white',
                isCompleted && 'text-[#2563eb]',
                !isActive && !isCompleted && 'text-[#9ca3af]'
              )}
            >
              {stage.label}
            </span>
            {index < stages.length - 1 && (
              <ChevronRight
                className={cn(
                  'mx-1 h-3 w-3',
                  index < currentIndex ? 'text-[#2563eb]' : 'text-[#d1d5db]'
                )}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
