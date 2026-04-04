'use client'

import { useState, useEffect } from 'react'
import { Search, Clock, User, Calendar } from 'lucide-react'
import { getMyTasksAction } from '@/app/actions/delivery'
import type { ServiceTaskRow } from '@/lib/types'

const STATUS_CONFIG = {
  TODO: { label: '待办', color: '#6b7280', bgColor: '#f3f4f6' },
  IN_PROGRESS: { label: '进行中', color: '#2563eb', bgColor: '#dbeafe' },
  PENDING_REVIEW: { label: '待验收', color: '#d97706', bgColor: '#fef3c7' },
  COMPLETED: { label: '已完成', color: '#16a34a', bgColor: '#dcfce7' },
}

export function MyTasksClient() {
  const [tasks, setTasks] = useState<ServiceTaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadTasks()
  }, [statusFilter])

  const loadTasks = async () => {
    setLoading(true)
    const data = await getMyTasksAction(
      statusFilter ? { status: statusFilter } : undefined
    )
    setTasks(data)
    setLoading(false)
  }

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.project?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statusCounts = {
    all: tasks.length,
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    PENDING_REVIEW: tasks.filter(t => t.status === 'PENDING_REVIEW').length,
    COMPLETED: tasks.filter(t => t.status === 'COMPLETED').length,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-[#111827]">我的工作台</h1>
        <p className="mt-1 text-[13px] text-[#6b7280]">查看和管理分配给您的交付任务</p>
      </div>

      {/* Filters */}
      <div className="border-b border-[#e5e7eb] bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Status tabs */}
          <div className="flex items-center gap-1">
            {[
              { key: '', label: '全部', count: statusCounts.all },
              { key: 'TODO', label: '待办', count: statusCounts.TODO },
              { key: 'IN_PROGRESS', label: '进行中', count: statusCounts.IN_PROGRESS },
              { key: 'PENDING_REVIEW', label: '待验收', count: statusCounts.PENDING_REVIEW },
              { key: 'COMPLETED', label: '已完成', count: statusCounts.COMPLETED },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  statusFilter === tab.key
                    ? 'bg-[#2563eb] text-white'
                    : 'text-[#6b7280] hover:bg-[#f3f4f6]'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48 rounded-md border border-[#e5e7eb] bg-[#f9fafb] pl-8 pr-3 text-[12px] outline-none focus:border-[#2563eb] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-auto bg-[#f9fafb] p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[13px] text-[#9ca3af]">加载中...</div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-[14px] font-medium text-[#6b7280]">暂无任务</div>
            <div className="mt-1 text-[12px] text-[#9ca3af]">
              {statusFilter ? '当前筛选条件下没有任务' : '您暂时没有被分配的任务'}
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredTasks.map(task => {
              const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.TODO
              return (
                <a
                  key={task.id}
                  href={`/delivery/tasks/${task.id}`}
                  className="group rounded-lg border border-[#e5e7eb] bg-white p-4 transition-all hover:border-[#2563eb] hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13px] font-medium text-[#111827] group-hover:text-[#2563eb] truncate">
                          {task.title}
                        </h3>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      {task.description && (
                        <p className="mt-1 text-[12px] text-[#6b7280] line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-3 text-[11px] text-[#9ca3af]">
                        <span className="flex items-center gap-1">
                          <User size={11} />
                          {task.project?.name || '未分配项目'}
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(task.dueDate).toLocaleDateString('zh-CN')}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          更新于 {new Date(task.updatedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>

                    {task.commissionBase && (
                      <div className="shrink-0 text-right">
                        <div className="text-[12px] font-medium text-[#16a34a]">
                          ¥{Number(task.commissionBase).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-[#9ca3af]">提成基数</div>
                      </div>
                    )}
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
