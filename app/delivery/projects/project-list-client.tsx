'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Plus } from 'lucide-react'
import { useState } from 'react'
import type { DeliveryProjectRow } from '@/lib/types'

const STATUS_TABS = [
  { id: 'ALL', label: '全部' },
  { id: 'PENDING', label: '待启动' },
  { id: 'IN_PROGRESS', label: '进行中' },
  { id: 'COMPLETED', label: '已完成' },
  { id: 'SUSPENDED', label: '已暂停' },
]

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  PENDING: { label: '待启动', bg: '#fef3c7', text: '#92400e' },
  IN_PROGRESS: { label: '进行中', bg: '#dbeafe', text: '#1e40af' },
  COMPLETED: { label: '已完成', bg: '#dcfce7', text: '#14532d' },
  SUSPENDED: { label: '已暂停', bg: '#fee2e2', text: '#991b1b' },
}

interface Props {
  initialProjects: DeliveryProjectRow[]
  initialStatus: string
}

export function DeliveryProjectListClient({ initialProjects, initialStatus }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')

  const activeStatus = searchParams.get('status') || initialStatus

  const handleStatusChange = (status: string) => {
    if (status === 'ALL') {
      router.push('/delivery/projects')
    } else {
      router.push(`/delivery/projects?status=${status}`)
    }
  }

  const filtered = initialProjects.filter((p) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.customer?.customerName?.toLowerCase().includes(q) ||
      p.opportunity?.opportunityCode?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-[#111827]">项目大厅</h1>
          <p className="mt-0.5 text-[13px] text-[#6b7280]">
            管理所有交付项目，分配 PM 并追踪进度
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-md bg-[#2563eb] px-3 py-1.5 text-[13px] font-medium text-white hover:bg-[#1d4ed8] transition-colors">
          <Plus size={14} />
          新建项目
        </button>
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex items-center gap-1">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleStatusChange(tab.id)}
              className={[
                'rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                isActive
                  ? 'bg-[#111827] text-white'
                  : 'bg-[#f3f4f6] text-[#6b7280] hover:text-[#111827]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
        <input
          type="text"
          placeholder="搜索项目名称、客户、商机编号..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full max-w-sm rounded-md border border-[#e5e7eb] bg-white pl-9 pr-3 text-[13px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
              <th className="px-4 py-2.5 text-left text-[12px] font-medium text-[#6b7280]">项目名称</th>
              <th className="px-4 py-2.5 text-left text-[12px] font-medium text-[#6b7280]">客户</th>
              <th className="px-4 py-2.5 text-left text-[12px] font-medium text-[#6b7280]">商机编号</th>
              <th className="px-4 py-2.5 text-left text-[12px] font-medium text-[#6b7280]">PM</th>
              <th className="px-4 py-2.5 text-left text-[12px] font-medium text-[#6b7280]">状态</th>
              <th className="px-4 py-2.5 text-left text-[12px] font-medium text-[#6b7280]">截止日期</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[13px] text-[#9ca3af]">
                  暂无匹配的交付项目
                </td>
              </tr>
            ) : (
              filtered.map((project) => {
                const badge = STATUS_BADGE[project.status] || STATUS_BADGE.PENDING
                return (
                  <tr
                    key={project.id}
                    onClick={() => router.push(`/delivery/projects/${project.id}`)}
                    className="cursor-pointer hover:bg-[#f9fafb] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium text-[#111827]">{project.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-[#374151]">{project.customer?.customerName || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[12px] text-[#6b7280]">{project.opportunity?.opportunityCode || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-[#374151]">{project.pm?.name || '未分配'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: badge.bg, color: badge.text }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] text-[#6b7280]">
                        {project.deadline
                          ? new Date(project.deadline).toLocaleDateString('zh-CN')
                          : '-'}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}