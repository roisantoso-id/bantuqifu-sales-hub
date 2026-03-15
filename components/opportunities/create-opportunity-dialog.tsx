'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { createOpportunityAction } from '@/app/actions/opportunity'
import { toast } from 'sonner'

interface CreateOpportunityDialogProps {
  customerId: string
  customerName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateOpportunityDialog({
  customerId,
  customerName,
  isOpen,
  onClose,
  onSuccess,
}: CreateOpportunityDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    serviceType: 'VISA',
    estimatedAmount: '',
    currency: 'IDR',
    requirements: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('请输入商机标题')
      return
    }

    if (!formData.estimatedAmount || parseFloat(formData.estimatedAmount) <= 0) {
      toast.error('请输入有效的预估金额')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createOpportunityAction({
        customerId,
        title: formData.title,
        serviceType: formData.serviceType,
        estimatedAmount: parseFloat(formData.estimatedAmount),
        currency: formData.currency,
        requirements: formData.requirements,
      })

      if (result.success && result.data) {
        toast.success(`商机创建成功！编号: ${result.data.opportunityCode}`)
        // Reset form
        setFormData({
          title: '',
          serviceType: 'VISA',
          estimatedAmount: '',
          currency: 'IDR',
          requirements: '',
        })
        onSuccess()
        onClose()
      } else {
        toast.error(result.error || '创建失败，请重试')
      }
    } catch (error) {
      console.error('Create opportunity error:', error)
      toast.error('创建失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>新建商机</DialogTitle>
          <DialogDescription>
            为客户 <span className="font-semibold text-slate-900">{customerName}</span> 创建新商机
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* 商机标题 */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              商机标题 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="例如：工作签证办理"
              required
            />
          </div>

          {/* 服务类型 */}
          <div className="space-y-1.5">
            <Label htmlFor="serviceType">服务类型</Label>
            <Select value={formData.serviceType} onValueChange={(v) => handleChange('serviceType', v)}>
              <SelectTrigger id="serviceType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VISA">🛂 签证服务</SelectItem>
                <SelectItem value="COMPANY_REGISTRATION">🏢 公司注册</SelectItem>
                <SelectItem value="TAX_SERVICES">💰 税务服务</SelectItem>
                <SelectItem value="FINANCIAL_SERVICES">📊 财务服务</SelectItem>
                <SelectItem value="PERMIT_SERVICES">📋 许可证服务</SelectItem>
                <SelectItem value="OTHER">📌 其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 预估金额 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="estimatedAmount">
                预估金额 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="estimatedAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimatedAmount}
                onChange={(e) => handleChange('estimatedAmount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="currency">币种</Label>
              <Select value={formData.currency} onValueChange={(v) => handleChange('currency', v)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IDR">IDR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CNY">CNY</SelectItem>
                  <SelectItem value="SGD">SGD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 需求描述 */}
          <div className="space-y-1.5">
            <Label htmlFor="requirements">需求描述</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => handleChange('requirements', e.target.value)}
              placeholder="描述客户的具体需求..."
              className="min-h-[100px]"
            />
          </div>

          <div className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded p-2">
            💡 提示：商机将自动进入 P1（初步接触）阶段，您可以在商机详情页继续推进
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                创建中...
              </>
            ) : (
              '创建商机'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
