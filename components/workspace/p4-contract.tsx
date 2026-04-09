'use client'

import { Upload, File, Eye, X, CheckCircle2, Circle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { OpportunityP4Data, Opportunity } from '@/lib/types'

interface P4ContractProps {
  opportunity: Opportunity
  p4Data?: OpportunityP4Data
  onDataChange: (data: OpportunityP4Data) => void
  onSaveDraft: (data: OpportunityP4Data) => Promise<{ success: boolean; error?: string }>
  onSubmitContract: (formData: FormData) => Promise<{ success: boolean; error?: string }>
  isReadonly?: boolean
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

const EMPTY_P4_DATA: OpportunityP4Data = {
  contractStatus: 'pending',
  notes: '',
  sealVisible: false,
  signatureComplete: false,
  qualityClear: false,
}

export function P4Contract({
  opportunity,
  p4Data,
  onDataChange,
  onSaveDraft,
  onSubmitContract,
  isReadonly = false,
}: P4ContractProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentData = useMemo(() => ({ ...EMPTY_P4_DATA, ...p4Data }), [p4Data])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    setIsDragging(false)
    setIsSavingDraft(false)
    setIsSubmitting(false)
    setErrorMessage(null)
    setSuccessMessage(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [opportunity.id, p4Data])

  const checklist = {
    sealVisible: currentData.sealVisible,
    signatureComplete: currentData.signatureComplete,
    qualityClear: currentData.qualityClear,
  }

  const hasUploadedContract = Boolean(currentData.contractFileUrl)
  const hasSelectedFile = Boolean(selectedFile)
  const canSubmit = hasSelectedFile && Object.values(checklist).every(Boolean) && !isReadonly

  const resetMessages = () => {
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const updateData = (next: OpportunityP4Data) => {
    onDataChange(next)
  }

  const handleSelectedFile = (file: File) => {
    resetMessages()

    if (file.type && file.type !== 'application/pdf') {
      setErrorMessage('仅支持上传 PDF 合同文件')
      return
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('请选择 PDF 格式的合同文件')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('合同文件不能超过 50MB')
      return
    }

    setSelectedFile(file)
    updateData({
      ...currentData,
      contractStatus: 'pending',
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (isReadonly) return
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (isReadonly) return
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleSelectedFile(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleSelectedFile(file)
    }
  }

  const handleChecklistChange = (key: keyof typeof checklist, value: boolean) => {
    resetMessages()
    updateData({
      ...currentData,
      [key]: value,
    })
  }

  const handleSaveDraft = async () => {
    resetMessages()
    setIsSavingDraft(true)
    const result = await onSaveDraft(currentData)
    setIsSavingDraft(false)

    if (!result.success) {
      setErrorMessage(result.error || '保存草稿失败')
      return
    }

    setSuccessMessage('草稿已保存')
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      setErrorMessage('请先选择合同 PDF')
      return
    }

    resetMessages()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.set('file', selectedFile)
    formData.set('notes', currentData.notes || '')
    formData.set('sealVisible', String(currentData.sealVisible))
    formData.set('signatureComplete', String(currentData.signatureComplete))
    formData.set('qualityClear', String(currentData.qualityClear))

    const result = await onSubmitContract(formData)
    setIsSubmitting(false)

    if (!result.success) {
      setErrorMessage(result.error || '提交合同失败')
      return
    }

    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setSuccessMessage('合同已上传并通知财务')
  }

  const fileDisplayName = selectedFile?.name || currentData.contractFileName || `Bantu_Contract_${opportunity.opportunityCode ?? opportunity.id}.pdf`
  const uploadTimestamp = currentData.uploadedAt
    ? new Date(currentData.uploadedAt).toLocaleString('zh-CN')
    : selectedFile
      ? '待提交'
      : '未知'

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-[#e5e7eb] px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-[#111827]">P4: 合同签署</h3>
            <p className="mt-1 text-[11px] text-[#9ca3af]">处理合同回传、校验与存储</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${STATUS_COLOR[currentData.contractStatus]} animate-pulse`} />
            <span className="text-[12px] font-medium text-[#111827]">
              {STATUS_LABEL[currentData.contractStatus]}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-y-auto border-r border-[#e5e7eb] p-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mb-4 flex h-48 flex-col items-center justify-center rounded-sm border-2 border-dashed transition-colors ${
              isDragging
                ? 'border-[#2563eb] bg-[#eff6ff]'
                : hasSelectedFile || hasUploadedContract
                  ? 'border-[#10b981] bg-[#ecfdf5]'
                  : 'border-[#d1d5db] bg-[#f9fafb]'
            }`}
          >
            {hasSelectedFile || hasUploadedContract ? (
              <div className="flex flex-col items-center gap-2">
                <File size={28} className="text-[#10b981]" />
                <p className="text-[12px] font-medium text-[#047857]">
                  {hasSelectedFile ? '合同待提交' : '合同已上传'}
                </p>
                {!isReadonly && (
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      resetMessages()
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="mt-2 flex h-6 items-center gap-1 rounded-sm bg-[#fee2e2] px-2 text-[11px] text-[#dc2626] hover:bg-[#fecaca]"
                  >
                    <X size={12} />
                    重新选择
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-center">
                <Upload size={24} className="text-[#9ca3af]" />
                <p className="text-[13px] font-medium text-[#374151]">点击或拖拽正式合同 PDF 至此</p>
                <p className="text-[11px] text-[#9ca3af]">限 50MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileInput}
                  className="hidden"
                  id="contract-upload"
                  disabled={isReadonly}
                />
                {!isReadonly && (
                  <label
                    htmlFor="contract-upload"
                    className="mt-2 flex h-7 cursor-pointer items-center gap-1 rounded-sm bg-[#2563eb] px-3 text-[11px] font-medium text-white hover:bg-[#1d4ed8]"
                  >
                    <Upload size={12} />
                    选择文件
                  </label>
                )}
              </div>
            )}
          </div>

          {(hasSelectedFile || hasUploadedContract) && (
            <div className="mb-4 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-[#111827]">{fileDisplayName}</p>
                  <p className="text-[11px] text-[#9ca3af]">上传于 {uploadTimestamp}</p>
                </div>
                {(currentData.contractPreviewUrl || currentData.contractFileUrl) && (
                  <a
                    href={currentData.contractPreviewUrl ?? currentData.contractFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-6 w-6 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-[#e5e7eb]"
                  >
                    <Eye size={14} />
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="mb-4 rounded-sm border border-[#e5e7eb] bg-white p-3">
            <p className="mb-2 text-[12px] font-semibold text-[#111827]">合同质检清单</p>
            <div className="space-y-2">
              {[
                { key: 'sealVisible', label: '合同公章清晰可见' },
                { key: 'signatureComplete', label: '签字页完整无遗漏' },
                { key: 'qualityClear', label: '扫描件无遮挡/反光' },
              ].map((item) => (
                <label key={item.key} className="flex items-center gap-2 rounded-sm p-1.5 hover:bg-[#f3f4f6]">
                  <input
                    type="checkbox"
                    checked={checklist[item.key as keyof typeof checklist]}
                    onChange={(e) => handleChecklistChange(item.key as keyof typeof checklist, e.target.checked)}
                    className="h-4 w-4 cursor-pointer"
                    disabled={isReadonly}
                  />
                  <span className="text-[12px] text-[#374151]">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <label className="text-[11px] font-medium text-[#6b7280]">备注</label>
            <textarea
              value={currentData.notes || ''}
              onChange={(e) => {
                resetMessages()
                updateData({
                  ...currentData,
                  notes: e.target.value,
                })
              }}
              placeholder="输入合同相关备注..."
              className="mt-1 h-20 w-full rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#2563eb]"
              disabled={isReadonly}
            />
          </div>
        </div>

        <div className="w-96 shrink-0 flex flex-col overflow-y-auto border-l border-[#e5e7eb] p-3">
          <div className="mb-3 rounded-sm border border-[#e5e7eb] bg-white p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">关联商机</p>
            <p className="mt-1 font-mono text-[13px] font-medium text-[#111827]">
              {opportunity.opportunityCode ?? opportunity.id}
            </p>
            <p className="text-[12px] text-[#374151]">
              {opportunity.customer.name} - {opportunity.serviceTypeLabel}
            </p>
          </div>

          <div className="mb-3 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">合同状态</p>
            <div className="mt-1.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6b7280]">当前状态</span>
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-white px-2 py-1 text-[11px] font-medium text-[#111827]">
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLOR[currentData.contractStatus]}`} />
                  {STATUS_LABEL[currentData.contractStatus]}
                </span>
              </div>
              {(currentData.uploadedAt || selectedFile) && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#6b7280]">上传时间</span>
                  <span className="font-mono text-[11px] text-[#374151]">
                    {currentData.uploadedAt
                      ? new Date(currentData.uploadedAt).toLocaleDateString('zh-CN')
                      : '待提交'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-sm border border-[#e5e7eb] bg-white p-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">质检进度</p>
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
        </div>
      </div>

      <div className="border-t border-[#e5e7eb] bg-[#f9fafb] px-5 py-2">
        <div className="flex items-center justify-between gap-3 text-[12px]">
          <div className="flex-1 text-[#9ca3af]">
            已关联商机: <span className="font-mono font-medium text-[#111827]">{opportunity.opportunityCode ?? opportunity.id}</span>
            {opportunity.customer.name}
            {errorMessage && <div className="mt-1 text-[#dc2626]">{errorMessage}</div>}
            {successMessage && <div className="mt-1 text-[#047857]">{successMessage}</div>}
          </div>
          {!isReadonly && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isSubmitting}
                className="flex h-8 items-center gap-1.5 rounded-sm border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#374151] hover:border-[#d1d5db] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingDraft ? '保存中...' : '保存草稿'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting || isSavingDraft}
                className="flex h-8 items-center gap-1.5 rounded-sm bg-[#2563eb] px-3 text-[13px] font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#d1d5db]"
              >
                {isSubmitting ? '提交中...' : '提交合同并通知财务'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
