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
      <SheetContent side="right" className="w-[480px] max-h-screen overflow-y-auto" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle className="text-[14px] font-semibold">录入新线索</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* 区块 A: 基础身份 */}
          <div className="space-y-3 pb-4 border-b border-[#e5e7eb]">
            <h4 className="text-[12px] font-semibold text-[#111827]">A. 基础身份</h4>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">微信 ID / 群称呼 *</label>
              <input
                type="text"
                value={formData.wechatName}
                onChange={(e) => setFormData((prev) => ({ ...prev, wechatName: e.target.value }))}
                placeholder="如：21231231山海图-王总"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">联系电话</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="手机号 / 微信号"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">线索来源 *</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value as LeadSource }))}
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
              >
                {LEAD_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 区块 B: 业务画像 */}
          <div className="space-y-3 pb-4 border-b border-[#e5e7eb]">
            <h4 className="text-[12px] font-semibold text-[#111827]">B. 业务画像</h4>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">意向分类</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
              >
                <option value="">请选择</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">预算范围 (最低)</label>
                <input
                  type="number"
                  value={formData.budget.min}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budget: { ...prev.budget, min: parseInt(e.target.value) || 0 } }))}
                  placeholder="0"
                  className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">预算范围 (最高)</label>
                <input
                  type="number"
                  value={formData.budget.max}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budget: { ...prev.budget, max: parseInt(e.target.value) || 0 } }))}
                  placeholder="0"
                  className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">币种</label>
              <select
                value={formData.budget.currency}
                onChange={(e) => setFormData((prev) => ({ ...prev, budget: { ...prev.budget, currency: e.target.value as 'CNY' | 'IDR' } }))}
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
              >
                <option value="CNY">RMB</option>
                <option value="IDR">IDR</option>
              </select>
            </div>

            <div className="flex gap-2">
              {URGENCIES.map((u) => (
                <button
                  key={u}
                  onClick={() => setFormData((prev) => ({ ...prev, urgency: u }))}
                  className={`flex-1 h-8 rounded-sm text-[12px] font-medium transition-colors ${
                    formData.urgency === u
                      ? 'bg-[#2563eb] text-white'
                      : 'border border-[#e5e7eb] text-[#6b7280] hover:border-[#2563eb]'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* 区块 C: 跟进上下文 */}
          <div className="space-y-3 pb-4">
            <h4 className="text-[12px] font-semibold text-[#111827]">C. 跟进上下文</h4>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">首条需求备注</label>
              <textarea
                value={formData.initialIntent}
                onChange={(e) => setFormData((prev) => ({ ...prev, initialIntent: e.target.value }))}
                placeholder="记录客户的初步需求、特殊情况等"
                rows={3}
                className="mt-1 w-full rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb] resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">下次跟进计划 * (关键)</label>
              <input
                type="date"
                value={formData.nextFollowDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, nextFollowDate: e.target.value }))}
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
              />
              <p className="mt-1 text-[10px] text-[#9ca3af]">7 天未更新将自动回收至公海池</p>
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">负责人 (选填)</label>
              <input
                type="text"
                value={formData.assignee}
                onChange={(e) => setFormData((prev) => ({ ...prev, assignee: e.target.value }))}
                placeholder="销售人员名字"
                className="mt-1 h-8 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb]"
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">补充备注</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="其他备注信息"
                rows={2}
                className="mt-1 w-full rounded-sm border border-[#e5e7eb] bg-white p-2 text-[12px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb] resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex gap-2 border-t border-[#e5e7eb] pt-4">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 h-8 rounded-sm border border-[#e5e7eb] bg-white text-[12px] font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 h-8 rounded-sm bg-[#2563eb] text-[12px] font-medium text-white hover:bg-[#1d4ed8]"
            >
              录入
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
