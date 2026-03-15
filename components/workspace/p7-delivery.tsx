'use client'

import { useState, useMemo } from 'react'
import {
  CheckCircle2,
  Circle,
  Clock,
  Download,
  Upload,
  User,
  Zap,
  Scale,
  ChevronRight,
  FileText,
  Package,
} from 'lucide-react'
import type { Opportunity, Product, OpportunityP7Data, ProgressPoint, AssignmentLogic } from '@/lib/types'

interface P7DeliveryProps {
  opportunity: Opportunity
  allProducts: Product[]
  p7Data?: OpportunityP7Data
  onDataChange: (data: OpportunityP7Data) => void
  onCompleteDelivery: () => void
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Circle size={14} className="text-[#9ca3af]" />,
  in_progress: <Clock size={14} className="text-[#f59e0b] animate-pulse" />,
  completed: <CheckCircle2 size={14} className="text-[#10b981]" />,
}

const STATUS_LABEL: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
}

const MOCK_MANAGERS = [
  { id: 'mgr-001', name: '王经理', avatar: '', managedCount: 12, capacity: 20, expertise: ['签证', '移民'] },
  { id: 'mgr-002', name: '李经理', avatar: '', managedCount: 8, capacity: 15, expertise: ['公司注册', '税务'] },
  { id: 'mgr-003', name: '张经理', avatar: '', managedCount: 15, capacity: 25, expertise: ['资质', '许可证'] },
]

