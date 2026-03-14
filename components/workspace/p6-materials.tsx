'use client'

import { Upload, Eye, CheckCircle2, Circle, X, Clock, AlertCircle } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { OpportunityP6Data, MaterialItem, Opportunity, Product } from '@/lib/types'

interface P6MaterialsProps {
  opportunity: Opportunity
  allProducts: Product[]
  p6Data?: OpportunityP6Data
  onDataChange: (data: OpportunityP6Data) => void
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  missing: { bg: 'bg-[#f3f4f6]', text: 'text-[#6b7280]', icon: <Circle size={12} />, label: '缺失' },
  pending_review: { bg: 'bg-[#fef3c7]', text: 'text-[#92400e]', icon: <Clock size={12} />, label: '待审核' },
  approved: { bg: 'bg-[#d1fae5]', text: 'text-[#065f46]', icon: <CheckCircle2 size={12} />, label: '已通过' },
  rejected: { bg: 'bg-[#fee2e2]', text: 'text-[#991b1b]', icon: <AlertCircle size={12} />, label: '驳回' },
}

export function P6Materials({ opportunity, allProducts, p6Data, onDataChange }: P6MaterialsProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const currentData = p6Data || { materials: [] }

  // 根据P2中选中的产品自动生成材料清单
  const generatedMaterials = useMemo(() => {
    const p2ProductIds = (opportunity.p2Data || []).map((p) => p.productId)
    const materials: MaterialItem[] = []

    p2ProductIds.forEach((productId, idx) => {
      const product = allProducts.find((p) => p.id === productId)
      if (!product) return

      // 模拟根据产品类型生成所需材料
      const materialTemplates: Record<string, string[]> = {
        '签证服务': ['护照首页', '护照内页', '照片(4x6cm)', '身份证扫描件'],
        '公司开办服务': ['法人身份证', '注册资本证明', '公司章程', '董事会决议'],
        '税务服务': ['企业营业执照', '税务登记证', '财务报表', '银行开户许可证'],
        '资质注册服务': ['企业营业执照', '法人身份证', '关键证件', '授权委托书'],
        '接送关服务': ['护照', '签证复印件'],
      }

      const templates = materialTemplates[product.category] || ['相关资料']
      templates.forEach((name, matIdx) => {
        materials.push({
          id: `mat-${idx}-${matIdx}`,
          name,
          requirement: '请上传清晰的PDF或图片',
          serviceId: productId,
          serviceName: product.name,
          status: 'missing',
          fileUrl: undefined,
        })
      })
    })

    return materials
  }, [opportunity.p2Data, allProducts])

  // 合并生成的材料与已上传的材料
  const mergedMaterials = useMemo(() => {
    const uploaded = new Map(currentData.materials.map((m) => [m.id, m]))
    return generatedMaterials.map((m) => uploaded.get(m.id) || m)
  }, [generatedMaterials, currentData.materials])

  // 按服务分组
  const groupedByService = useMemo(() => {
    const groups: Record<string, MaterialItem[]> = {}
    mergedMaterials.forEach((m) => {
      const key = m.serviceName || '其他'
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    })
    return groups
  }, [mergedMaterials])

  const stats = useMemo(() => {
    return {
      total: mergedMaterials.length,
      collected: mergedMaterials.filter((m) => m.fileUrl).length,
      pending: mergedMaterials.filter((m) => m.status === 'pending_review').length,
      approved: mergedMaterials.filter((m) => m.status === 'approved').length,
    }
  }, [mergedMaterials])

  const updateMaterial = (id: string, updates: Partial<MaterialItem>) => {
    const updated = mergedMaterials.map((m) => (m.id === id ? { ...m, ...updates } : m))
    onDataChange({
      materials: updated,
      lastUpdatedAt: new Date().toISOString(),
    })
  }

  const approveMaterial = (material: MaterialItem) => {
    updateMaterial(material.id, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: '财务经理',
    })
  }

  const rejectMaterialHandler = (material: MaterialItem) => {
    if (!rejectReason) return
    updateMaterial(material.id, {
      status: 'rejected',
      rejectionReason: rejectReason,
    })
    setSelectedMaterial(null)
    setRejectReason('')
  }

  const handleFileUpload = (material: MaterialItem, file: File) => {
    const fileUrl = URL.createObjectURL(file)
    updateMaterial(material.id, {
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      status: 'pending_review',
      uploadedAt: new Date().toISOString(),
      uploadedBy: '销售经理',
    })
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Sticky Header with Stats */}
      <div className="border-b border-[#e5e7eb] bg-[#f9fafb] px-4 py-2">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-4 font-mono">
            <span className="text-[#9ca3af]">
              已收集: <span className="font-semibold text-[#111827]">{stats.collected}/{stats.total}</span>
            </span>
            <span className="text-[#9ca3af]">
              待审核: <span className="font-semibold text-[#f59e0b]">{stats.pending}</span>
            </span>
            <span className="text-[#9ca3af]">
              已批准: <span className="font-semibold text-[#10b981]">{stats.approved}</span>
            </span>
          </div>
          {opportunity.p5Data?.paymentStatus === 'verified' && (
            <span className="text-[#065f46] bg-[#d1fae5] px-2 py-0.5 rounded-sm text-[10px] font-medium">
              P5 首款已确认
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Material List */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-[#e5e7eb]">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_80px_60px_100px_60px] gap-x-2 items-center px-3 py-1.5 bg-[#f9fafb] border-b border-[#e5e7eb] text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
            <span>材料名称</span>
            <span className="text-center">文件</span>
            <span className="text-center">状态</span>
            <span>要求说明</span>
            <span className="text-right">操作</span>
          </div>

          {/* Materials Table */}
          <div className="flex-1 overflow-y-auto">
            {Object.entries(groupedByService).map(([serviceName, materials]) => (
              <div key={serviceName}>
                {/* Service Group Header */}
                <div className="sticky top-0 bg-[#f9fafb] px-3 py-1 border-b border-[#f3f4f6] text-[11px] font-medium text-[#6b7280] z-10">
                  {serviceName}
                </div>

                {/* Material Rows */}
                {materials.map((material) => {
                  const status = STATUS_CONFIG[material.status]
                  return (
                    <div
                      key={material.id}
                      onClick={() => setSelectedMaterial(material)}
                      className="grid grid-cols-[2fr_80px_60px_100px_60px] gap-x-2 items-center px-3 py-1.5 border-b border-[#e5e7eb] hover:bg-[#f9fafb] cursor-pointer text-[12px]"
                    >
                      {/* Material Name */}
                      <span className="truncate font-medium text-[#111827]" title={material.name}>
                        {material.name}
                      </span>

                      {/* File Status */}
                      <div className="flex items-center justify-center">
                        {material.fileUrl ? (
                          <span className="text-[10px] bg-[#d1fae5] text-[#065f46] px-1.5 py-0.5 rounded-sm font-medium">
                            已上传
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#9ca3af]">—</span>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className={`flex items-center justify-center gap-1 rounded-sm px-1.5 py-0.5 ${status.bg} ${status.text}`}>
                        {status.icon}
                        <span className="text-[10px] font-medium">{status.label}</span>
                      </div>

                      {/* Requirement */}
                      <span className="truncate text-[11px] text-[#6b7280]" title={material.requirement}>
                        {material.requirement || '—'}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedMaterial(material)
                          }}
                          className="flex h-5 w-5 items-center justify-center rounded-sm text-[#2563eb] hover:bg-[#eff6ff]"
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Preview Drawer (50% width) */}
        {selectedMaterial && (
          <div className="w-1/2 shrink-0 flex flex-col border-l border-[#e5e7eb] bg-white">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-medium text-[#111827] truncate">{selectedMaterial.name}</h3>
                <p className="mt-0.5 text-[11px] text-[#9ca3af]">{selectedMaterial.serviceName}</p>
              </div>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="flex h-6 w-6 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#f3f4f6]"
              >
                <X size={14} />
              </button>
            </div>

            {/* File Preview Area */}
            <div className="flex-1 flex flex-col overflow-auto bg-[#1f2937]">
              {selectedMaterial.fileUrl ? (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center">
                    <Eye size={32} className="mx-auto mb-2 text-[#9ca3af]" />
                    <p className="text-[12px] text-[#d1d5db]">
                      {selectedMaterial.fileName || '文件预览'}
                    </p>
                    {selectedMaterial.fileSize && (
                      <p className="mt-1 font-mono text-[11px] text-[#9ca3af]">
                        {(selectedMaterial.fileSize / 1024).toFixed(2)} KB
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <Upload size={32} className="mb-2 text-[#9ca3af]" />
                  <p className="text-[12px] text-[#d1d5db]">未上传文件</p>
                  <label className="mt-3 flex h-7 items-center gap-1 rounded-sm bg-[#2563eb] px-2 text-[11px] font-medium text-white cursor-pointer hover:bg-[#1d4ed8]">
                    <Upload size={12} />
                    上传文件
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(selectedMaterial, file)
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Audit Actions */}
            <div className="border-t border-[#e5e7eb] p-3 space-y-2">
              {/* Status Display */}
              <div className="flex items-center justify-between rounded-sm bg-[#f9fafb] px-2 py-1.5 text-[11px]">
                <span className="text-[#6b7280]">当前状态</span>
                <span className={`flex items-center gap-1 font-medium ${STATUS_CONFIG[selectedMaterial.status].text}`}>
                  {STATUS_CONFIG[selectedMaterial.status].icon}
                  {STATUS_CONFIG[selectedMaterial.status].label}
                </span>
              </div>

              {/* Audit Buttons */}
              {selectedMaterial.status === 'pending_review' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMaterial(selectedMaterial)}
                    className="flex-1 flex h-7 items-center justify-center rounded-sm bg-[#10b981] text-[11px] font-medium text-white hover:bg-[#059669]"
                  >
                    <CheckCircle2 size={12} className="mr-1" />
                    审核通过
                  </button>
                  <button
                    onClick={() => setRejectReason('SHOW_FORM')}
                    className="flex-1 flex h-7 items-center justify-center rounded-sm bg-[#dc2626] text-[11px] font-medium text-white hover:bg-[#b91c1c]"
                  >
                    <AlertCircle size={12} className="mr-1" />
                    驳回
                  </button>
                </div>
              )}

              {/* Rejection Form */}
              {rejectReason === 'SHOW_FORM' && (
                <div className="space-y-2">
                  <textarea
                    value={rejectReason === 'SHOW_FORM' ? '' : rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="输入驳回原因..."
                    className="w-full h-16 rounded-sm border border-[#e5e7eb] bg-white p-2 text-[11px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#dc2626]"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => rejectMaterialHandler(selectedMaterial)}
                      className="flex-1 h-6 rounded-sm bg-[#dc2626] text-[10px] font-medium text-white hover:bg-[#b91c1c]"
                    >
                      确认驳回
                    </button>
                    <button
                      onClick={() => setRejectReason('')}
                      className="flex-1 h-6 rounded-sm border border-[#e5e7eb] text-[10px] text-[#6b7280] hover:bg-[#f3f4f6]"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {/* Rejection Info */}
              {selectedMaterial.status === 'rejected' && selectedMaterial.rejectionReason && (
                <div className="rounded-sm bg-[#fee2e2] p-2 text-[11px] text-[#991b1b]">
                  <p className="font-medium mb-1">驳回原因:</p>
                  <p>{selectedMaterial.rejectionReason}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t border-[#e5e7eb] pt-2 text-[10px] space-y-1 text-[#9ca3af]">
                {selectedMaterial.uploadedAt && (
                  <p>
                    上传: {new Date(selectedMaterial.uploadedAt).toLocaleString('zh-CN')} by{' '}
                    {selectedMaterial.uploadedBy}
                  </p>
                )}
                {selectedMaterial.approvedAt && (
                  <p>
                    批准: {new Date(selectedMaterial.approvedAt).toLocaleString('zh-CN')} by{' '}
                    {selectedMaterial.approvedBy}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
