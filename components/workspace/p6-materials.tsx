'use client'

import { Upload, CheckCircle, AlertCircle, Clock, FileQuestion, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { OpportunityP6Data, MaterialItem } from '@/lib/types'

interface P6MaterialsProps {
  p6Data?: OpportunityP6Data
  onDataChange: (data: OpportunityP6Data) => void
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  missing: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', label: '缺失' },
  pending_review: { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]', label: '待审核' },
  approved: { bg: 'bg-[#d1fae5]', text: 'text-[#065f46]', label: '已通过' },
  rejected: { bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]', label: '驳回' },
}

const OCR_STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock size={12} className="text-[#f59e0b]" />,
  completed: <CheckCircle size={12} className="text-[#10b981]" />,
  failed: <AlertCircle size={12} className="text-[#dc2626]" />,
}

export function P6Materials({ p6Data, onDataChange }: P6MaterialsProps) {
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null)
  const [rejectingMaterialId, setRejectingMaterialId] = useState<string | null>(null)

  const currentData = p6Data || { materials: [] }

  const addMaterial = () => {
    const newMaterial: MaterialItem = {
      id: `mat-${Date.now()}`,
      name: '新材料',
      status: 'missing',
    }
    onDataChange({
      ...currentData,
      materials: [...currentData.materials, newMaterial],
      lastUpdatedAt: new Date().toISOString(),
    })
  }

  const updateMaterial = (id: string, updates: Partial<MaterialItem>) => {
    onDataChange({
      ...currentData,
      materials: currentData.materials.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
      lastUpdatedAt: new Date().toISOString(),
    })
  }

  const deleteMaterial = (id: string) => {
    onDataChange({
      ...currentData,
      materials: currentData.materials.filter((m) => m.id !== id),
      lastUpdatedAt: new Date().toISOString(),
    })
  }

  const approveMaterial = (id: string) => {
    updateMaterial(id, { status: 'approved' })
  }

  const rejectMaterial = (id: string, reason: string) => {
    updateMaterial(id, {
      status: 'rejected',
      rejectionReason: reason,
    })
    setRejectingMaterialId(null)
  }

  const completedCount = currentData.materials.filter((m) => m.status === 'approved').length
  const totalCount = currentData.materials.length
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-[#111827]">P6: 材料提交</h3>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-[#e5e7eb] bg-[#f9fafb] px-4 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-[#6b7280]">完成进度</span>
          <span className="font-mono text-[12px] font-medium text-[#111827]">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="h-2 w-full rounded-sm bg-[#e5e7eb] overflow-hidden">
          <div
            className="h-full bg-[#2563eb] transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-[#6b7280]">{completionRate}% 完成</p>
      </div>

      {/* Materials Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_60px_100px_60px] gap-2 px-4 py-1.5 bg-[#f9fafb] border-b border-[#e5e7eb] text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
          <div>资料名称</div>
          <div className="text-center">OCR 状态</div>
          <div className="text-center">状态</div>
          <div>备注</div>
          <div className="text-right">操作</div>
        </div>

        {/* Table Rows */}
        <div className="flex-1 overflow-y-auto space-y-1 p-2">
          {currentData.materials.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <FileQuestion size={24} className="text-[#9ca3af]" />
                <p className="text-[13px] text-[#6b7280]">还未添加任何资料</p>
                <button
                  onClick={addMaterial}
                  className="mt-2 flex h-7 items-center gap-1 rounded-sm bg-[#2563eb] px-2 text-[11px] text-white hover:bg-[#1d4ed8]"
                >
                  <Upload size={12} />
                  添加资料
                </button>
              </div>
            </div>
          ) : (
            <>
              {currentData.materials.map((material) => {
                const statusInfo = STATUS_COLORS[material.status]
                return (
                  <div
                    key={material.id}
                    className="grid grid-cols-[1fr_80px_60px_100px_60px] gap-2 rounded-sm border border-[#e5e7eb] bg-white p-2 items-center text-[12px]"
                  >
                    {/* Material Name */}
                    <input
                      type="text"
                      value={material.name}
                      onChange={(e) => updateMaterial(material.id, { name: e.target.value })}
                      className="rounded-sm border border-[#e5e7eb] bg-white px-2 py-1 text-[#111827] outline-none focus:border-[#2563eb]"
                    />

                    {/* OCR Status */}
                    <div className="flex items-center justify-center">
                      {material.ocrStatus ? (
                        OCR_STATUS_ICON[material.ocrStatus]
                      ) : (
                        <span className="text-[10px] text-[#9ca3af]">—</span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className={`rounded-sm px-2 py-1 text-center text-[11px] font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                      {statusInfo.label}
                    </div>

                    {/* Rejection Reason */}
                    <div className="text-[11px] text-[#6b7280]">
                      {material.status === 'rejected' && material.rejectionReason ? (
                        <div title={material.rejectionReason} className="truncate">
                          {material.rejectionReason}
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      {material.status === 'pending_review' && (
                        <>
                          <button
                            onClick={() => approveMaterial(material.id)}
                            title="通过"
                            className="flex h-6 w-6 items-center justify-center rounded-sm text-[#10b981] hover:bg-[#d1fae5]"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => setRejectingMaterialId(material.id)}
                            title="驳回"
                            className="flex h-6 w-6 items-center justify-center rounded-sm text-[#dc2626] hover:bg-[#fee2e2]"
                          >
                            <AlertCircle size={14} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteMaterial(material.id)}
                        title="删除"
                        className="flex h-6 w-6 items-center justify-center rounded-sm text-[#9ca3af] hover:text-[#dc2626]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Add Material Button */}
        {currentData.materials.length > 0 && (
          <div className="border-t border-[#e5e7eb] p-2">
            <button
              onClick={addMaterial}
              className="w-full flex h-7 items-center justify-center rounded-sm border border-[#2563eb] text-[11px] font-medium text-[#2563eb] hover:bg-[#eff6ff]"
            >
              <Upload size={12} className="mr-1" />
              添加新资料
            </button>
          </div>
        )}
      </div>

      {/* Rejection Form Modal */}
      {rejectingMaterialId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="rounded-sm bg-white p-4 max-w-sm w-full mx-4 shadow-lg">
            <p className="mb-2 text-[13px] font-medium text-[#111827]">输入驳回原因</p>
            <textarea
              id={`reject-reason-${rejectingMaterialId}`}
              placeholder="例如：文件模糊，请重新上传清晰版本..."
              className="w-full h-16 rounded-sm border border-[#e5e7eb] p-2 text-[12px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#dc2626]"
              autoFocus
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  const reason = (document.getElementById(`reject-reason-${rejectingMaterialId}`) as HTMLTextAreaElement)?.value
                  if (reason) rejectMaterial(rejectingMaterialId, reason)
                }}
                className="flex-1 h-7 rounded-sm bg-[#dc2626] text-[11px] font-medium text-white hover:bg-[#b91c1c]"
              >
                确认驳回
              </button>
              <button
                onClick={() => setRejectingMaterialId(null)}
                className="flex-1 h-7 rounded-sm border border-[#e5e7eb] text-[11px] text-[#6b7280] hover:bg-[#f3f4f6]"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
