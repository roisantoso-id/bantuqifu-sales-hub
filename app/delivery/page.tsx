import { getDeliveryProjectsAction, getCommissionStatsAction } from '@/app/actions/delivery'
import { FolderKanban, Clock, CheckCircle2, AlertTriangle, DollarSign } from 'lucide-react'

export default async function DeliveryDashboardPage() {
  const [projects, commissionStats] = await Promise.all([
    getDeliveryProjectsAction(),
    getCommissionStatsAction(),
  ])

  const stats = {
    total: projects.length,
    pending: projects.filter(p => p.status === 'PENDING').length,
    inProgress: projects.filter(p => p.status === 'IN_PROGRESS').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    suspended: projects.filter(p => p.status === 'SUSPENDED').length,
  }

  const statCards = [
    { label: '全部项目', value: stats.total, icon: <FolderKanban size={20} />, color: '#6b7280', bg: '#f3f4f6' },
    { label: '待启动', value: stats.pending, icon: <Clock size={20} />, color: '#d97706', bg: '#fef3c7' },
    { label: '进行中', value: stats.inProgress, icon: <AlertTriangle size={20} />, color: '#2563eb', bg: '#dbeafe' },
    { label: '已完成', value: stats.completed, icon: <CheckCircle2 size={20} />, color: '#16a34a', bg: '#dcfce7' },
  ]

  const commissionCards = [
    { label: '待审批提成', value: `¥${commissionStats.totalPending.toFixed(2)}`, count: `${commissionStats.countPending} 笔`, color: '#d97706', bg: '#fef3c7' },
    { label: '已审批提成', value: `¥${commissionStats.totalApproved.toFixed(2)}`, count: `${commissionStats.countApproved} 笔`, color: '#2563eb', bg: '#dbeafe' },
    { label: '已结算提成', value: `¥${commissionStats.totalSettled.toFixed(2)}`, count: `${commissionStats.countSettled} 笔`, color: '#16a34a', bg: '#dcfce7' },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[18px] font-semibold text-[#111827]">交付看板</h1>
        <p className="mt-1 text-[13px] text-[#6b7280]">
          交付中心概览，追踪项目进度与交付状况
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-[#e5e7eb] bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-[#6b7280]">{card.label}</p>
                <p className="mt-1 text-[24px] font-semibold text-[#111827]">
                  {card.value}
                </p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: card.bg, color: card.color }}
              >
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 提成概览 */}
      <div className="mb-8">
        <h2 className="mb-3 text-[14px] font-medium text-[#111827]">提成概览</h2>
        <div className="grid grid-cols-3 gap-4">
          {commissionCards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-[#e5e7eb] bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] text-[#6b7280]">{card.label}</p>
                  <p className="mt-1 text-[20px] font-semibold text-[#111827]">{card.value}</p>
                  <p className="text-[11px] text-[#9ca3af]">{card.count}</p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: card.bg, color: card.color }}
                >
                  <DollarSign size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 最近项目 */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white">
        <div className="border-b border-[#e5e7eb] px-4 py-3">
          <h2 className="text-[14px] font-medium text-[#111827]">最近项目</h2>
        </div>
        {projects.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[#9ca3af]">
            暂无交付项目。当商机赢单后将自动创建。
          </div>
        ) : (
          <div className="divide-y divide-[#e5e7eb]">
            {projects.slice(0, 5).map((project) => (
              <a
                key={project.id}
                href={`/delivery/projects/${project.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#f9fafb] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#111827] truncate">
                    {project.name}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#6b7280]">
                    {project.customer?.customerName} · {project.opportunity?.opportunityCode}
                  </p>
                </div>
                <StatusBadge status={project.status} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    PENDING: { label: '待启动', bg: '#fef3c7', text: '#92400e' },
    IN_PROGRESS: { label: '进行中', bg: '#dbeafe', text: '#1e40af' },
    COMPLETED: { label: '已完成', bg: '#dcfce7', text: '#14532d' },
    SUSPENDED: { label: '已暂停', bg: '#fee2e2', text: '#991b1b' },
  }
  const c = config[status] || config.PENDING
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  )
}
