'use client'

import { Upload, File, Eye, X, CheckCircle2, Circle } from 'lucide-react'
import { useState } from 'react'
import type { OpportunityP4Data, Opportunity } from '@/lib/types'

interface P4ContractProps {
  opportunity: Opportunity
  p4Data?: OpportunityP4Data
  onDataChange: (data: OpportunityP4Data) => void
}

const STATUS_LABEL: Record<string, string> = {
  pending: '等待回传',
  returned: '已回传',
  archived: '归档中',
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-500',
  returned: 'bg-green-500',
  archived: 'bg-blue-500',
}

export function P4Contract({ opportunity, p4Data, onDataChange }: P4ContractProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [checklist, setChecklist] = useState({
    sealVisible: false,
    signatureComplete: false,
    qualityClear: false,
  })

  const currentData = p4Data || {
    contractStatus: 'pending',
    notes: '',
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      onDataChange({
        ...currentData,
        contractFileUrl: URL.createObjectURL(file),
        contractStatus: 'returned',
        uploadedAt: new Date().toISOString(),
      })
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onDataChange({
        ...currentData,
        contractFileUrl: URL.createObjectURL(file),
        contractStatus: 'returned',
        uploadedAt: new Date().toISOString(),
      })
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header with Status Badge */}
      <div className="border-b border-[#e5e7eb] px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-[#111827]">P4: 合同签署</h3>
            <p className="mt-1 text-[11px] text-[#9ca3af]">处理合同回传、校验与存储</p>
          </div>
          {/* Breathing Light Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${STATUS_COLOR[currentData.contractStatus]} animate-pulse`}
            />
            <span className="text-[12px] font-medium text-[#111827]">
              {STATUS_LABEL[currentData.contractStatus]}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Left/Right Split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Upload & Checklist Area (60%) */}
        <div className="flex flex-1 flex-col overflow-y-auto border-r border-[#e5e7eb] p-4">
          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mb-4 flex h-48 flex-col items-center justify-center rounded-sm border-2 border-dashed transition-colors ${
              isDragging
                ? 'border-[#2563eb] bg-[#eff6ff]'
                : currentData.contractFileUrl
                  ? 'border-[#10b981] bg-[#ecfdf5]'
                  : 'border-[#d1d5db] bg-[#f9fafb]'
            }`}
          >
            {currentData.contractFileUrl ? (
              <div className="flex flex-col items-center gap-2">
                <File size={28} className="text-[#10b981]" />
                <p className="text-[12px] font-medium text-[#047857]">合同已上传</p>
                <button
                  onClick={() =>
                    onDataChange({
                      ...currentData,
                      contractFileUrl: undefined,
                      contractStatus: 'pending',
                    })
                  }
                  className="mt-2 flex h-6 items-center gap-1 rounded-sm bg-[#fee2e2] px-2 text-[11px] text-[#dc2626] hover:bg-[#fecaca]"
                >
                  <X size={12} />
                  重新上传
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Upload size={24} className="text-[#9ca3af]" />
                <p className="text-[13px] font-medium text-[#374151]">
                  点击或拖拽正式合同 PDF 至此
                </p>
                <p className="text-[11px] text-[#9ca3af]">限 50MB</p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                  id="contract-upload"
                />
                <label
                  htmlFor="contract-upload"
                  className="mt-2 flex h-7 items-center gap-1 rounded-sm bg-[#2563eb] px-3 text-[11px] font-medium text-white cursor-pointer hover:bg-[#1d4ed8]"
                >
                  <Upload size={12} />
                  选择文件
                </label>
              </div>
            )}
          </div>

          {/* File Info */}
          {currentData.contractFileUrl && (
            <div className="mb-4 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-[#111827]">
                    Bantu_Contract_{opportunity.id}.pdf
                  </p>
                  <p className="text-[11px] text-[#9ca3af]">
                    上传于 {currentData.uploadedAt ? new Date(currentData.uploadedAt).toLocaleString('zh-CN') : '未知'}
                  </p>
                </div>
                <button className="shrink-0 flex h-6 w-6 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#e5e7eb]">
                  <Eye size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Checklist Section */}
          {currentData.contractFileUrl && (
            <div className="mb-4 rounded-sm border border-[#e5e7eb] bg-white p-3">
              <p className="mb-2 text-[12px] font-semibold text-[#111827]">合同质检清单</p>
              <div className="space-y-2">
                {[
                  { key: 'sealVisible', label: '合同公章清晰可见' },
                  { key: 'signatureComplete', label: '签字页完整无遗漏' },
                  { key: 'qualityClear', label: '扫描件无遮挡/反光' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center gap-2 rounded-sm p-1.5 hover:bg-[#f3f4f6]"
                  >
                    <input
                      type="checkbox"
                      checked={checklist[item.key as keyof typeof checklist]}
                      onChange={(e) =>
                        setChecklist((prev) => ({
                          ...prev,
                          [item.key]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 cursor-pointer"
                    />
                    <span className="text-[12px] text-[#374151]">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mt-auto">
            <label className="text-[11px] font-medium text-[#6b7280]">备注</label>
            <textarea
              value={currentData.notes || ''}
              onChange={(e) =>
                onDataChange({
                  ...currentData,
                  notes: e.target.value,
                })
              }
              placeholder="输入合同相关备注..."
              className="mt-1 h-20 w-full rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#2563eb]"
            />
          </div>
        </div>

        {/* Right: Preview & Details (40%) */}
        <div className="w-96 shrink-0 flex flex-col overflow-y-auto border-l border-[#e5e7eb] p-3">
          {/* Opportunity Info */}
          <div className="mb-3 rounded-sm border border-[#e5e7eb] bg-white p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              关联商机
            </p>
            <p className="mt-1 font-mono text-[13px] font-medium text-[#111827]">
              {opportunity.id}
            </p>
            <p className="text-[12px] text-[#374151]">
              {opportunity.customer.name} - {opportunity.serviceTypeLabel}
            </p>
          </div>

          {/* Contract Status Details */}
          <div className="mb-3 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
              合同状态
            </p>
            <div className="mt-1.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6b7280]">当前状态</span>
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-white px-2 py-1 text-[11px] font-medium text-[#111827]">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${STATUS_COLOR[currentData.contractStatus]}`}
                  />
                  {STATUS_LABEL[currentData.contractStatus]}
                </span>
              </div>
              {currentData.uploadedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#6b7280]">上传时间</span>
                  <span className="font-mono text-[11px] text-[#374151]">
                    {new Date(currentData.uploadedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Checklist Status */}
          {currentData.contractFileUrl && (
            <div className="rounded-sm border border-[#e5e7eb] bg-white p-2.5">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                质检进度
              </p>
              <div className="space-y-1">
                {[
                  { key: 'sealVisible', label: '公章' },
                  { key: 'signatureComplete', label: '签字' },
                  { key: 'qualityClear', label: '质量' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-1.5">
                    {checklist[item.key as keyof typeof checklist] ? (
                      <CheckCircle2 size={14} className="text-[#10b981]" />
                    ) : (
                      <Circle size={14} className="text-[#d1d5db]" />
                    )}
                    <span className="text-[11px] text-[#6b7280]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="border-t border-[#e5e7eb] bg-[#f9fafb] px-5 py-2">
        <div className="flex items-center justify-between text-[12px]">
          <div className="text-[#9ca3af]">
            已关联商机: <span className="font-mono font-medium text-[#111827]">{opportunity.id}</span>
            {opportunity.customer.name}
          </div>
          <button
            disabled={!currentData.contractFileUrl || !Object.values(checklist).every(Boolean)}
            className="flex h-8 items-center gap-1.5 rounded-sm bg-[#2563eb] px-3 text-[13px] font-medium text-white hover:bg-[#1d4ed8] disabled:bg-[#d1d5db] disabled:cursor-not-allowed"
          >
            提交合同并通知财务
          </button>
        </div>
      </div>
    </div>
  )
}
