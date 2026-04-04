'use client'

import {
  ArrowRight,
  Paperclip,
  MessageSquare,
  Bell,
} from 'lucide-react'
import type { DeliveryRecordRow } from '@/lib/types'

const ACTION_CONFIG: Record<string, {
  icon: React.ReactNode
  label: string
  color: string
  bgColor: string
}> = {
  STATUS_CHANGE: {
    icon: <ArrowRight size={14} />,
    label: '状态变更',
    color: '#2563eb',
    bgColor: '#dbeafe',
  },
  UPLOAD_FILE: {
    icon: <Paperclip size={14} />,
    label: '上传凭证',
    color: '#7c3aed',
    bgColor: '#ede9fe',
  },
  COMMENT: {
    icon: <MessageSquare size={14} />,
    label: '评论',
    color: '#374151',
    bgColor: '#f3f4f6',
  },
  NUDGE: {
    icon: <Bell size={14} />,
    label: '催办',
    color: '#dc2626',
    bgColor: '#fee2e2',
  },
}

interface Props {
  records: DeliveryRecordRow[]
}

export function TaskTimeline({ records }: Props) {
  if (records.length === 0) {
    return (
      <div className="py-8 text-center text-[13px] text-[#9ca3af]">
        暂无动态记录
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[17px] top-0 bottom-0 w-px bg-[#e5e7eb]" />

      <div className="flex flex-col gap-0">
        {records.map((record) => {
          const config = ACTION_CONFIG[record.actionType] || ACTION_CONFIG.COMMENT
          return (
            <div key={record.id} className="relative flex gap-3 py-3 pl-0">
              {/* Icon dot */}
              <div
                className="relative z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-2 border-white"
                style={{ backgroundColor: config.bgColor, color: config.color }}
              >
                {config.icon}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#111827]">
                    {record.user?.name || '系统'}
                  </span>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ backgroundColor: config.bgColor, color: config.color }}
                  >
                    {config.label}
                  </span>
                  <span className="text-[11px] text-[#9ca3af]">
                    {formatTime(record.createdAt)}
                  </span>
                </div>

                {record.content && (
                  <p className="mt-1 text-[13px] text-[#374151] whitespace-pre-wrap">
                    {record.content}
                  </p>
                )}

                {record.attachmentUrl && (
                  <a
                    href={record.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[#f3f4f6] px-2 py-1 text-[12px] text-[#2563eb] hover:bg-[#e5e7eb] transition-colors"
                  >
                    <Paperclip size={12} />
                    查看附件
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin} 分钟前`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时前`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} 天前`

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
