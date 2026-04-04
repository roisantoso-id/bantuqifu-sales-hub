'use client'

import { useState } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { createDeliveryRecordAction } from '@/app/actions/delivery'

interface Props {
  taskId: string
  onRecordAdded: () => void
}

export function DeliveryRecordForm({ taskId, onRecordAdded }: Props) {
  const [content, setContent] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [showAttachment, setShowAttachment] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() && !attachmentUrl.trim()) return
    setSubmitting(true)

    const actionType = attachmentUrl.trim() ? 'UPLOAD_FILE' : 'COMMENT'

    const result = await createDeliveryRecordAction({
      taskId,
      actionType,
      content: content.trim() || undefined,
      attachmentUrl: attachmentUrl.trim() || undefined,
    })

    if (result.success) {
      setContent('')
      setAttachmentUrl('')
      setShowAttachment(false)
      onRecordAdded()
    }
    setSubmitting(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
    }
  }

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="添加评论或交付说明... (Ctrl+Enter 发送)"
        rows={3}
        className="w-full resize-none rounded-t-lg border-none px-3 py-2.5 text-[13px] text-[#111827] placeholder-[#9ca3af] outline-none"
      />

      {showAttachment && (
        <div className="border-t border-[#e5e7eb] px-3 py-2">
          <input
            type="text"
            placeholder="附件链接 URL"
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            className="h-8 w-full rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 text-[12px] outline-none focus:border-[#2563eb]"
          />
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[#e5e7eb] px-3 py-2">
        <button
          onClick={() => setShowAttachment(!showAttachment)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
        >
          <Paperclip size={13} />
          附件
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || (!content.trim() && !attachmentUrl.trim())}
          className="flex items-center gap-1 rounded-md bg-[#2563eb] px-3 py-1 text-[12px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
        >
          <Send size={12} />
          {submitting ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  )
}
