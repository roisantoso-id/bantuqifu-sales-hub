'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { createServiceTaskAction } from '@/app/actions/delivery'
import type { DeliveryProjectRow, ServiceTaskRow } from '@/lib/types'

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: '待启动', bg: '#fef3c7', text: '#92400e' },
  IN_PROGRESS: { label: '进行中', bg: '#dbeafe', text: '#1e40af' },
  COMPLETED: { label: '已完成', bg: '#dcfce7', text: '#14532d' },
  SUSPENDED: { label: '已暂停', bg: '#fee2e2', text: '#991b1b' },
}

const TASK_STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  TODO: { label: '待办', bg: '#f3f4f6', text: '#374151' },
  IN_PROGRESS: { label: '进行中', bg: '#dbeafe', text: '#1e40af' },
  PENDING_REVIEW: { label: '待验收', bg: '#fef3c7', text: '#92400e' },
  COMPLETED: { label: '已完成', bg: '#dcfce7', text: '#14532d' },
}

interface Props {
  project: DeliveryProjectRow
  initialTasks: ServiceTaskRow[]
}

export function ProjectDetailClient({ project, initialTasks }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '' })
  const [submitting, setSubmitting] = useState(false)

  const projectBadge = STATUS_BADGE[project.status] || STATUS_BADGE.PENDING

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
  }

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return
    setSubmitting(true)
    const result = await createServiceTaskAction({
      projectId: project.id,
      title: newTask.title,
      description: newTask.description || undefined,
      dueDate: newTask.dueDate || undefined,
    })
    if (result.success && result.data) {
      setTasks(prev => [...prev, result.data!])
      setNewTask({ title: '', description: '', dueDate: '' })
      setShowAddTask(false)
    }
    setSubmitting(false)
  }

  return (
    <div className="p-6">
      {/* Back + Header */}
      <button
        onClick={() => router.push('/delivery/projects')}
        className="mb-4 flex items-center gap-1 text-[13px] text-[#6b7280] hover:text-[#111827] transition-colors"
      >
        <ArrowLeft size={14} />
        返回项目列表
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-semibold text-[#111827]">{project.name}</h1>
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: projectBadge.bg, color: projectBadge.text }}
            >
              {projectBadge.label}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-[12px] text-[#6b7280]">
            <span className="flex items-center gap-1">
              <User size={12} />
              客户: {project.customer?.customerName || '-'}
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle size={12} />
              商机: {project.opportunity?.opportunityCode || '-'}
            </span>
            <span className="flex items-center gap-1">
              <User size={12} />
              PM: {project.pm?.name || '未分配'}
            </span>
            {project.deadline && (
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                截止: {new Date(project.deadline).toLocaleDateString('zh-CN')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {taskStats.total > 0 && (
        <div className="mb-6 rounded-lg border border-[#e5e7eb] bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-[12px]">
            <span className="text-[#6b7280]">任务完成进度</span>
            <span className="font-medium text-[#111827]">
              {taskStats.completed}/{taskStats.total}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#f3f4f6]">
            <div
              className="h-2 rounded-full bg-[#2563eb] transition-all"
              style={{ width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
          <h2 className="text-[14px] font-medium text-[#111827]">
            任务列表 ({tasks.length})
          </h2>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-1 rounded-md bg-[#2563eb] px-2.5 py-1 text-[12px] font-medium text-white hover:bg-[#1d4ed8] transition-colors"
          >
            <Plus size={12} />
            添加任务
          </button>
        </div>

        {/* Add task form */}
        {showAddTask && (
          <div className="border-b border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="任务标题"
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                className="h-8 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-[13px] outline-none focus:border-[#2563eb]"
              />
              <input
                type="text"
                placeholder="任务描述（选填）"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                className="h-8 w-full rounded-md border border-[#e5e7eb] bg-white px-3 text-[13px] outline-none focus:border-[#2563eb]"
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="h-8 rounded-md border border-[#e5e7eb] bg-white px-3 text-[12px] outline-none focus:border-[#2563eb]"
                />
                <div className="flex-1" />
                <button
                  onClick={() => setShowAddTask(false)}
                  className="rounded-md px-3 py-1 text-[12px] text-[#6b7280] hover:bg-[#f3f4f6]"
                >
                  取消
                </button>
                <button
                  onClick={handleAddTask}
                  disabled={submitting || !newTask.title.trim()}
                  className="rounded-md bg-[#2563eb] px-3 py-1 text-[12px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                >
                  {submitting ? '创建中...' : '创建'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task rows */}
        {tasks.length === 0 && !showAddTask ? (
          <div className="py-12 text-center text-[13px] text-[#9ca3af]">
            暂无任务，点击"添加任务"开始拆解交付项
          </div>
        ) : (
          <div className="divide-y divide-[#e5e7eb]">
            {tasks.map((task) => {
              const badge = TASK_STATUS_BADGE[task.status] || TASK_STATUS_BADGE.TODO
              return (
                <div
                  key={task.id}
                  onClick={() => router.push(`/delivery/tasks/${task.id}`)}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#f9fafb] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {task.status === 'COMPLETED' ? (
                        <CheckCircle2 size={14} className="shrink-0 text-[#16a34a]" />
                      ) : (
                        <Clock size={14} className="shrink-0 text-[#9ca3af]" />
                      )}
                      <span className="text-[13px] font-medium text-[#111827] truncate">
                        {task.title}
                      </span>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {task.description && (
                      <p className="mt-0.5 ml-[22px] text-[12px] text-[#6b7280] truncate">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {task.executor && (
                      <span className="text-[11px] text-[#6b7280]">{task.executor.name}</span>
                    )}
                    {task.dueDate && (
                      <span className="text-[11px] text-[#9ca3af]">
                        {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                      </span>
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