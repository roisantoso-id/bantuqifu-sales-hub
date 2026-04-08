'use client'

import { X, ClipboardList, Send, Paperclip, Clock, MessageSquare, Phone, Users, Mail, TrendingUp, Info, FileText } from 'lucide-react'
import { useState, useMemo, useEffect, useCallback, useRef, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { ImagePreviewDialog, isImagePreviewable } from '@/components/ui/image-preview-dialog'
import { getOpportunityTimelineAction } from '@/app/actions/opportunity'
import type { InteractionAttachmentRow, InteractionWithAttachmentsRow } from '@/app/actions/interaction'

interface AuditRailProps {
  opportunity?: { id: string }
  visible: boolean
  reloadToken?: number
  onToggle: (visible: boolean) => void
  onAddNote?: (remark: string, files: File[]) => Promise<void>
}

const INTERACTION_ICONS = {
  NOTE: MessageSquare,
  CALL: Phone,
  VISIT: Users,
  MEETING: Users,
  EMAIL: Mail,
  STAGE_CHANGE: TrendingUp,
  SYSTEM: Info,
}

const INTERACTION_LABELS = {
  NOTE: '备注',
  CALL: '电话',
  VISIT: '拜访',
  MEETING: '会议',
  EMAIL: '邮件',
  STAGE_CHANGE: '阶段变更',
  SYSTEM: '系统',
}

function formatDateTime(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleString('zh-CN', options)
}

function getOperatorLabel(interaction: InteractionWithAttachmentsRow) {
  return interaction.operatorName?.trim() || interaction.operatorEmail?.trim() || '系统'
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function renderAttachmentLabel(attachment: Pick<InteractionAttachmentRow, 'fileName' | 'fileSize'>) {
  return `${attachment.fileName} · ${formatFileSize(attachment.fileSize)}`
}

function SelectedFileRow({ file, onRemove }: { file: File; onRemove: (file: File) => void }) {
  return (
    <div className="flex items-center gap-1 text-[10px] text-[#4b5563]">
      <FileText className="h-3 w-3 shrink-0 text-[#6b7280]" />
      <span className="min-w-0 flex-1 truncate">{renderAttachmentLabel({ fileName: file.name, fileSize: file.size })}</span>
      <button
        type="button"
        onClick={() => onRemove(file)}
        className="text-[#9ca3af] hover:text-[#374151]"
        aria-label={`移除附件 ${file.name}`}
      >
        <X size={12} />
      </button>
    </div>
  )
}

export function AuditRail({ opportunity, visible, reloadToken = 0, onToggle, onAddNote }: AuditRailProps) {
  const [inputValue, setInputValue] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [interactions, setInteractions] = useState<InteractionWithAttachmentsRow[]>([])
  const [hasLeadHistory, setHasLeadHistory] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<InteractionAttachmentRow | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const loadTimeline = useCallback(async () => {
    if (!opportunity?.id) {
      setInteractions([])
      setHasLeadHistory(false)
      return
    }

    setIsLoading(true)
    try {
      const result = await getOpportunityTimelineAction(opportunity.id)
      if (result.success && result.data) {
        setInteractions(result.data.interactions)
        setHasLeadHistory(result.data.hasLeadHistory)
      } else {
        setInteractions([])
        setHasLeadHistory(false)
      }
    } catch (error) {
      console.error('[AuditRail] Failed to load timeline:', error)
      setInteractions([])
      setHasLeadHistory(false)
    } finally {
      setIsLoading(false)
    }
  }, [opportunity?.id])

  useEffect(() => {
    if (!visible) {
      return
    }

    void loadTimeline()
  }, [loadTimeline, reloadToken, visible])

  useEffect(() => {
    setInputValue('')
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [opportunity?.id])

  const handleFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? [])
    if (nextFiles.length === 0) {
      return
    }

    setSelectedFiles((prev) => {
      const fileMap = new Map(prev.map((file) => [`${file.name}-${file.size}-${file.lastModified}`, file]))
      nextFiles.forEach((file) => {
        fileMap.set(`${file.name}-${file.size}-${file.lastModified}`, file)
      })
      return Array.from(fileMap.values())
    })

    event.target.value = ''
  }, [])

  const handleRemoveSelectedFile = useCallback((target: File) => {
    setSelectedFiles((prev) => prev.filter((file) => file !== target))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || !opportunity?.id || !onAddNote) return

    setIsSubmitting(true)
    try {
      await onAddNote(inputValue, selectedFiles)
      setInputValue('')
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('[AuditRail] Failed to add note:', err)
      toast.error(err instanceof Error ? err.message : '保存备注失败')
    } finally {
      setIsSubmitting(false)
    }
  }, [inputValue, onAddNote, opportunity?.id, selectedFiles])

  const timelineContent = useMemo(() => {
    if (isLoading) {
      return <div className="mt-6 text-center text-[12px] text-[#9ca3af]">加载中...</div>
    }

    if (interactions.length === 0) {
      return <div className="mt-6 text-center text-[12px] text-[#9ca3af]">暂无跟进记录</div>
    }

    const orderedInteractions = [...interactions].reverse()

    return (
      <div className="space-y-2">
        {hasLeadHistory && (
          <div className="border-b border-blue-100 pb-2 text-[10px] leading-4 text-blue-700">
            <span className="font-medium">含线索历史</span>
            <span className="ml-1 text-blue-500">当前时间轴已合并线索阶段记录</span>
          </div>
        )}

        <ul className="space-y-0">
          {orderedInteractions.map((interaction, index) => {
            const Icon = INTERACTION_ICONS[interaction.type] || MessageSquare
            const isLast = index === orderedInteractions.length - 1
            const isFromLead = Boolean(interaction.leadId && !interaction.opportunityId)

            return (
              <li key={interaction.id} className="flex gap-2 py-1">
                <div className="flex flex-col items-center pt-0.5">
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      isFromLead ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="h-2.5 w-2.5" />
                  </div>
                  {!isLast && <div className="mt-0.5 w-px flex-1 bg-[#e5e7eb]" />}
                </div>

                <div className="min-w-0 flex-1 border-b border-[#f3f4f6] pb-2 text-[10px] leading-4 text-[#4b5563] last:border-b-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#6b7280]">
                    <span className="font-medium text-[#111827] truncate">{getOperatorLabel(interaction)}</span>
                    <span>·</span>
                    <span>{INTERACTION_LABELS[interaction.type]}</span>
                    {isFromLead ? <span className="text-blue-600">· 线索阶段</span> : null}
                    <span className="ml-auto shrink-0 text-[#9ca3af]">
                      {formatDateTime(interaction.createdAt, {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="mt-0.5 break-words text-[#111827]">{interaction.content}</div>

                  {interaction.attachments && interaction.attachments.length > 0 ? (
                    <div className="mt-1 flex flex-col gap-1">
                      {interaction.attachments.map((attachment) => {
                        const attachmentUrl = attachment.previewUrl ?? attachment.fileUrl
                        const isImageAttachment = isImagePreviewable({
                          url: attachmentUrl,
                          fileName: attachment.fileName,
                        })

                        return isImageAttachment ? (
                          <button
                            key={attachment.id}
                            type="button"
                            onClick={() => setPreviewAttachment(attachment)}
                            className="inline-flex min-w-0 items-center gap-1 rounded-sm border border-[#e5e7eb] px-1.5 py-1 text-[10px] text-[#2563eb] hover:bg-[#f8fafc]"
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate">{renderAttachmentLabel(attachment)}</span>
                          </button>
                        ) : (
                          <a
                            key={attachment.id}
                            href={attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-w-0 items-center gap-1 rounded-sm border border-[#e5e7eb] px-1.5 py-1 text-[10px] text-[#2563eb] hover:bg-[#f8fafc]"
                          >
                            <FileText className="h-3 w-3 shrink-0" />
                            <span className="truncate">{renderAttachmentLabel(attachment)}</span>
                          </a>
                        )
                      })}
                    </div>
                  ) : null}

                  {interaction.nextAction ? (
                    <div className="mt-0.5 text-[#6b7280]">
                      下次：{interaction.nextAction}
                      {interaction.nextActionDate ? (
                        <span className="ml-1 text-[#9ca3af]">
                          {formatDateTime(interaction.nextActionDate, {
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }, [hasLeadHistory, interactions, isLoading])

  if (!visible) return null

  return (
    <>
      <aside className="flex h-full w-64 shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <ClipboardList size={13} className="text-[#6b7280]" />
          <span className="text-[12px] font-semibold text-[#374151]">跟进记录</span>
          <span className="rounded-sm bg-[#f3f4f6] px-1 py-0.5 font-mono text-[10px] text-[#6b7280]">
            {interactions.length}
          </span>
        </div>
        <button
          onClick={() => onToggle(false)}
          aria-label="关闭跟进记录"
          className="flex h-5 w-5 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#374151]"
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">{timelineContent}</div>

      <div className="border-t border-[#e5e7eb]" />

      <div className="flex flex-col gap-2 p-2">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="添加备注..."
          disabled={isSubmitting || !opportunity?.id}
          className="h-16 w-full resize-none rounded-sm border border-[#e5e7eb] bg-white px-2 py-1.5 text-[12px] text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#2563eb] disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          disabled={isSubmitting || !opportunity?.id}
          className="hidden"
        />

        {selectedFiles.length > 0 ? (
          <div className="flex flex-col gap-1 rounded-sm border border-dashed border-[#d1d5db] bg-[#f9fafb] p-1.5">
            {selectedFiles.map((file) => (
              <SelectedFileRow
                key={`${file.name}-${file.size}-${file.lastModified}`}
                file={file}
                onRemove={handleRemoveSelectedFile}
              />
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting || !opportunity?.id}
            className="flex h-7 items-center gap-1 rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#4b5563] hover:bg-[#f9fafb] disabled:bg-[#f9fafb] disabled:text-[#9ca3af]"
            aria-label="选择附件"
            title="选择附件"
          >
            <Paperclip size={12} />
            附件
            {selectedFiles.length > 0 ? <span className="text-[10px] text-[#6b7280]">{selectedFiles.length}</span> : null}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !inputValue.trim() || !opportunity?.id}
            className="flex h-7 flex-1 items-center justify-center gap-1 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:text-[#9ca3af] transition-colors"
          >
            {isSubmitting ? <Clock size={12} className="animate-spin" /> : <Send size={12} />}
            {isSubmitting ? '提交中...' : '提交'}
          </button>
        </div>
      </div>
      </aside>
      <ImagePreviewDialog
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAttachment(null)
          }
        }}
        src={previewAttachment ? previewAttachment.previewUrl ?? previewAttachment.fileUrl : undefined}
        title={previewAttachment?.fileName || '图片预览'}
      />
    </>
  )
}
