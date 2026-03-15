'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createLeadAction } from '@/app/actions/lead'
import { toast } from 'sonner'

interface CustomerOption {
  id: string
  customerName: string
  customerId: string
  customerCode?: string
}

interface LeadFormProps {
  customers: CustomerOption[]
}

const EMPTY_FORM = {
  wechatName: '',
  phone: '',
  source: 'referral',
  category: 'VISA',
  budgetMin: '',
  budgetMax: '',
  budgetCurrency: 'CNY',
  urgency: 'MEDIUM',
  initialIntent: '',
  customerId: '',
  notes: '',
}

export function LeadForm({ customers }: LeadFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.wechatName.trim()) {
      toast.error('请输入微信名/称呼')
      return
    }
    if (!formData.initialIntent.trim()) {
      toast.error('请输入初步意向')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createLeadAction({
        wechatName: formData.wechatName,
        phone: formData.phone || undefined,
        source: formData.source,
        category: formData.category || undefined,
        budgetMin: formData.budgetMin ? parseFloat(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseFloat(formData.budgetMax) : undefined,
        budgetCurrency: formData.budgetCurrency,
        urgency: formData.urgency,
        initialIntent: formData.initialIntent,
        customerId: formData.customerId || undefined,
        notes: formData.notes || undefined,
      })

      if (result) {
        toast.success(`线索创建成功！编号：${result.leadCode}`)
        router.push(`/?nav=leads`)
        router.refresh()
      } else {
        toast.error('创建失败，请重试')
      }
    } catch (error) {
      console.error('[LeadForm] submit error:', error)
      toast.error('创建失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-[#f9fafb]">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-[12px] text-[#6b7280] hover:text-[#111827]"
            onClick={() => router.push('/?nav=leads')}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            线索管理
          </Button>
          <span className="text-[#d1d5db]">/</span>
          <span className="text-[12px] font-medium text-[#111827]">新增线索</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[12px]"
            onClick={() => router.push('/?nav=leads')}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            size="sm"
            className="h-8 bg-[#2563eb] text-[12px] hover:bg-[#1d4ed8]"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                创建中...
              </>
            ) : (
              '创建线索'
            )}
          </Button>
        </div>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4 px-6 py-6">
          {/* Card 1: 基本信息 */}
          <div className="rounded-md border border-[#e5e7eb] bg-white">
            <div className="border-b border-[#f3f4f6] px-5 py-3.5">
              <h2 className="text-[13px] font-semibold text-[#111827]">基本信息</h2>
              <p className="mt-0.5 text-[11px] text-[#6b7280]">联系人的基础资料与初步意向</p>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="wechatName" className="text-[12px] font-medium text-[#374151]">
                    微信名 / 称呼 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="wechatName"
                    value={formData.wechatName}
                    onChange={(e) => handleChange('wechatName', e.target.value)}
                    placeholder="请输入微信名或称呼"
                    className="h-8 text-[12px]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[12px] font-medium text-[#374151]">
                    联系电话
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="手机号码"
                    className="h-8 text-[12px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerId" className="text-[12px] font-medium text-[#374151]">
                  关联客户（可选）
                </Label>
                <Select
                  value={formData.customerId || '_none'}
                  onValueChange={(v) => handleChange('customerId', v === '_none' ? '' : v)}
                >
                  <SelectTrigger id="customerId" className="h-8 text-[12px]">
                    <SelectValue placeholder="选择已有客户（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none" className="text-[12px] text-[#9ca3af]">
                      不关联客户
                    </SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-[12px]">
                        {c.customerName}
                        <span className="ml-1.5 text-[11px] text-[#9ca3af]">
                          {c.customerCode || c.customerId}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="initialIntent" className="text-[12px] font-medium text-[#374151]">
                  初步意向 <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="initialIntent"
                  value={formData.initialIntent}
                  onChange={(e) => handleChange('initialIntent', e.target.value)}
                  placeholder="请描述客户的初步需求或意向..."
                  className="min-h-[80px] text-[12px] leading-relaxed"
                  required
                />
              </div>
            </div>
          </div>

          {/* Card 2: 线索属性 */}
          <div className="rounded-md border border-[#e5e7eb] bg-white">
            <div className="border-b border-[#f3f4f6] px-5 py-3.5">
              <h2 className="text-[13px] font-semibold text-[#111827]">线索属性</h2>
              <p className="mt-0.5 text-[11px] text-[#6b7280]">意向分类、紧迫度、来源渠道及预算信息</p>
            </div>
            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-[12px] font-medium text-[#374151]">
                    意向分类
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => handleChange('category', v)}
                  >
                    <SelectTrigger id="category" className="h-8 text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VISA" className="text-[12px]">签证服务</SelectItem>
                      <SelectItem value="COMPANY_REGISTRATION" className="text-[12px]">公司注册</SelectItem>
                      <SelectItem value="TAX_SERVICES" className="text-[12px]">税务服务</SelectItem>
                      <SelectItem value="FINANCIAL_SERVICES" className="text-[12px]">财务服务</SelectItem>
                      <SelectItem value="PERMIT_SERVICES" className="text-[12px]">许可证服务</SelectItem>
                      <SelectItem value="OTHER" className="text-[12px]">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="urgency" className="text-[12px] font-medium text-[#374151]">
                    紧迫度
                  </Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(v) => handleChange('urgency', v)}
                  >
                    <SelectTrigger id="urgency" className="h-8 text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH" className="text-[12px]">HOT — 高度急迫</SelectItem>
                      <SelectItem value="MEDIUM" className="text-[12px]">WARM — 一般</SelectItem>
                      <SelectItem value="LOW" className="text-[12px]">COLD — 不急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="source" className="text-[12px] font-medium text-[#374151]">
                    来源渠道
                  </Label>
                  <Select
                    value={formData.source}
                    onValueChange={(v) => handleChange('source', v)}
                  >
                    <SelectTrigger id="source" className="h-8 text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="referral" className="text-[12px]">转介绍</SelectItem>
                      <SelectItem value="website" className="text-[12px]">官网</SelectItem>
                      <SelectItem value="facebook" className="text-[12px]">社交媒体</SelectItem>
                      <SelectItem value="exhibition" className="text-[12px]">展会</SelectItem>
                      <SelectItem value="cold_outreach" className="text-[12px]">陌生拜访</SelectItem>
                      <SelectItem value="other" className="text-[12px]">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="budgetCurrency" className="text-[12px] font-medium text-[#374151]">
                    预算币种
                  </Label>
                  <Select
                    value={formData.budgetCurrency}
                    onValueChange={(v) => handleChange('budgetCurrency', v)}
                  >
                    <SelectTrigger id="budgetCurrency" className="h-8 text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNY" className="text-[12px]">CNY — 人民币</SelectItem>
                      <SelectItem value="IDR" className="text-[12px]">IDR — 印尼盾</SelectItem>
                      <SelectItem value="USD" className="text-[12px]">USD — 美元</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="budgetMin" className="text-[12px] font-medium text-[#374151]">
                    预算下限
                  </Label>
                  <Input
                    id="budgetMin"
                    type="number"
                    value={formData.budgetMin}
                    onChange={(e) => handleChange('budgetMin', e.target.value)}
                    placeholder="0"
                    className="h-8 text-[12px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="budgetMax" className="text-[12px] font-medium text-[#374151]">
                    预算上限
                  </Label>
                  <Input
                    id="budgetMax"
                    type="number"
                    value={formData.budgetMax}
                    onChange={(e) => handleChange('budgetMax', e.target.value)}
                    placeholder="不限"
                    className="h-8 text-[12px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 备注 */}
          <div className="rounded-md border border-[#e5e7eb] bg-white">
            <div className="border-b border-[#f3f4f6] px-5 py-3.5">
              <h2 className="text-[13px] font-semibold text-[#111827]">备注</h2>
              <p className="mt-0.5 text-[11px] text-[#6b7280]">其他补充信息</p>
            </div>
            <div className="px-5 py-4">
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="添加备注..."
                className="min-h-[80px] text-[12px] leading-relaxed"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
