'use client'

import { useState } from 'react'
import { Play, Eye, CheckCircle, RotateCcw } from 'lucide-react'
import {
  updateServiceTaskAction,
  createDeliveryRecordAction,
  nudgeTaskAction,
} from '@/app/actions/delivery'
import type { ServiceTaskStatus } from '@/lib/types'

/**
 * State machine:
 *   TODO → IN_PROGRESS        (Executor)
 *   IN_PROGRESS → PENDING_REVIEW (Executor, requires upload)
 *   PENDING_REVIEW → COMPLETED   (PM, triggers commission)
 *   PENDING_REVIEW → IN_PROGRESS (PM rejects)
 */

interface Props {
  taskId: string
  currentStatus: ServiceTaskStatus
  onStatusChange: (newStatus: ServiceTaskStatus) => void
}

const TRANSITIONS: Record<ServiceTaskStatus, {
  label: string
  next: ServiceTaskStatus
  icon: React.ReactNode
  color: string
  bgColor: string
}[]> = {
  TODO: [
    { label: '开始执行', next: 'IN_PROGRESS', icon: <Play size={14} />, color: '#ffffff', bgColor: '#2563eb' },
  ],
  IN_PROGRESS: [
    { label: '提交验收', next: 'PENDING_REVIEW', icon: <Eye size={14} />, color: '#ffffff', bgColor: '#d97706' },
  ],
  PENDING_REVIEW: [
    { label: '验收通过', next: 'COMPLETED', icon: <CheckCircle size={14} />, color: '#ffffff', bgColor: '#16a34a' },
    { label: '退回修改', next: 'IN_PROGRESS', icon: <RotateCcw size={14} />, color: '#374151', bgColor: '#f3f4f6' },
  ],
  COMPLETED: [],
}

const STATUS_LABEL: Record<ServiceTaskStatus, string> = {
  TODO: '待办',
  IN_PROGRESS: '进行中',
  PENDING_REVIEW: '待验收',
  COMPLETED: '已完成',
}

export function TaskStatusFlow({ taskId, currentStatus, onStatusChange }: Props) {
  const [loading, setLoading] = useState(false)
  const transitions = TRANSITIONS[currentStatus] || []

  const handleTransition = async (next: ServiceTaskStatus) => {
    setLoading(true)
    const result = await updateServiceTaskAction(taskId, { status: next })
    if (result.success) {
      // 记录状态变更
      await createDeliveryRecordAction({
        taskId,
        actionType: 'STATUS_CHANGE',
        content: `状态从「${STATUS_LABEL[currentStatus]}」变更为「${STATUS_LABEL[next]}」`,
      })
      onStatusChange(next)
    }
    setLoading(false)
  }

  const handleNudge = async () => {
    setLoading(true)
    await nudgeTaskAction(taskId)
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {transitions.map((t) => (
        <button
          key={t.next}
          onClick={() => handleTransition(t.next)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50"
          style={{ backgroundColor: t.bgColor, color: t.color }}
        >
          {t.icon}
          {t.label}
        </button>
      ))}

      {/* PM 催办按钮 — 仅在非完成状态显示 */}
      {currentStatus !== 'COMPLETED' && currentStatus !== 'TODO' && (
        <button
          onClick={handleNudge}
          disabled={loading}
          className="flex items-center gap-1 rounded-md border border-[#fca5a5] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#dc2626] hover:bg-[#fee2e2] transition-colors disabled:opacity-50"
        >
          催办
        </button>
      )}
    </div>
  )
}
