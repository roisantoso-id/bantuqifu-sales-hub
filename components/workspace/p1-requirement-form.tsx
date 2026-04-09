'use client'

import { useEffect, useState } from 'react'
import type { Opportunity } from '@/lib/types'
import { mockProducts } from '@/lib/mock-data'

interface P1FormProps {
  opportunity: Opportunity
  onUpdate: (data: Partial<Opportunity>) => void
  onSave: () => Promise<boolean>
  onAdvance: () => Promise<boolean>
}

const DEMAND_SOURCES = ['群聊转入', '老客户转介绍', '渠道', '其他']
const BUSINESS_CATEGORIES = ['签证服务', '财务服务', '准证服务', '公司开办服务', '税务服务']
const BUSINESS_CATEGORY_TO_SERVICE_TYPE: Record<string, Opportunity['serviceType']> = {
  签证服务: 'VISA',
  财务服务: 'FINANCIAL_SERVICES',
  准证服务: 'PERMIT_SERVICES',
  公司开办服务: 'COMPANY_REGISTRATION',
  税务服务: 'TAX_SERVICES',
}
const SERVICE_TYPE_TO_BUSINESS_CATEGORY: Partial<Record<Opportunity['serviceType'], string>> = {
  VISA: '签证服务',
  FINANCIAL_SERVICES: '财务服务',
  PERMIT_SERVICES: '准证服务',
  COMPANY_REGISTRATION: '公司开办服务',
  TAX_SERVICES: '税务服务',
}
const CITIES = ['Jakarta', 'Surabaya', 'Bali', 'Bandung', 'Medan']
const URGENCY_LEVELS = ['普通', '紧急', '特急']

