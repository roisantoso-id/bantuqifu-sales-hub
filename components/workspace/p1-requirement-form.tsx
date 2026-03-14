'use client'

import type { Opportunity } from '@/lib/types'

interface FormRowProps {
  label: string
  children: React.ReactNode
}

function FormRow({ label, children }: FormRowProps) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3 py-1.5">
      <label className="text-right text-[12px] text-[#6b7280]">{label}</label>
      <div>{children}</div>
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean
}

function FInput({ mono, className = '', ...props }: InputProps) {
  return (
    <input
      className={[
        'h-7 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[13px] text-[#111827]',
        'placeholder-[#9ca3af] outline-none focus:border-[#2563eb]',
        mono ? 'font-mono' : '',
        className,
      ].join(' ')}
      {...props}
    />
  )
}

function FSelect({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={[
        'h-7 w-full rounded-sm border border-[#e5e7eb] bg-white px-2 text-[13px] text-[#111827]',
        'outline-none focus:border-[#2563eb]',
        className,
      ].join(' ')}
      {...props}
    />
  )
}

interface P1FormProps {
  opportunity: Opportunity
  onUpdate: (data: Partial<Opportunity>) => void
}

export function P1RequirementForm({ opportunity, onUpdate }: P1FormProps) {
  const { customer } = opportunity

  return (
    <div className="space-y-0">
      {/* Section: 客户信息 */}
      <div className="mb-4">
        <div className="mb-1 border-b border-[#e5e7eb] pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
            客户信息
          </span>
        </div>
        <FormRow label="客户姓名">
          <FInput defaultValue={customer.name} placeholder="请输入姓名" />
        </FormRow>
        <FormRow label="护照号码">
          <FInput mono defaultValue={customer.passportNo} placeholder="E00000000" />
        </FormRow>
        <FormRow label="联系电话">
          <FInput mono defaultValue={customer.phone} placeholder="手机号码" />
        </FormRow>
        <FormRow label="电子邮件">
          <FInput defaultValue={customer.email} placeholder="email@example.com" />
        </FormRow>
        <FormRow label="微信号">
          <FInput defaultValue={customer.wechat ?? ''} placeholder="（选填）" />
        </FormRow>
      </div>

      {/* Section: 服务需求 */}
      <div>
        <div className="mb-1 border-b border-[#e5e7eb] pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
            服务需求
          </span>
        </div>
        <FormRow label="服务类型">
          <FSelect
            defaultValue={opportunity.serviceType}
            onChange={(e) =>
              onUpdate({
                serviceType: e.target.value as Opportunity['serviceType'],
              })
            }
          >
            <option value="VISA">旅游签证</option>
            <option value="IMMIGRATION">移民服务</option>
            <option value="STUDY">留学申请</option>
            <option value="WORK">工作签证</option>
          </FSelect>
        </FormRow>
        <FormRow label="目的地">
          <FInput
            defaultValue={opportunity.destination ?? ''}
            placeholder="目的国家/地区"
            onChange={(e) => onUpdate({ destination: e.target.value })}
          />
        </FormRow>
        <FormRow label="出行日期">
          <FInput
            mono
            type="date"
            defaultValue={opportunity.travelDate ?? ''}
            onChange={(e) => onUpdate({ travelDate: e.target.value })}
          />
        </FormRow>
        <FormRow label="预估金额">
          <div className="flex items-center gap-1.5">
            <FInput
              mono
              type="number"
              defaultValue={opportunity.estimatedAmount}
              className="w-full"
              onChange={(e) => onUpdate({ estimatedAmount: Number(e.target.value) })}
            />
            <FSelect
              defaultValue={opportunity.currency}
              className="w-20 shrink-0"
              onChange={(e) => onUpdate({ currency: e.target.value })}
            >
              <option value="CNY">CNY</option>
              <option value="USD">USD</option>
              <option value="HKD">HKD</option>
            </FSelect>
          </div>
        </FormRow>
        <FormRow label="负责人">
          <FInput defaultValue={opportunity.assignee} placeholder="负责人姓名" onChange={(e) => onUpdate({ assignee: e.target.value })} />
        </FormRow>
      </div>

      {/* Section: 客户备注 */}
      <div className="mt-4">
        <div className="mb-1 border-b border-[#e5e7eb] pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">
            备注
          </span>
        </div>
        <div className="py-1.5">
          <textarea
            defaultValue={opportunity.requirements ?? ''}
            placeholder="记录客户具体需求、特殊情况..."
            rows={4}
            onChange={(e) => onUpdate({ requirements: e.target.value })}
            className="w-full rounded-sm border border-[#e5e7eb] bg-white p-2 text-[13px] text-[#111827] placeholder-[#9ca3af] outline-none focus:border-[#2563eb] leading-relaxed resize-none"
          />
        </div>
      </div>
    </div>
  )
}
