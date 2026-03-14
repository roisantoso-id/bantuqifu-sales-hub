'use client'

import { Upload, File, Eye, X } from 'lucide-react'
import { useState } from 'react'
import type { OpportunityP4Data } from '@/lib/types'

interface P4ContractProps {
  p4Data?: OpportunityP4Data
  onDataChange: (data: OpportunityP4Data) => void
}

const STATUS_LABEL: Record<string, string> = {
  pending: '待签署',
  returned: '已回传',
  archived: '归档中',
}

export function P4Contract({ p4Data, onDataChange }: P4ContractProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

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
    // 模拟文件上传
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
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-[#111827]">P4: 合同签署</h3>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Upload Area */}
        <div className="flex-1 flex flex-col p-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 flex flex-col items-center justify-center rounded-sm border-2 border-dashed transition-colors ${
              isDragging
                ? 'border-[#2563eb] bg-[#eff6ff]'
                : 'border-[#d1d5db] bg-[#f9fafb]'
            }`}
          >
            {currentData.contractFileUrl ? (
              <div className="flex flex-col items-center gap-2">
                <File size={32} className="text-[#9ca3af]" />
                <p className="text-[12px] text-[#6b7280]">合同已上传</p>
                <button
                  onClick={() =>
                    onDataChange({
                      ...currentData,
                      contractFileUrl: undefined,
                      contractStatus: 'pending',
                    })
                  }
                  className="mt-2 flex h-7 items-center gap-1 rounded-sm bg-[#fee2e2] px-2 text-[11px] text-[#dc2626] hover:bg-[#fecaca]"
                >
                  <X size={12} />
                  重新上传
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload size={24} className="text-[#9ca3af]" />
                <p className="text-[13px] font-medium text-[#374151]">
                  拖拽 PDF 合同到此处
                </p>
                <p className="text-[11px] text-[#9ca3af]">或点击选择文件</p>
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

          {/* Notes */}
          <div className="mt-3 border-t border-[#e5e7eb] pt-3">
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
              className="mt-1 h-16 w-full rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#2563eb]"
            />
          </div>
        </div>

        {/* Right: Preview & Status */}
        <div className="w-64 shrink-0 border-l border-[#e5e7eb] p-3">
          {/* Status */}
          <div className="mb-3 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-2">
            <p className="text-[11px] text-[#6b7280]">状态</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  currentData.contractStatus === 'pending'
                    ? 'bg-[#9ca3af]'
                    : currentData.contractStatus === 'returned'
                      ? 'bg-[#2563eb]'
                      : 'bg-[#10b981]'
                }`}
              />
              <span className="font-mono text-[12px] font-medium text-[#111827]">
                {STATUS_LABEL[currentData.contractStatus]}
              </span>
            </div>
          </div>

          {/* Preview Thumbnail */}
          {currentData.contractFileUrl && (
            <div className="mb-3">
              <p className="mb-1 text-[11px] text-[#6b7280]">合同预览</p>
              <div className="flex h-40 items-center justify-center rounded-sm border border-[#e5e7eb] bg-[#f3f4f6]">
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="flex h-8 items-center gap-1 rounded-sm bg-[#2563eb] px-2 text-[11px] text-white hover:bg-[#1d4ed8]"
                >
                  <Eye size={12} />
                  全屏预览
                </button>
              </div>
            </div>
          )}

          {/* Upload Time */}
          {currentData.uploadedAt && (
            <div className="rounded-sm border border-[#e5e7eb] bg-white p-2 text-[11px] text-[#6b7280]">
              <p className="font-mono">
                上传于: {new Date(currentData.uploadedAt).toLocaleString('zh-CN')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
