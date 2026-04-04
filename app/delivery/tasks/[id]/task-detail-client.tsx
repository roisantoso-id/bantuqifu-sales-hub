'use client'

import { useState } from 'react'
import { ArrowLeft, User, Calendar, Clock, DollarSign, FolderOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { TaskStatusFlow } from '@/components/delivery/task-status-flow'
import { TaskTimeline } from '@/components/delivery/task-timeline'
import { DeliveryRecordForm } from '@/components/delivery/delivery-record-form'
import type { ServiceTaskRow, DeliveryRecordRow, ServiceTaskStatus } from '@/lib/types'

const STATUS_CONFIG = {
  TODO: { label: '待办', color: '#6b7280', bgColor: '#f3f4f6' },
  IN_PROGRESS: { label: '进行中', color: '#2563eb', bgColor: '#dbeafe' },
  PENDING_REVIEW: { label: '待验收', color: '#d97706', bgColor: '#fef3c7' },
  COMPLETED: { label: '已完成', color: '#16a34a', bgColor: '#dcfce7' },
}

interface Props {
  task: ServiceTaskRow
  records: DeliveryRecordRow[]
}

export function TaskDetailClient({ task: initialTask, records: initialRecords }: Props) {
  const router = useRouter()
  const [task, setTask] = useState(initialTask)
  const [records, setRecords] = useState(initialRecords)

  const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.TODO

  const handleStatusChange = (newStatus: ServiceTaskStatus) => {
    setTask(prev => ({ ...prev, status: newStatus }))
  }

  const handleRecordAdded = () => {
    // Reload records - in production you'd fetch fresh data
    window.location.reload()
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] bg-white px-6 py-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[12px] text-[#6b7280] hover:text-[#111827] transition-colors mb-2"
        >
          <ArrowLeft size={14} />
          返回
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-[#111827]">{task.title}</h1>
            <div className="mt-1 flex items-center gap-3 text-[12px] text-[#6b7280]">
              <span className="flex items-center gap-1">
                <FolderOpen size={12} />
                {task.project?.name || '未分配项目'}
              </span>
              {task.project?.customer && (
                <span>客户: {task.project.customer.customerName}</span>
              )}
              {task.project?.opportunity && (
                <span>商机: {task.project.opportunity.opportunityCode}</span>
              )}
            </div>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
          >
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Main content - 2 column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Task info + Status flow */}
        <div className="w-[360px] shrink-0 border-r border-[#e5e7eb] bg-white overflow-auto">
          {/* Task info */}
          <div className="border-b border-[#e5e7eb] p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-[#111827]">任务信息</h2>

            <div className="space-y-3">
              {task.description && (
                <div>
                  <div className="text-[11px] font-medium text-[#9ca3af] mb-1">描述</div>
                  <p className="text-[13px] text-[#374151] whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {task.executor && (
                  <div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#9ca3af] mb-1">
                      <User size={11} />
                      执行人
                    </div>
                    <div className="text-[13px] text-[#111827]">{task.executor.name}</div>
                  </div>
                )}

                {task.dueDate && (
                  <div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#9ca3af] mb-1">
                      <Calendar size={11} />
                      截止日期
                    </div>
                    <div className="text-[13px] text-[#111827]">
                      {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-[#9ca3af] mb-1">
                    <Clock size={11} />
                    创建时间
                  </div>
                  <div className="text-[13px] text-[#111827]">
                    {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </div>

                {task.commissionBase && (
                  <div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#9ca3af] mb-1">
                      <DollarSign size={11} />
                      提成基数
                    </div>
                    <div className="text-[13px] font-medium text-[#16a34a]">
                      ¥{Number(task.commissionBase).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status flow */}
          <div className="p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-[#111827]">状态操作</h2>
            <TaskStatusFlow
              taskId={task.id}
              currentStatus={task.status as ServiceTaskStatus}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>

        {/* Right panel - Timeline + Record form */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#f9fafb]">
          {/* Record form */}
          <div className="border-b border-[#e5e7eb] bg-white p-4">
            <DeliveryRecordForm
              taskId={task.id}
              onRecordAdded={handleRecordAdded}
            />
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-auto p-4">
            <h2 className="mb-3 text-[13px] font-semibold text-[#111827]">动态记录</h2>
            <TaskTimeline records={records} />
          </div>
        </div>
      </div>
    </div>
  )
}
