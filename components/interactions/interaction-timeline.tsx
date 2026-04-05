'use client'

import {
  Clock3,
  FileText,
  Info,
  Mail,
  MessageSquare,
  Phone,
  TrendingUp,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { InteractionAttachmentRow, InteractionRow } from '@/app/actions/interaction'

export interface InteractionTimelineItem extends InteractionRow {
  attachments?: InteractionAttachmentRow[]
}

interface InteractionTimelineProps {
  items: InteractionTimelineItem[]
  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
  onRetry?: () => void
}

const INTERACTION_META: Record<
  InteractionRow['type'],
  {
    label: string
    icon: typeof MessageSquare
    badgeClassName: string
    iconClassName: string
  }
> = {
  NOTE: {
    label: '备注',
    icon: MessageSquare,
    badgeClassName: 'border-slate-200 text-slate-600',
    iconClassName: 'bg-slate-100 text-slate-600',
  },
  CALL: {
    label: '电话',
    icon: Phone,
    badgeClassName: 'border-emerald-200 text-emerald-700',
    iconClassName: 'bg-emerald-100 text-emerald-700',
  },
  VISIT: {
    label: '拜访',
    icon: Users,
    badgeClassName: 'border-amber-200 text-amber-700',
    iconClassName: 'bg-amber-100 text-amber-700',
  },
  MEETING: {
    label: '会议',
    icon: Users,
    badgeClassName: 'border-violet-200 text-violet-700',
    iconClassName: 'bg-violet-100 text-violet-700',
  },
  EMAIL: {
    label: '邮件',
    icon: Mail,
    badgeClassName: 'border-sky-200 text-sky-700',
    iconClassName: 'bg-sky-100 text-sky-700',
  },
  STAGE_CHANGE: {
    label: '阶段变更',
    icon: TrendingUp,
    badgeClassName: 'border-fuchsia-200 text-fuchsia-700',
    iconClassName: 'bg-fuchsia-100 text-fuchsia-700',
  },
  SYSTEM: {
    label: '系统',
    icon: Info,
    badgeClassName: 'border-indigo-200 text-indigo-700',
    iconClassName: 'bg-indigo-100 text-indigo-700',
  },
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function getOperatorLabel(item: InteractionTimelineItem) {
  if (item.type === 'SYSTEM') {
    return '系统'
  }

  return item.operatorId || '未指定操作人'
}

export function InteractionTimeline({
  items,
  isLoading = false,
  error,
  emptyMessage = '暂无互动记录',
  onRetry,
}: InteractionTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 text-xs text-slate-500">
        加载中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50/60 px-4 text-center">
        <div className="text-xs text-red-600">{error}</div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-medium text-red-700 hover:underline"
          >
            重试
          </button>
        )}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/70 text-slate-400">
        <Clock3 className="h-6 w-6" />
        <div className="text-xs">{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const meta = INTERACTION_META[item.type]
        const Icon = meta.icon
        const isLeadHistory = Boolean(item.leadId && !item.opportunityId)
        const isLast = index === items.length - 1

        return (
          <div key={item.id} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn('z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white shadow-sm', isLeadHistory ? 'bg-blue-100 text-blue-700' : meta.iconClassName)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              {!isLast && <div className="mt-1 h-full w-px bg-slate-200" />}
            </div>

            <div className="min-w-0 flex-1 pb-4">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={cn('text-[10px]', meta.badgeClassName)}>
                      {meta.label}
                    </Badge>
                    {isLeadHistory && (
                      <Badge variant="secondary" className="bg-blue-100 text-[10px] text-blue-700">
                        线索阶段
                      </Badge>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-400">{formatDateTime(item.createdAt)}</span>
                </div>

                <div className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-600">{getOperatorLabel(item)}</span>
                </div>

                <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">{item.content}</p>

                {(item.nextAction || item.nextActionDate) && (
                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                    {item.nextAction && (
                      <div>
                        <span className="font-medium text-slate-700">下一步：</span>
                        {item.nextAction}
                      </div>
                    )}
                    {item.nextActionDate && (
                      <div className="mt-1">
                        <span className="font-medium text-slate-700">跟进时间：</span>
                        {formatDate(item.nextActionDate)}
                      </div>
                    )}
                  </div>
                )}

                {item.attachments && item.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 transition-colors hover:bg-slate-100"
                        title={attachment.fileName}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="max-w-[180px] truncate">{attachment.fileName}</span>
                        <span className="shrink-0 text-[10px] text-slate-400">{formatFileSize(attachment.fileSize)}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
