'use client'

import { useState } from 'react'
import { DollarSign, Clock, CheckCircle, Wallet } from 'lucide-react'
import {
  getCommissionRecordsAction,
  approveCommissionAction,
  settleCommissionAction,
} from '@/app/actions/delivery'

interface CommissionStats {
  totalPending: number
  totalApproved: number
  totalSettled: number
  countPending: number
  countApproved: number
  countSettled: number
}

interface CommissionRecord {
  id: string
  userId: string
  roleType: string
  sourceId: string
  sourceType: string
  amount: number
  status: string
  settlementDate: string | null
  createdAt: string
  user?: { id: string; name: string }
}

const STATUS_CONFIG = {
  PENDING: { label: '待审批', color: '#d97706', bgColor: '#fef3c7' },
  APPROVED: { label: '已审批', color: '#2563eb', bgColor: '#dbeafe' },
  SETTLED: { label: '已结算', color: '#16a34a', bgColor: '#dcfce7' },
}

const ROLE_LABEL: Record<string, string> = {
  SALES: '销售',
  PM: '项目经理',
  EXECUTOR: '执行人',
}

interface Props {
  initialRecords: CommissionRecord[]
  initialStats: CommissionStats
}

export function CommissionsClient({ initialRecords, initialStats }: Props) {
  const [records, setRecords] = useState(initialRecords)
  const [stats, setStats] = useState(initialStats)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const filteredRecords = statusFilter
    ? records.filter(r => r.status === statusFilter)
    : records

  const handleApprove = async (id: string) => {
    setLoading(id)
    const result = await approveCommissionAction(id)
    if (result.success) {
      const fresh = await getCommissionRecordsAction()
      const freshStats = await getCommissionStatsAction()
      setRecords(fresh)
      setStats(freshStats)
    }
    setLoading(null)
  }

  const handleSettle = async (id: string) => {
    setLoading(id)
    const result = await settleCommissionAction(id)
    if (result.success) {
      const fresh = await getCommissionRecordsAction()
      const freshStats = await getCommissionStatsAction()
      setRecords(fresh)
      setStats(freshStats)
    }
    setLoading(null)
  }

  const statCards = [
    { label: '待审批', value: `¥${stats.totalPending.toFixed(2)}`, count: `${stats.countPending} 笔`, icon: <Clock size={20} />, color: '#d97706', bg: '#fef3c7' },
    { label: '已审批', value: `¥${stats.totalApproved.toFixed(2)}`, count: `${stats.countApproved} 笔`, icon: <CheckCircle size={20} />, color: '#2563eb', bg: '#dbeafe' },
    { label: '已结算', value: `¥${stats.totalSettled.toFixed(2)}`, count: `${stats.countSettled} 笔`, icon: <Wallet size={20} />, color: '#16a34a', bg: '#dcfce7' },
    { label: '总计', value: `¥${(stats.totalPending + stats.totalApproved + stats.totalSettled).toFixed(2)}`, count: `${records.length} 笔`, icon: <DollarSign size={20} />, color: '#6b7280', bg: '#f3f4f6' },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-[#111827]">提成账单</h1>
        <p className="mt-1 text-[13px] text-[#6b7280]">查看和管理交付提成记录</p>
      </div>

      {/* Stats */}
      <div className="border-b border-[#e5e7eb] bg-white px-6 py-4">
        <div className="grid grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="rounded-lg border border-[#e5e7eb] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#6b7280]">{card.label}</p>
                  <p className="mt-0.5 text-[16px] font-semibold text-[#111827]">{card.value}</p>
                  <p className="text-[10px] text-[#9ca3af]">{card.count}</p>
                </div>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: card.bg, color: card.color }}
                >
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-[#e5e7eb] bg-white px-6 py-3">
        <div className="flex items-center gap-1">
          {[
            { key: '', label: '全部' },
            { key: 'PENDING', label: '待审批' },
            { key: 'APPROVED', label: '已审批' },
            { key: 'SETTLED', label: '已结算' },
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
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records table */}
      <div className="flex-1 overflow-auto bg-[#f9fafb] p-6">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-[14px] font-medium text-[#6b7280]">暂无提成记录</div>
            <div className="mt-1 text-[12px] text-[#9ca3af]">当任务完成后将自动生成提成记录</div>
          </div>
        ) : (
          <div className="rounded-lg border border-[#e5e7eb] bg-white overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#e5e7eb] bg-[#f9fafb]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[#6b7280]">人员</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[#6b7280]">角色</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[#6b7280]">来源</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium text-[#6b7280]">金额</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-medium text-[#6b7280]">状态</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium text-[#6b7280]">创建时间</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-medium text-[#6b7280]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {filteredRecords.map((record) => {
                  const statusConfig = STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                  return (
                    <tr key={record.id} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="px-4 py-3 text-[13px] text-[#111827]">
                        {record.user?.name || '未知'}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#6b7280]">
                        {ROLE_LABEL[record.roleType] || record.roleType}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#6b7280]">
                        {record.sourceType === 'TASK' ? '任务提成' : '商机提成'}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-medium text-[#111827]">
                        ¥{Number(record.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                        >
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[#9ca3af]">
                        {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {record.status === 'PENDING' && (
                          <button
                            onClick={() => handleApprove(record.id)}
                            disabled={loading === record.id}
                            className="rounded-md bg-[#2563eb] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
                          >
                            审批通过
                          </button>
                        )}
                        {record.status === 'APPROVED' && (
                          <button
                            onClick={() => handleSettle(record.id)}
                            disabled={loading === record.id}
                            className="rounded-md bg-[#16a34a] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-[#15803d] transition-colors disabled:opacity-50"
                          >
                            结算
                          </button>
                        )}
                        {record.status === 'SETTLED' && (
                          <span className="text-[11px] text-[#9ca3af]">
                            {record.settlementDate ? new Date(record.settlementDate).toLocaleDateString('zh-CN') : ''}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
