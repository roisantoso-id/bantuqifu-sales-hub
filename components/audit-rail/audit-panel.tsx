'use client'

import { X, ClipboardList, Upload, FileText, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useRef, useMemo, useEffect } from 'react'
import type { ActionLog, ActionType, StageId } from '@/lib/types'

interface AuditRailProps {
  logs: ActionLog[]
  opportunity?: { id: string }
  visible: boolean
  onToggle: (visible: boolean) => void
  onAddNote?: (remark: string, files: File[]) => Promise<void>
}

const ACTION_META: Record<ActionType, { label: string; color: string; bg: string }> = {
  CREATE:       { label: '创建',   color: '#374151', bg: '#f3f4f6' },
  FORM:         { label: '表单',   color: '#1d4ed8', bg: '#eff6ff' },
  STAGE_CHANGE: { label: '推进',   color: '#065f46', bg: '#ecfdf5' },
  MATCH:        { label: '匹配',   color: '#92400e', bg: '#fffbeb' },
  QUOTE:        { label: '报价',   color: '#6d28d9', bg: '#f5f3ff' },
  NOTE:         { label: '备注',   color: '#374151', bg: '#f9fafb' },
}

const STAGE_BADGE: Record<StageId, { label: string; bg: string; color: string }> = {
  P1: { label: 'P1', bg: '#eff6ff', color: '#1d4ed8' },
  P2: { label: 'P2', bg: '#eff6ff', color: '#1d4ed8' },
  P3: { label: 'P3', bg: '#eff6ff', color: '#1d4ed8' },
  P4: { label: 'P4', bg: '#f0fdf4', color: '#065f46' },
  P5: { label: 'P5', bg: '#fff7ed', color: '#b45309' },
  P6: { label: 'P6', bg: '#f3e8ff', color: '#6d28d9' },
  P7: { label: 'P7', bg: '#fdf2f8', color: '#be185d' },
}

