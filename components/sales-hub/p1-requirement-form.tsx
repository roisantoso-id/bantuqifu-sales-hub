'use client'

import type { Opportunity } from '@/lib/types'

interface P1RequirementFormProps {
  opportunity: Opportunity
  onUpdate: (data: Partial<Opportunity>) => void
}

export function P1RequirementForm({ opportunity, onUpdate }: P1RequirementFormProps) {
  return (
    <div className="grid grid-cols-[30%_70%] gap-y-2">
      {/* Customer Info Section */}
      <div className="col-span-2 border-b border-[#e5e7eb] pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
        客户信息
      </div>
      
      <label className="py-1 text-[12px] text-[#6b7280]">客户姓名</label>
      <input
        type="text"
        value={opportunity.customer.name}
        readOnly
        className="h-7 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] px-2 text-[13px] text-[#111827]"
      />
      
      <label className="py-1 text-[12px] text-[#6b7280]">护照号</label>
      <input
        type="text"
        value={opportunity.customer.passportNo}
        readOnly
        className="h-7 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] px-2 font-mono text-[13px] text-[#111827]"
      />
      
      <label className="py-1 text-[12px] text-[#6b7280]">联系电话</label>
      <input
        type="text"
        value={opportunity.customer.phone}
        readOnly
        className="h-7 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] px-2 font-mono text-[13px] text-[#111827]"
      />
      
      <label className="py-1 text-[12px] text-[#6b7280]">电子邮箱</label>
      <input
        type="text"
        value={opportunity.customer.email}
        readOnly
        className="h-7 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] px-2 text-[13px] text-[#111827]"
      />
      
      {opportunity.customer.wechat && (
        <>
          <label className="py-1 text-[12px] text-[#6b7280]">微信</label>
          <input
            type="text"
            value={opportunity.customer.wechat}
            readOnly
            className="h-7 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] px-2 text-[13px] text-[#111827]"
          />
        </>
      )}

      {/* Service Requirements Section */}
      <div className="col-span-2 mt-4 border-b border-[#e5e7eb] pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]">
        服务需求
      </div>
      
      <label className="py-1 text-[12px] text-[#6b7280]">服务类型</label>
      <input
        type="text"
        value={opportunity.serviceTypeLabel}
        readOnly
        className="h-7 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] px-2 text-[13px] text-[#111827]"
      />
      
      <label className="py-1 text-[12px] text-[#6b7280]">目的地</label>
      <input
        type="text"
        value={opportunity.destination || ''}
        onChange={(e) => onUpdate({ destination: e.target.value })}
        placeholder="请输入目的地国家/地区"
        className="h-7 rounded-sm border border-[#e5e7eb] bg-white px-2 text-[13px] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
      />
      
      <label className="py-1 text-[12px] text-[#6b7280]">计划日期</label>
      <input
        type="date"
        value={opportunity.travelDate || ''}
        onChange={(e) => onUpdate({ travelDate: e.target.value })}
        className="h-7 rounded-sm border border-[#e5e7eb] bg-white px-2 text-[13px] text-[#111827] focus:border-[#2563eb] focus:outline-none"
      />
      
      <label className="py-1 text-[12px] text-[#6b7280]">预估金额</label>
      <div className="flex items-center gap-1">
        <span className="text-[12px] text-[#6b7280]">¥</span>
        <input
          type="number"
          value={opportunity.estimatedAmount}
          onChange={(e) => onUpdate({ estimatedAmount: Number(e.target.value) })}
          className="h-7 flex-1 rounded-sm border border-[#e5e7eb] bg-white px-2 font-mono text-[13px] text-[#111827] focus:border-[#2563eb] focus:outline-none"
        />
      </div>
      
      <label className="self-start py-1 text-[12px] text-[#6b7280]">需求描述</label>
      <textarea
        value={opportunity.requirements || ''}
        onChange={(e) => onUpdate({ requirements: e.target.value })}
        placeholder="请描述客户的具体需求..."
        rows={4}
        className="rounded-sm border border-[#e5e7eb] bg-white px-2 py-1.5 text-[13px] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
      />
      
      <label className="self-start py-1 text-[12px] text-[#6b7280]">备注</label>
      <textarea
        value={opportunity.notes || ''}
        onChange={(e) => onUpdate({ notes: e.target.value })}
        placeholder="其他备注信息..."
        rows={2}
        className="rounded-sm border border-[#e5e7eb] bg-white px-2 py-1.5 text-[13px] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none"
      />
    </div>
  )
}
