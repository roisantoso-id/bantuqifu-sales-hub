'use client'

import { useState } from 'react'
import type { Opportunity } from '@/lib/types'
import { mockProducts } from '@/lib/mock-data'

interface P1FormProps {
  opportunity: Opportunity
  onUpdate: (data: Partial<Opportunity>) => void
  onAdvance: () => void
}

const DEMAND_SOURCES = ['山海图微信群', '群聊转入', '老客户转介绍', '渠道', '其他']
const BUSINESS_CATEGORIES = ['签证服务', '财务服务', '准证服务', '公司开办服务', '税务服务']
const CITIES = ['Jakarta', 'Surabaya', 'Bali', 'Bandung', 'Medan']
const URGENCY_LEVELS = ['高', '中', '低']

export function P1RequirementForm({ opportunity, onUpdate, onAdvance }: P1FormProps) {
  const [formData, setFormData] = useState({
    customerName: opportunity.customer.name,
    contactPhone: '',
    demandSource: '山海图微信群',
    businessCategory: opportunity.serviceType,
    searchTerm: '',
    showSuggestions: false,
    processingTime: '',
    city: '',
    passportNo: opportunity.customer.passportNo,
    urgency: '中',
    requirements: opportunity.requirements ?? '',
    budgetMin: 0,
    budgetMax: 0,
    currency: 'RMB',
    nextFollowUp: '',
    assignee: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!opportunity.id) newErrors.opportunityId = '商机ID必填'
    if (!formData.businessCategory) newErrors.businessCategory = '业务分类必填'
    if (!formData.nextFollowUp) newErrors.nextFollowUp = '下次跟进计划必填'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdvance = () => {
    if (!validateForm()) return
    onUpdate({
      customer: {
        ...opportunity.customer,
        name: formData.customerName,
      },
      destination: formData.city,
      requirements: formData.requirements,
    })
    onAdvance()
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-6 py-4">
        <h3 className="text-[15px] font-semibold text-[#111827]">录入新线索</h3>
      </div>

      {/* Main Content - 单列布局，标签在上 */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-6">
          {/* 区块 A: 基础身份 */}
          <div>
            <h4 className="mb-4 text-[13px] font-semibold text-[#111827]">A. 基础身份</h4>
            <div className="space-y-4">
              {/* 微信 ID / 群称呼 */}
              <div>
                <label className="mb-1.5 block text-[12px] text-[#6b7280]">微信 ID / 群称呼*</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                  placeholder="如：21231231山海图-王总"
                  className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                />
              </div>

              {/* 联系电话 */}
              <div>
                <label className="mb-1.5 block text-[12px] text-[#6b7280]">联系电话</label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                  placeholder="手机号 / 微信号"
                  className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                />
              </div>

              {/* 线索来源 */}
              <div>
                <label className="mb-1.5 block text-[12px] text-[#6b7280]">线索来源*</label>
                <select
                  value={formData.demandSource}
                  onChange={(e) => setFormData((prev) => ({ ...prev, demandSource: e.target.value }))}
                  className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none focus:border-[#2563eb]"
                >
                  {DEMAND_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 区块 B: 业务画像 */}
          <div>
            <h4 className="mb-4 text-[13px] font-semibold text-[#111827]">B. 业务画像</h4>
            <div className="space-y-4">
              {/* 意向分类 */}
              <div>
                <label className="mb-1.5 block text-[12px] text-[#6b7280]">意向分类</label>
                <select
                  value={formData.businessCategory}
                  onChange={(e) => setFormData((prev) => ({ ...prev, businessCategory: e.target.value }))}
                  className={`h-10 w-full border-b bg-transparent px-0 text-[13px] outline-none focus:border-[#2563eb] ${
                    errors.businessCategory
                      ? 'border-[#dc2626] text-[#dc2626]'
                      : 'border-[#e5e7eb] text-[#111827]'
                  }`}
                >
                  <option value="">请选择</option>
                  {BUSINESS_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.businessCategory && <p className="mt-1 text-[11px] text-[#dc2626]">{errors.businessCategory}</p>}
              </div>

              {/* 预算范围 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">预算范围 (最低)</label>
                  <input
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => setFormData((prev) => ({ ...prev, budgetMin: Number(e.target.value) }))}
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">预算范围 (最高)</label>
                  <input
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => setFormData((prev) => ({ ...prev, budgetMax: Number(e.target.value) }))}
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                  />
                </div>
              </div>

              {/* 币种 */}
              <div>
                <label className="mb-1.5 block text-[12px] text-[#6b7280]">币种</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                  className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none focus:border-[#2563eb]"
                >
                  <option value="RMB">RMB</option>
                  <option value="USD">USD</option>
                  <option value="IDR">IDR</option>
                </select>
              </div>

              {/* 紧急程度 - Toggle Group */}
              <div className="flex overflow-hidden rounded border border-[#e5e7eb]">
                {URGENCY_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, urgency: level }))}
                    className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
                      formData.urgency === level
                        ? 'bg-[#2563eb] text-white'
                        : 'bg-white text-[#6b7280] hover:bg-[#f9fafb]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 区块 C: 跟进上下文 */}
          <div>
            <h4 className="mb-4 text-[13px] font-semibold text-[#111827]">C. 跟进上下文</h4>
            <div className="space-y-4">
              {/* 首条需求备注 */}
              <div>
                <label className="mb-1.5 block text-[12px] text-[#6b7280]">首条需求备注</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}
                  placeholder="记录客户的初步需求、特殊情况等"
                  rows={3}
                  className="w-full border-b border-[#e5e7eb] bg-transparent px-0 py-2 text-[13px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb] resize-none leading-relaxed"
                />
              </div>

              {/* 下次跟进计划 */}
              <div>
                <label className="mb-1.5 block text-[12px] text-[#6b7280]">下次跟进计划* (关键)</label>
                <input
                  type="date"
                  value={formData.nextFollowUp}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nextFollowUp: e.target.value }))}
                  className={`h-10 w-full border-b bg-transparent px-0 text-[13px] outline-none focus:border-[#2563eb] ${
                    errors.nextFollowUp ? 'border-[#dc2626]' : 'border-[#e5e7eb]'
                  } text-[#111827]`}
                />
                <p className="mt-1 text-[11px] text-[#9ca3af]">7天未更新将自动回收至公海池</p>
                {errors.nextFollowUp && <p className="mt-1 text-[11px] text-[#dc2626]">{errors.nextFollowUp}</p>}
              </div>

              {/* 负责人 */}
              <div>
                <label className="mb-1.5 block text-[12px] text-[#6b7280]">负责人 (选填)</label>
                <input
                  type="text"
                  value={formData.assignee}
                  onChange={(e) => setFormData((prev) => ({ ...prev, assignee: e.target.value }))}
                  placeholder="销售人员名字"
                  className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - 固定工具栏 */}
      <div className="border-t border-[#e5e7eb] bg-[#f9fafb] px-6 py-3 flex items-center justify-between">
        <button className="flex h-9 items-center gap-1.5 rounded border border-[#e5e7eb] bg-white px-4 text-[13px] text-[#374151] hover:border-[#d1d5db]">
          保存草稿
        </button>
        <button
          onClick={handleAdvance}
          className="flex h-9 items-center gap-1.5 rounded bg-[#2563eb] px-4 text-[13px] font-medium text-white hover:bg-[#1d4ed8]"
        >
          确认意向并推进至 P2
        </button>
      </div>
    </div>
  )
}
