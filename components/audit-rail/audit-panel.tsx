'use client'

import { X, ClipboardList } from 'lucide-react'
import type { ActionLog, ActionType } from '@/lib/types'

interface AuditRailProps {
  logs: ActionLog[]
  onClose: () => void
}

const ACTION_META: Record<ActionType, { label: string; color: string; bg: string }> = {
  CREATE:       { label: '创建',   color: '#374151', bg: '#f3f4f6' },
  FORM:         { label: '表单',   color: '#1d4ed8', bg: '#eff6ff' },
  STAGE_CHANGE: { label: '推进',   color: '#065f46', bg: '#ecfdf5' },
  MATCH:        { label: '匹配',   color: '#92400e', bg: '#fffbeb' },
  QUOTE:        { label: '报价',   color: '#6d28d9', bg: '#f5f3ff' },
  NOTE:         { label: '备注',   color: '#374151', bg: '#f9fafb' },
}

function formatTimestamp(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return { date, time }
}

export function AuditRail({ logs, onClose }: AuditRailProps) {
  // Sort newest first
  const sorted = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <aside className="flex h-full w-[256px] shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <ClipboardList size={13} className="text-[#6b7280]" />
          <span className="text-[12px] font-semibold text-[#374151]">操作记录</span>
          <span className="rounded-sm bg-[#f3f4f6] px-1 py-0.5 font-mono text-[10px] text-[#6b7280]">
            {logs.length}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="关闭操作记录"
          className="flex h-5 w-5 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151]"
        >
          <X size={12} />
        </button>
      </div>

      {/* Log entries */}
      <ul className="flex-1 overflow-y-auto px-3 py-2">
        {sorted.length === 0 && (
          <li className="mt-6 text-center text-[12px] text-[#9ca3af]">暂无操作记录</li>
        )}

        {sorted.map((log, i) => {
          const meta = ACTION_META[log.actionType] ?? ACTION_META.NOTE
          const { date, time } = formatTimestamp(log.timestamp)
          const isLast = i === sorted.length - 1

          return (
            <li key={log.id} className="flex gap-2.5">
              {/* Timeline spine */}
              <div className="flex flex-col items-center">
                <div
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {!isLast && <div className="mt-0.5 w-px flex-1 bg-[#e5e7eb]" />}
              </div>

              {/* Content */}
              <div className={['pb-3', isLast ? '' : ''].join(' ')}>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="rounded-sm px-1 py-0.5 text-[10px] font-semibold"
                    style={{ color: meta.color, backgroundColor: meta.bg }}
                  >
                    {meta.label}
                  </span>
                  <span className="text-[12px] font-medium text-[#111827]">{log.actionLabel}</span>
                </div>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-[11px] text-[#9ca3af]">{log.operatorName}</span>
                  <span className="text-[10px] text-[#d1d5db]">·</span>
                  <span className="font-mono text-[10px] text-[#9ca3af]">
                    {date} {time}
                  </span>
                </div>

                {log.remark && (
                  <p className="mt-0.5 text-[11px] leading-relaxed text-[#6b7280]">
                    {log.remark}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
