'use client'

import { FileText, Package, ArrowRight, MessageSquare, FileCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActionLog } from '@/lib/types'

const actionIcons: Record<ActionLog['actionType'], React.ElementType> = {
  FORM: FileText,
  MATCH: Package,
  STAGE_CHANGE: ArrowRight,
  NOTE: MessageSquare,
  QUOTE: FileCheck,
}

const actionColors: Record<ActionLog['actionType'], string> = {
  FORM: 'text-blue-500 bg-blue-50',
  MATCH: 'text-purple-500 bg-purple-50',
  STAGE_CHANGE: 'text-emerald-500 bg-emerald-50',
  NOTE: 'text-amber-500 bg-amber-50',
  QUOTE: 'text-cyan-500 bg-cyan-50',
}

interface ActionTimelineProps {
  logs: ActionLog[]
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

export function ActionTimeline({ logs }: ActionTimelineProps) {
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div className="flex h-full w-[280px] flex-col border-l border-[#e5e7eb] bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-3 py-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
          操作记录
        </h3>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {sortedLogs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[12px] text-[#9ca3af]">
            暂无操作记录
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute bottom-0 left-[11px] top-0 w-px bg-[#e5e7eb]" />

            {sortedLogs.map((log, index) => {
              const Icon = actionIcons[log.actionType]
              return (
                <div key={log.id} className="relative mb-3 flex gap-2">
                  {/* Icon */}
                  <div
                    className={cn(
                      'relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
                      actionColors[log.actionType]
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] font-medium text-[#111827]">
                        {log.actionLabel}
                      </span>
                      <span className="flex-shrink-0 text-[10px] text-[#9ca3af]">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6b7280]">{log.operatorName}</div>
                    {log.remark && (
                      <div className="mt-0.5 text-[11px] leading-relaxed text-[#6b7280]">
                        {log.remark}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