export function P7Delivery({
  opportunity,
  allProducts,
  p7Data,
  onDataChange,
  onCompleteDelivery,
}: P7DeliveryProps) {
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)

  // Generate progress points from P2 selected products
  const generatedProgressPoints = useMemo(() => {
    if (p7Data?.progressPoints && p7Data.progressPoints.length > 0) {
      return p7Data.progressPoints
    }

    const p2Data = opportunity.p2Data || []
    const points: ProgressPoint[] = []

    p2Data.forEach((p2Item, idx) => {
      const product = allProducts.find((p) => p.id === p2Item.productId)
      if (product) {
        points.push({
          id: `pp-${idx + 1}`,
          label: `${product.name} - 提交申请`,
          status: idx === 0 ? 'in_progress' : 'pending',
          serviceId: p2Item.productId,
        })
        points.push({
          id: `pp-${idx + 1}-review`,
          label: `${product.name} - 审核处理`,
          status: 'pending',
          serviceId: p2Item.productId,
        })
        points.push({
          id: `pp-${idx + 1}-complete`,
          label: `${product.name} - 完成交付`,
          status: 'pending',
          serviceId: p2Item.productId,
        })
      }
    })

    return points
  }, [opportunity.p2Data, allProducts, p7Data?.progressPoints])

  // Generate assignment logic based on products
  const assignmentLogic = useMemo((): AssignmentLogic => {
    if (p7Data?.assignmentLogic) return p7Data.assignmentLogic

    const p2Data = opportunity.p2Data || []
    const firstProduct = p2Data.length > 0 ? allProducts.find((p) => p.id === p2Data[0].productId) : null

    // Expert matching if product type matches manager expertise
    if (firstProduct) {
      const expertManager = MOCK_MANAGERS.find((m) =>
        m.expertise.some((e) => firstProduct.category?.includes(e) || firstProduct.name.includes(e))
      )
      if (expertManager) {
        return {
          algorithm: 'expert',
          triggerServiceId: firstProduct.id,
          triggerServiceName: firstProduct.name,
          assignedManagerId: expertManager.id,
          assignedManagerName: expertManager.name,
          managedCount: expertManager.managedCount,
          managedCapacity: expertManager.capacity,
          expertise: expertManager.expertise,
          assignedAt: new Date().toISOString(),
        }
      }
    }

    // Load-balanced fallback
    const leastLoadedManager = MOCK_MANAGERS.reduce((prev, curr) =>
      curr.managedCount / curr.capacity < prev.managedCount / prev.capacity ? curr : prev
    )

    return {
      algorithm: 'load-balanced',
      assignedManagerId: leastLoadedManager.id,
      assignedManagerName: leastLoadedManager.name,
      managedCount: leastLoadedManager.managedCount,
      managedCapacity: leastLoadedManager.capacity,
      assignedAt: new Date().toISOString(),
    }
  }, [opportunity.p2Data, allProducts, p7Data?.assignmentLogic])

  const currentData: OpportunityP7Data = {
    progressPoints: generatedProgressPoints,
    deliveryStatus: p7Data?.deliveryStatus || 'in_transit',
    assignmentLogic,
    notes: p7Data?.notes || '',
  }

  const completedCount = currentData.progressPoints.filter((p) => p.status === 'completed').length
  const totalCount = currentData.progressPoints.length
  const allCompleted = completedCount === totalCount && totalCount > 0

  const updatePointStatus = (pointId: string, status: 'pending' | 'in_progress' | 'completed') => {
    const updatedPoints = currentData.progressPoints.map((p) =>
      p.id === pointId ? { ...p, status, timestamp: status === 'completed' ? new Date().toISOString() : p.timestamp } : p
    )
    onDataChange({ ...currentData, progressPoints: updatedPoints })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onDataChange({
        ...currentData,
        finalDocumentUrl: URL.createObjectURL(file),
        finalDocumentName: file.name,
      })
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-[#111827]">P7: 智能委派与交付</h3>
            <p className="mt-0.5 text-[11px] text-[#9ca3af]">
              进度 {completedCount}/{totalCount} 项
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] font-medium ${
                allCompleted
                  ? 'bg-[#ecfdf5] text-[#047857]'
                  : 'bg-[#fef3c7] text-[#92400e]'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${allCompleted ? 'bg-[#10b981]' : 'bg-[#f59e0b] animate-pulse'}`} />
              {allCompleted ? '全部完成' : '进行中'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Assignment Logic + Progress Table */}
        <div className="flex flex-1 flex-col overflow-y-auto border-r border-[#e5e7eb] p-4">
          {/* Assignment Logic Card */}
          <div className="mb-4 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <div className="mb-2 flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-sm ${
                  assignmentLogic.algorithm === 'expert' ? 'bg-[#dbeafe]' : 'bg-[#fef3c7]'
                }`}
              >
                {assignmentLogic.algorithm === 'expert' ? (
                  <Zap size={14} className="text-[#2563eb]" />
                ) : (
                  <Scale size={14} className="text-[#f59e0b]" />
                )}
              </div>
              <span className="text-[12px] font-semibold text-[#111827]">
                {assignmentLogic.algorithm === 'expert' ? '专家匹配' : '负载均衡'}
              </span>
            </div>

            {assignmentLogic.algorithm === 'expert' && assignmentLogic.triggerServiceName && (
              <p className="mb-2 text-[11px] text-[#6b7280]">
                触发因素：<span className="font-medium text-[#2563eb]">{assignmentLogic.triggerServiceName}</span>
              </p>
            )}

            <div className="flex items-center gap-3 rounded-sm border border-[#e5e7eb] bg-white p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5e7eb]">
                <User size={16} className="text-[#6b7280]" />
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-medium text-[#111827]">{assignmentLogic.assignedManagerName}</p>
                <p className="text-[10px] text-[#9ca3af]">
                  在办 {assignmentLogic.managedCount}/{assignmentLogic.managedCapacity} 件
                  {assignmentLogic.expertise && ` · ${assignmentLogic.expertise.join(', ')}`}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Points Table */}
          <div className="flex-1 rounded-sm border border-[#e5e7eb] bg-white">
            <div className="grid grid-cols-[1fr_80px_100px_80px] items-center gap-x-2 border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              <span>服务项</span>
              <span>状态</span>
              <span>时间</span>
              <span>操作</span>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {currentData.progressPoints.map((point, idx) => (
                <div
                  key={point.id}
                  className={`grid grid-cols-[1fr_80px_100px_80px] items-center gap-x-2 px-3 py-2 text-[12px] ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'
                  } hover:bg-[#eff6ff]`}
                >
                  <span className="flex items-center gap-1.5 truncate text-[#111827]">
                    {STATUS_ICON[point.status]}
                    {point.label}
                  </span>
                  <span className="text-[11px] text-[#6b7280]">{STATUS_LABEL[point.status]}</span>
                  <span className="font-mono text-[10px] text-[#9ca3af]">
                    {point.timestamp ? new Date(point.timestamp).toLocaleDateString('zh-CN') : '—'}
                  </span>
                  <div className="flex items-center gap-1">
                    {point.status !== 'completed' && (
                      <button
                        onClick={() => updatePointStatus(point.id, 'completed')}
                        className="flex h-6 items-center gap-1 rounded-sm bg-[#2563eb] px-1.5 text-[10px] text-white hover:bg-[#1d4ed8]"
                      >
                        <CheckCircle2 size={10} />
                        完成
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Final Document + Notes */}
        <div className="w-80 shrink-0 flex flex-col overflow-y-auto p-4">
          {/* Opportunity Info */}
          <div className="mb-3 rounded-sm border border-[#e5e7eb] bg-white p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">关联商机</p>
            <p className="mt-1 font-mono text-[13px] font-medium text-[#111827]">{opportunity.opportunityCode ?? opportunity.id}</p>
            <p className="text-[12px] text-[#374151]">
              {opportunity.customer.name} · {opportunity.serviceTypeLabel}
            </p>
          </div>

          {/* Final Document Upload */}
          <div className="mb-3 rounded-sm border border-[#e5e7eb] bg-white p-3">
            <p className="mb-2 text-[11px] font-semibold text-[#111827]">最终交付文件</p>
            {currentData.finalDocumentUrl ? (
              <div className="flex items-center gap-2 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-2">
                <FileText size={16} className="text-[#2563eb]" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[12px] font-medium text-[#111827]">
                    {currentData.finalDocumentName || '交付文件.pdf'}
                  </p>
                </div>
                <button className="shrink-0 text-[#9ca3af] hover:text-[#2563eb]">
                  <Download size={14} />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-sm border-2 border-dashed border-[#d1d5db] bg-[#f9fafb] p-4 hover:border-[#2563eb]">
                <Upload size={20} className="text-[#9ca3af]" />
                <span className="text-[11px] text-[#6b7280]">上传最终文件</span>
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
            )}
          </div>

          {/* Delivery Status */}
          <div className="mb-3 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">交付状态</p>
            <div className="flex items-center gap-2">
              <Package size={14} className={currentData.deliveryStatus === 'delivered' ? 'text-[#10b981]' : 'text-[#f59e0b]'} />
              <span className="text-[12px] font-medium text-[#111827]">
                {currentData.deliveryStatus === 'delivered' ? '已交付' : '配送中'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-auto">
            <label className="text-[11px] font-medium text-[#6b7280]">备注</label>
            <textarea
              value={currentData.notes || ''}
              onChange={(e) => onDataChange({ ...currentData, notes: e.target.value })}
              placeholder="输入交付相关备注..."
              className="mt-1 h-20 w-full rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#2563eb]"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#e5e7eb] bg-[#f9fafb] px-5 py-2">
        <div className="flex items-center justify-between">
          <div className="text-[12px] text-[#9ca3af]">
            {allCompleted ? (
              <span className="text-[#10b981]">所有服务项已完成，可以结案</span>
            ) : (
              <span>请完成所有服务项后结案</span>
            )}
          </div>
          <button
            disabled={!allCompleted}
            onClick={onCompleteDelivery}
            className="flex h-8 items-center gap-1.5 rounded-sm bg-[#2563eb] px-3 text-[13px] font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#d1d5db]"
          >
            确认结案
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
