'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Lead, LeadSource, LeadUrgency, DiscardReason } from '@/lib/types'
import { X } from 'lucide-react'

interface LeadEntryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialData?: Partial<Lead>
}

const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'wechat', label: '山海图微信群' },
  { value: 'referral', label: '老客户推荐' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: '官网' },
  { value: 'cold_outreach', label: '冷拉' },
]

const CATEGORIES = ['签证服务', '公司注册', '财务服务', '准证服务', '税务服务']
const URGENCIES: LeadUrgency[] = ['高', '中', '低']
const CURRENCIES = ['CNY', 'IDR'] as const
const DISCARD_REASONS: DiscardReason[] = ['无法联系', '需求不匹配', '销售能力有限', '其他']

export function LeadEntryForm({ open, onOpenChange, onSubmit, initialData }: LeadEntryFormProps) {
  const [formData, setFormData] = useState({
    wechatName: initialData?.wechatName ?? '',
    phone: initialData?.phone ?? '',
    source: initialData?.source ?? ('wechat' as LeadSource),
    category: initialData?.category ?? '',
    budget: initialData?.budget ?? { min: 0, max: 0, currency: 'CNY' as const },
    urgency: initialData?.urgency ?? ('中' as LeadUrgency),
    initialIntent: initialData?.initialIntent ?? '',
    nextFollowDate: initialData?.nextFollowDate ?? '',
    assignee: initialData?.assignee ?? '',
    notes: initialData?.notes ?? '',
  })

  const handleSubmit = () => {
    if (!formData.wechatName.trim()) {
      alert('微信名/群称呼不能为空')
      return
    }
    onSubmit({
      wechatName: formData.wechatName,
      phone: formData.phone,
      source: formData.source,
      category: formData.category,
      budget: formData.budget.min > 0 || formData.budget.max > 0 ? formData.budget : undefined,
      urgency: formData.urgency,
      initialIntent: formData.initialIntent,
      nextFollowDate: formData.nextFollowDate,
      assignee: formData.assignee,
      notes: formData.notes,
      status: 'new',
      lastActionAt: new Date().toISOString(),
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[360px] p-0 flex flex-col" aria-describedby={undefined}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <h2 className="text-[15px] font-semibold text-[#111827]">录入新线索</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded p-1 text-[#9ca3af] hover:bg-[#f3f4f6] hover:text-[#6b7280]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {/* 区块 A: 基础身份 */}
            <div>
              <h4 className="mb-4 text-[13px] font-semibold text-[#111827]">A. 基础身份</h4>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">微信 ID / 群称呼*</label>
                  <input
                    type="text"
                    value={formData.wechatName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, wechatName: e.target.value }))}
                    placeholder="如：21231231山海图-王总"
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">联系电话</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="手机号 / 微信号"
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">线索来源*</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value as LeadSource }))}
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none focus:border-[#2563eb]"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
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
                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">意向分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none focus:border-[#2563eb]"
                  >
                    <option value="">请选择</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-[12px] text-[#6b7280]">预算范围 (最低)</label>
                    <input
                      type="number"
                      value={formData.budget.min || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, budget: { ...prev.budget, min: parseInt(e.target.value) || 0 } }))}
                      placeholder="0"
                      className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] text-[#6b7280]">预算范围 (最高)</label>
                    <input
                      type="number"
                      value={formData.budget.max || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, budget: { ...prev.budget, max: parseInt(e.target.value) || 0 } }))}
                      placeholder="0"
                      className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">币种</label>
                  <select
                    value={formData.budget.currency}
                    onChange={(e) => setFormData((prev) => ({ ...prev, budget: { ...prev.budget, currency: e.target.value as 'CNY' | 'IDR' } }))}
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none focus:border-[#2563eb]"
                  >
                    <option value="CNY">RMB</option>
                    <option value="IDR">IDR</option>
                  </select>
                </div>

                {/* 紧急程度 Toggle */}
                <div className="flex overflow-hidden rounded border border-[#e5e7eb]">
                  {URGENCIES.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, urgency: u }))}
                      className={`flex-1 py-2.5 text-[13px] font-medium transition-colors ${
                        formData.urgency === u
                          ? 'bg-[#2563eb] text-white'
                          : 'bg-white text-[#6b7280] hover:bg-[#f9fafb]'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 区块 C: 跟进上下文 */}
            <div>
              <h4 className="mb-4 text-[13px] font-semibold text-[#111827]">C. 跟进上下文</h4>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">首条需求备注</label>
                  <textarea
                    value={formData.initialIntent}
                    onChange={(e) => setFormData((prev) => ({ ...prev, initialIntent: e.target.value }))}
                    placeholder="记录客户的初步需求、特殊情况等"
                    rows={3}
                    className="w-full border-b border-[#e5e7eb] bg-transparent px-0 py-2 text-[13px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb] resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">下次跟进计划* (关键)</label>
                  <input
                    type="date"
                    value={formData.nextFollowDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nextFollowDate: e.target.value }))}
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none focus:border-[#2563eb]"
                  />
                  <p className="mt-1 text-[11px] text-[#9ca3af]">7天未更新将自动回收至公海池</p>
                </div>

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

        {/* Footer */}
        <div className="border-t border-[#e5e7eb] bg-white px-6 py-4">
          <button
            onClick={handleSubmit}
            className="h-10 w-full rounded bg-[#2563eb] text-[13px] font-medium text-white hover:bg-[#1d4ed8]"
          >
            录入线索
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
