'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LeadRow } from '@/app/actions/lead'
import { createLeadAction, updateLeadDetailsAction } from '@/app/actions/lead'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

interface LeadEntryFormProps {
  initialData?: LeadRow // 如果传了，就是编辑模式；不传就是新增模式
  onSuccess?: () => void
}

export function LeadEntryForm({ initialData, onSuccess }: LeadEntryFormProps) {
  const router = useRouter()
  const isEditing = !!initialData
  const [loading, setLoading] = useState(false)

  // 初始化表单状态
  const [formData, setFormData] = useState({
    wechatName: initialData?.wechatName || '',
    phone: initialData?.phone || '',
    source: initialData?.source || 'referral',
    category: initialData?.category || 'VISA',
    urgency: initialData?.urgency || 'MEDIUM',
    budgetMin: initialData?.budgetMin?.toString() || '',
    budgetMax: initialData?.budgetMax?.toString() || '',
    initialIntent: initialData?.initialIntent || '',
    notes: initialData?.notes || '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.wechatName) return toast.error('客户微信名称为必填项')

    setLoading(true)
    try {
      if (isEditing && initialData) {
        // 执行修改逻辑 (传入底层 ID)
        const res = await updateLeadDetailsAction(initialData.id, {
          ...formData,
          budgetMin: formData.budgetMin ? Number(formData.budgetMin) : undefined,
          budgetMax: formData.budgetMax ? Number(formData.budgetMax) : undefined,
        })
        if (!res.success) throw new Error(res.error)
        toast.success('线索修改成功')
      } else {
        // 执行新增逻辑
        const res = await createLeadAction({
          ...formData,
          budgetMin: formData.budgetMin ? Number(formData.budgetMin) : undefined,
          budgetMax: formData.budgetMax ? Number(formData.budgetMax) : undefined,
        })
        if (!res) throw new Error('创建失败')
        toast.success('线索创建成功')
      }
      
      router.refresh()
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '操作失败，请重试'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 模块一：联系方式 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#111827]">基础联系信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[12px]">客户微信名/昵称 <span className="text-red-500">*</span></Label>
            <Input 
              value={formData.wechatName} 
              onChange={e => handleChange('wechatName', e.target.value)} 
              placeholder="例如：印尼王总" 
              required 
              className="h-9 text-[13px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[12px]">电话号码 (选填)</Label>
            <Input 
              value={formData.phone} 
              onChange={e => handleChange('phone', e.target.value)} 
              placeholder="+62 812..." 
              className="h-9 text-[13px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[12px]">获客渠道 <span className="text-red-500">*</span></Label>
            <Select value={formData.source} onValueChange={v => handleChange('source', v)}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="referral">转介绍</SelectItem>
                <SelectItem value="website">官网</SelectItem>
                <SelectItem value="facebook">社交媒体</SelectItem>
                <SelectItem value="exhibition">展会</SelectItem>
                <SelectItem value="cold_outreach">陌生拜访</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* 模块二：需求画像 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#111827]">需求画像</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[12px]">意向业务</Label>
            <Select value={formData.category} onValueChange={v => handleChange('category', v)}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VISA">签证服务</SelectItem>
                <SelectItem value="COMPANY_REGISTRATION">公司注册</SelectItem>
                <SelectItem value="TAX_SERVICES">税务服务</SelectItem>
                <SelectItem value="FINANCIAL_SERVICES">财务服务</SelectItem>
                <SelectItem value="PERMIT_SERVICES">许可证服务</SelectItem>
                <SelectItem value="OTHER">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[12px]">紧急程度</Label>
            <Select value={formData.urgency} onValueChange={v => handleChange('urgency', v)}>
              <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">紧急 (3天内需方案)</SelectItem>
                <SelectItem value="MEDIUM">一般 (正常跟进)</SelectItem>
                <SelectItem value="LOW">不急 (观望/比价中)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[12px]">预算下限 (IDR)</Label>
            <Input 
              type="number" 
              value={formData.budgetMin} 
              onChange={e => handleChange('budgetMin', e.target.value)} 
              placeholder="0" 
              className="h-9 text-[13px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[12px]">预算上限 (IDR)</Label>
            <Input 
              type="number" 
              value={formData.budgetMax} 
              onChange={e => handleChange('budgetMax', e.target.value)} 
              placeholder="不限" 
              className="h-9 text-[13px]"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* 模块三：核心诉求 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#111827]">核心诉求</h3>
        <div className="space-y-2">
          <Label className="text-[12px]">客户初始诉求 (客户原话)</Label>
          <Textarea 
            value={formData.initialIntent} 
            onChange={e => handleChange('initialIntent', e.target.value)} 
            placeholder="例如：客户想在雅加达开一家餐饮店，询问注册外资公司的资金门槛..."
            className="min-h-[80px] text-[13px]"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[12px]">销售初判备注</Label>
          <Textarea 
            value={formData.notes} 
            onChange={e => handleChange('notes', e.target.value)} 
            placeholder="仅内部可见。例如：客户性格急躁，对价格敏感..."
            className="min-h-[60px] text-[13px]"
          />
        </div>
      </div>

      {/* 提交按钮 */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? '保存中...' : isEditing ? '保存修改' : '创建线索'}
        </Button>
      </div>
    </form>
  )
}