function formatTimestamp(iso: string) {
  const d = new Date(iso)
  // 使用 UTC 格式避免时区导致的 hydration 不匹配
  const date = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', timeZone: 'UTC' })
  // 固定格式：HH:MM
  const hours = String(d.getUTCHours()).padStart(2, '0')
  const minutes = String(d.getUTCMinutes()).padStart(2, '0')
  const time = `${hours}:${minutes}`
  return { date, time }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function countLines(text: string): number {
  return text.split('\n').length
}

export function AuditRail({ logs, opportunity, visible, onToggle, onAddNote }: AuditRailProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [inputValue, setInputValue] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 客户端挂载后才显示时间，避免 hydration 不匹配
  useEffect(() => {
    setMounted(true)
  }, [])

  const sorted = useMemo(
    () => [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [logs]
  )

  // 预格式化所有日志的时间戳，避免 hydration 不匹配
  const formattedLogs = useMemo(
    () => sorted.map(log => ({ ...log, formattedTime: formatTimestamp(log.timestamp) })),
    [sorted]
  )

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedFiles((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() && uploadedFiles.length === 0) return

    setIsSubmitting(true)
    try {
      if (onAddNote) {
        await onAddNote(inputValue, uploadedFiles)
      }
      setInputValue('')
      setUploadedFiles([])
    } catch (err) {
      console.error('[v0] Failed to add note:', err)
    } finally {
      setIsSubmitting(false)
    }
  }, [inputValue, uploadedFiles, onAddNote])

  // 如果不可见，在所有 hooks 之后返回 null
  if (!visible) return null

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
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
          onClick={() => onToggle(false)}
          aria-label="关闭操作记录"
          className="flex h-5 w-5 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151]"
        >
          <X size={12} />
        </button>
      </div>

      {/* Timeline entries */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {sorted.length === 0 ? (
          <div className="mt-6 text-center text-[12px] text-[#9ca3af]">暂无操作记录</div>
        ) : (
          <ul className="space-y-0">
            {formattedLogs.map((log, i) => {
              const meta = ACTION_META[log.actionType] ?? ACTION_META.NOTE
              const { date, time } = log.formattedTime
              const isLast = i === formattedLogs.length - 1
              const isExpanded = expandedIds.has(log.id)
              const remarkLines = log.remark ? countLines(log.remark) : 0
              const shouldShowCollapse = remarkLines > 3

              return (
                <li key={log.id} className="flex gap-2.5">
                  {/* Timeline spine */}
                  <div className="flex flex-col items-center pt-0.5">
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    {!isLast && <div className="mt-0.5 w-px flex-1 bg-[#e5e7eb]" />}
                  </div>

                  {/* Content */}
                  <div className="pb-2 flex-1 min-w-0">
                    {/* First line: Badge + Label + Time */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block rounded-sm px-1 py-0.5 text-[10px] font-semibold shrink-0"
                        style={{ color: meta.color, backgroundColor: meta.bg }}
                      >
                        {meta.label}
                      </span>
                      {log.stageId && (
                        <span
                          className="inline-block rounded-sm px-1 py-0.5 text-[10px] font-medium shrink-0"
                          style={{
                            color: STAGE_BADGE[log.stageId].color,
                            backgroundColor: STAGE_BADGE[log.stageId].bg,
                          }}
                        >
                          {log.stageId}
                        </span>
                      )}
                      <span className="text-[12px] font-medium text-[#111827] truncate">
                        {log.actionLabel}
                      </span>
                      <span className="font-mono text-[10px] text-[#9ca3af] shrink-0 ml-auto">
                        {mounted ? date : '--/--'}
                      </span>
                    </div>

                    {/* Operator + time */}
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                      <span className="text-[#6b7280] font-medium">{log.operatorName}</span>
                      <span className="text-[#d1d5db]">·</span>
                      <span className="font-mono text-[#9ca3af]">{mounted ? time : '--:--'}</span>
                    </div>

                    {/* Remark (with collapse/expand) */}
                    {log.remark && (
                      <div className="mt-1">
                        <p
                          className={`text-[11px] leading-relaxed text-[#6b7280] break-words ${
                            shouldShowCollapse && !isExpanded ? 'line-clamp-3' : ''
                          }`}
                        >
                          {log.remark}
                        </p>
                        {shouldShowCollapse && (
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="mt-1 flex items-center gap-0.5 text-[10px] text-[#2563eb] hover:underline"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={12} /> 收起
                              </>
                            ) : (
                              <>
                                <ChevronDown size={12} /> 展开
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Attachments */}
                    {log.attachments && log.attachments.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {log.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-0.5 rounded-sm bg-[#f3f4f6] px-1.5 py-0.5 text-[10px] text-[#374151] hover:bg-[#e5e7eb] transition-colors"
                            title={att.fileName}
                          >
                            <FileText size={11} />
                            <span className="truncate max-w-16">{att.fileName}</span>
                            <span className="text-[#9ca3af] text-[9px]">
                              ({formatFileSize(att.fileSize)})
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[#e5e7eb]" />

      {/* Input area */}
      <div className="flex flex-col gap-2 p-2">
        {/* Remark textarea */}
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="添加备注..."
          disabled={isSubmitting}
          className="h-16 w-full resize-none rounded-sm border border-[#e5e7eb] bg-white px-2 py-1.5 text-[12px] text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#2563eb] disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
        />

        {/* File preview */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-col gap-1">
            {uploadedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-sm bg-[#f3f4f6] px-1.5 py-1 text-[11px]"
              >
                <div className="flex items-center gap-1 min-w-0">
                  <FileText size={12} className="text-[#6b7280] shrink-0" />
                  <span className="truncate text-[#374151] font-medium">{file.name}</span>
                  <span className="text-[#9ca3af] text-[10px] shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="flex h-5 w-5 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#e5e7eb] hover:text-[#dc2626] transition-colors shrink-0"
                  aria-label="删除文件"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isSubmitting}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="flex h-7 items-center gap-1 rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#374151] hover:bg-[#f9fafb] disabled:bg-[#f9fafb] disabled:text-[#9ca3af] transition-colors"
            aria-label="上传文件"
          >
            <Upload size={12} />
            上传
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!inputValue.trim() && uploadedFiles.length === 0)}
            className="flex-1 h-7 rounded-sm bg-[#2563eb] text-white text-[12px] font-medium hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:text-[#9ca3af] transition-colors"
          >
            {isSubmitting ? '提交中...' : '提交'}
          </button>
        </div>
      </div>
    </aside>
  )
}
