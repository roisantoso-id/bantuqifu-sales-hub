'use client'

import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getFollowupTypeLabel } from '@/lib/lead-labels'
import type { LeadFollowUpRow } from '@/app/actions/lead'

interface LeadTimelineProps {
  followUps: LeadFollowUpRow[]
  isLoading?: boolean
}

const TYPE_COLORS: Record<string, string> = {
  general: 'bg-[#2563eb]',
  call: 'bg-[#16a34a]',
  visit: 'bg-[#9333ea]',
  meeting: 'bg-[#ea580c]',
  email: 'bg-[#0891b2]',
  wechat: 'bg-[#16a34a]',
  SYSTEM: 'bg-[#9ca3af]',
}

function getTypeColor(type: string) {
  return TYPE_COLORS[type] ?? 'bg-[#6b7280]'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function LeadTimeline({ followUps, isLoading }: LeadTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#e5e7eb] border-t-[#2563eb]" />
      </div>
    )
  }

  if (followUps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="mb-2 h-8 w-8 text-[#e5e7eb]" />
        <p className="text-[12px] text-[#9ca3af]">暂无跟进记录</p>
        <p className="mt-0.5 text-[11px] text-[#d1d5db]">在下方添加第一条跟进</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {followUps.map((item, index) => (
        <div key={item.id} className="relative flex gap-3 pb-4">
          {/* Vertical connector line */}
          {index !== followUps.length - 1 && (
            <div className="absolute left-[5px] top-5 h-full w-px bg-[#e5e7eb]" />
          )}

          {/* Timeline dot */}
          <div
            className={`relative mt-1.5 h-3 w-3 shrink-0 rounded-full ring-2 ring-white ${getTypeColor(item.followupType)}`}
          />

          {/* Content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="h-4 border-[#e5e7eb] px-1.5 text-[10px] font-normal text-[#374151]"
              >
                {getFollowupTypeLabel(item.followupType)}
              </Badge>
              <span className="text-[10px] text-[#9ca3af]">{formatDate(item.createdAt)}</span>
              {(item as any).operator && (
                <span className="text-[10px] text-[#6b7280]">
                  · {(item as any).operator.name || (item as any).operator.email}
                </span>
              )}
            </div>
            <p className="text-[12px] leading-relaxed text-[#374151]">{item.content}</p>
            {item.nextAction && (
              <div className="mt-1.5 rounded-sm border-l-2 border-[#bfdbfe] bg-[#eff6ff] pl-2 py-1">
                <p className="text-[11px] text-[#2563eb]">下一步: {item.nextAction}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
