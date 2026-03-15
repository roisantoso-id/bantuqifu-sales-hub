'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import { Loader2, X } from 'lucide-react'
import { createLeadAction } from '@/app/actions/lead'
import { getCustomersAction } from '@/app/actions/customer'
import { toast } from 'sonner'

interface CreateLeadDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const URGENCIES = ['高', '中', '低'] as const

export function CreateLeadDialog({
  isOpen,
  onClose,
  onSuccess,
}: CreateLeadDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    wechatName: '',
    phone: '',
    source: 'referral',
    category: 'VISA',
    budgetMin: '',
    budgetMax: '',
    budgetCurrency: 'CNY',
    urgency: '中' as '高' | '中' | '低',
    initialIntent: '',
    customerId: '',
    nextFollowDate: '',
    assignee: '',
  })

  useEffect(() => {
    if (isOpen) {
      getCustomersAction().then(setCustomers)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!formData.wechatName.trim()) {
      toast.error('请输入微信名/称呼')
      return
    }

    setIsSubmitting(true)

    // Map urgency to API format
    const urgencyMap = { '高': 'HIGH', '中': 'MEDIUM', '低': 'LOW' } as const

    try {
      const result = await createLeadAction({
        wechatName: formData.wechatName,
        phone: formData.phone || undefined,
        source: formData.source,
        category: formData.category || undefined,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
        budgetCurrency: formData.budgetCurrency,
        urgency: urgencyMap[formData.urgency],
        initialIntent: formData.initialIntent || undefined,
        customerId: formData.customerId || undefined,
        notes: undefined,
      })

      if (result) {
        toast.success(`线索创建成功！编号: ${result.leadCode}`)
        // Reset form
        setFormData({
          wechatName: '',
          phone: '',
          source: 'referral',
          category: 'VISA',
          budgetMin: '',
          budgetMax: '',
          budgetCurrency: 'CNY',
          urgency: '中',
          initialIntent: '',
          customerId: '',
          nextFollowDate: '',
          assignee: '',
        })
        onSuccess()
        onClose()
      } else {
        toast.error('创建失败，请重试')
      }
    } catch (error) {
      console.error('Create lead error:', error)
      toast.error('创建失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[360px] p-0 flex flex-col" aria-describedby={undefined}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <h2 className="text-[15px] font-semibold text-[#111827]">录入新线索</h2>
          <button
            onClick={onClose}
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
                    onChange={(e) => handleChange('wechatName', e.target.value)}
                    placeholder="如：21231231山海图-王总"
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">联系电话</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="手机号 / 微信号"
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">线索来源*</label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleChange('source', e.target.value)}
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none focus:border-[#2563eb]"
                  >
                    <option value="wechat">山海图微信群</option>
                    <option value="referral">老客户推荐</option>
                    <option value="facebook">Facebook</option>
                    <option value="website">官网</option>
                    <option value="cold_outreach">冷拉</option>
                    <option value="other">其他</option>
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
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none focus:border-[#2563eb]"
                  >
                    <option value="">请选择</option>
                    <option value="VISA">签证服务</option>
                    <option value="COMPANY_REGISTRATION">公司注册</option>
                    <option value="TAX_SERVICES">税务服务</option>
                    <option value="FINANCIAL_SERVICES">财务服务</option>
                    <option value="PERMIT_SERVICES">许可证服务</option>
                    <option value="OTHER">其他</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-[12px] text-[#6b7280]">预算范围 (最低)</label>
                    <input
                      type="number"
                      value={formData.budgetMin}
                      onChange={(e) => handleChange('budgetMin', e.target.value)}
                      placeholder="0"
                      className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[12px] text-[#6b7280]">预算范围 (最高)</label>
                    <input
                      type="number"
                      value={formData.budgetMax}
                      onChange={(e) => handleChange('budgetMax', e.target.value)}
                      placeholder="0"
                      className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none placeholder-[#9ca3af] focus:border-[#2563eb]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">币种</label>
                  <select
                    value={formData.budgetCurrency}
                    onChange={(e) => handleChange('budgetCurrency', e.target.value)}
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none focus:border-[#2563eb]"
                  >
                    <option value="CNY">RMB</option>
                    <option value="IDR">IDR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>

                {/* 紧急程度 Toggle */}
                <div className="flex overflow-hidden rounded border border-[#e5e7eb]">
                  {URGENCIES.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, urgency: u }))}
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
                    onChange={(e) => handleChange('initialIntent', e.target.value)}
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
                    onChange={(e) => handleChange('nextFollowDate', e.target.value)}
                    className="h-10 w-full border-b border-[#e5e7eb] bg-transparent px-0 text-[13px] text-[#111827] outline-none focus:border-[#2563eb]"
                  />
                  <p className="mt-1 text-[11px] text-[#9ca3af]">7天未更新将自动回收至公海池</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[12px] text-[#6b7280]">负责人 (选填)</label>
                  <input
                    type="text"
                    value={formData.assignee}
                    onChange={(e) => handleChange('assignee', e.target.value)}
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
            disabled={isSubmitting}
            className="h-10 w-full rounded bg-[#2563eb] text-[13px] font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                创建中...
              </>
            ) : (
              '录入线索'
            )}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