export function P1RequirementForm({ opportunity, onUpdate, onSave, onAdvance }: P1FormProps) {
  const [formData, setFormData] = useState({
    customerName: opportunity.customer.name,
    contactName: '',
    demandSource: '',
    businessCategory: SERVICE_TYPE_TO_BUSINESS_CATEGORY[opportunity.serviceType] || opportunity.serviceTypeLabel || '',
    searchTerm: '',
    showSuggestions: false,
    processingTime: '',
    city: opportunity.destination ?? '',
    passportNo: opportunity.customer.passportNo,
    urgency: '普通',
    requirements: opportunity.requirements ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      customerName: opportunity.customer.name,
      businessCategory: SERVICE_TYPE_TO_BUSINESS_CATEGORY[opportunity.serviceType] || opportunity.serviceTypeLabel || '',
      city: opportunity.destination ?? '',
      passportNo: opportunity.customer.passportNo,
      requirements: opportunity.requirements ?? '',
    }))
  }, [opportunity])

  const filteredProducts = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(formData.searchTerm.toLowerCase()) ||
      p.category.includes(formData.businessCategory)
  )

  const handleProductSelect = (product: typeof mockProducts[0]) => {
    setFormData((prev) => ({
      ...prev,
      searchTerm: product.name,
      showSuggestions: false,
    }))
  }

  const syncPersistableFields = () => {
    const nextServiceType = BUSINESS_CATEGORY_TO_SERVICE_TYPE[formData.businessCategory] || opportunity.serviceType

    onUpdate({
      serviceType: nextServiceType,
      serviceTypeLabel: formData.businessCategory || opportunity.serviceTypeLabel,
      requirements: formData.requirements,
    })
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!opportunity.id) newErrors.opportunityId = '商机ID必填'
    if (!formData.businessCategory) newErrors.businessCategory = '业务分类必填'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return
    syncPersistableFields()
    await onSave()
  }

  const handleAdvance = async () => {
    if (!validateForm()) return
    syncPersistableFields()
    await onAdvance()
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-5 py-2.5">
        <h3 className="text-[13px] font-semibold text-[#111827]">P1: 需求收集</h3>
        <p className="mt-0.5 text-[11px] text-[#9ca3af]">记录客户基础信息与服务意向</p>
      </div>

      {/* Main Content - 两列网格 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl space-y-4">
          {/* 区块 A: 客户与商机基础 */}
          <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
            <h4 className="mb-2 text-[12px] font-semibold text-[#111827]">A. 客户与商机基础</h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {/* 商机 ID - 只读 */}
              <div className="flex items-center gap-1.5">
                <label className="w-[120px] text-[12px] text-[#6b7280]">商机 ID</label>
                <input
                  type="text"
                  value={opportunity.id}
                  disabled
                  className="h-8 flex-1 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] px-2 font-mono text-[12px] text-[#9ca3af]"
                />
              </div>

              {/* 客户名称 */}
              <div className="flex items-center gap-1.5">
                <label className="w-[120px] text-[12px] text-[#6b7280]">客户名称*</label>
                <input
                  type="text"
                  value={formData.customerName}
                  disabled
                  className="h-8 flex-1 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] px-2 text-[12px] text-[#9ca3af]"
                />
              </div>

              {/* 联系人/微信名 */}
              <div className="flex items-center gap-1.5">
                <label className="w-[120px] text-[12px] text-[#6b7280]">联系人</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
                  className="h-8 flex-1 rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
                  placeholder="客户称呼/微信名"
                />
              </div>

              {/* 需求来源 */}
              <div className="flex items-center gap-1.5">
                <label className="w-[120px] text-[12px] text-[#6b7280]">需求来源</label>
                <select className="h-8 flex-1 rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]">
                  <option value="">请选择</option>
                  {DEMAND_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-[#9ca3af]">客户名称与护照号需通过客户资料维护，当前表单只保存商机字段。</p>
            {errors.opportunityId && <p className="mt-1 text-[10px] text-[#dc2626]">{errors.opportunityId}</p>}
          </div>

          {/* 区块 B: 服务意向 */}
          <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
            <h4 className="mb-2 text-[12px] font-semibold text-[#111827]">B. 服务意向</h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {/* 业务分类 */}
              <div className="flex items-center gap-1.5">
                <label className="w-[120px] text-[12px] text-[#6b7280]">业务分类*</label>
                <select
                  value={formData.businessCategory}
                  onChange={(e) => setFormData((prev) => ({ ...prev, businessCategory: e.target.value }))}
                  className={`h-8 flex-1 rounded-sm border px-2 text-[12px] outline-none focus:border-[#2563eb] ${
                    errors.businessCategory
                      ? 'border-[#fca5a5] bg-[#fef2f2] text-[#dc2626]'
                      : 'border-[#e5e7eb] bg-white text-[#111827]'
                  }`}
                >
                  <option value="">请选择</option>
                  {BUSINESS_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 办理时长需求 */}
              <div className="flex items-center gap-1.5">
                <label className="w-[120px] text-[12px] text-[#6b7280]">办理时长</label>
                <input
                  type="text"
                  value={formData.processingTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, processingTime: e.target.value }))}
                  className="h-8 flex-1 rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
                  placeholder="如：7天、2周"
                />
              </div>

              {/* 预选产品 - 模糊搜索 */}
              <div className="relative col-span-2 flex items-center gap-1.5">
                <label className="w-[120px] text-[12px] text-[#6b7280]">预选产品</label>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={formData.searchTerm}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        searchTerm: e.target.value,
                        showSuggestions: true,
                      }))
                    }
                    onBlur={() => setTimeout(() => setFormData((prev) => ({ ...prev, showSuggestions: false })), 200)}
                    onFocus={() => setFormData((prev) => ({ ...prev, showSuggestions: true }))}
                    className="h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
                    placeholder="搜索产品"
                  />
                  {formData.showSuggestions && filteredProducts.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-0.5 max-h-40 overflow-y-auto rounded-sm border border-[#e5e7eb] bg-white shadow-sm">
                      {filteredProducts.slice(0, 5).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleProductSelect(p)}
                          className="flex w-full items-center gap-2 border-b border-[#f3f4f6] px-2 py-1 text-left text-[11px] hover:bg-[#f9fafb]"
                        >
                          <span className="flex-1 truncate font-medium text-[#111827]">{p.name}</span>
                          <span className="text-[#9ca3af]">{p.category}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {errors.businessCategory && <p className="mt-1 text-[10px] text-[#dc2626]">{errors.businessCategory}</p>}
          </div>

          {/* 区块 C: 交付关键参数 */}
          <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
            <h4 className="mb-2 text-[12px] font-semibold text-[#111827]">C. 交付关键参数</h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {/* 入境城市 */}
              <div className="flex items-center gap-1.5">
                <label className="w-[120px] text-[12px] text-[#6b7280]">入境城市</label>
                <select
                  value={formData.city}
                  disabled
                  className="h-8 flex-1 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] px-2 text-[12px] text-[#9ca3af]"
                >
                  <option value="">请选择</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 护照号 */}
              <div className="flex items-center gap-1.5">
                <label className="w-[120px] text-[12px] text-[#6b7280]">护照号</label>
                <input
                  type="text"
                  value={formData.passportNo}
                  disabled
                  className="h-8 flex-1 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] px-2 font-mono text-[12px] text-[#9ca3af]"
                  placeholder="E00000000"
                />
              </div>

              {/* 紧急程度 - Toggle Group */}
              <div className="col-span-2 flex items-center gap-1.5">
                <label className="w-[120px] text-[12px] text-[#6b7280]">紧急程度</label>
                <div className="flex gap-1">
                  {URGENCY_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => setFormData((prev) => ({ ...prev, urgency: level }))}
                      className={`h-8 rounded-sm px-2 text-[12px] font-medium transition-colors ${
                        formData.urgency === level
                          ? 'bg-[#2563eb] text-white'
                          : 'border border-[#e5e7eb] text-[#6b7280] hover:border-[#2563eb]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 区块 D: 备注说明 */}
          <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
            <h4 className="mb-2 text-[12px] font-semibold text-[#111827]">D. 需求详情描述</h4>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}
              placeholder="记录客户具体需求、特殊情况、备注等"
              rows={4}
              className="w-full resize-none rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] leading-relaxed text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
            />
          </div>
        </div>
      </div>

      {/* Footer - 固定工具栏 */}
      <div className="flex items-center justify-between border-t border-[#e5e7eb] bg-[#f9fafb] px-5 py-2">
        <button
          onClick={handleSave}
          className="flex h-8 items-center gap-1.5 rounded-sm border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#374151] hover:border-[#d1d5db]"
        >
          保存草稿
        </button>
        <button
          onClick={handleAdvance}
          className="flex h-8 items-center gap-1.5 rounded-sm bg-[#2563eb] px-3 text-[13px] font-medium text-white hover:bg-[#1d4ed8]"
        >
          确认意向并推进至 P2
        </button>
      </div>
    </div>
  )
}
