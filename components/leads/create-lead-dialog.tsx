'use client'

import { useState, useEffect } from 'react'
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
import { createLeadAction } from '@/app/actions/lead'
import { getCustomersAction } from '@/app/actions/customer'
import { toast } from 'sonner'

interface CreateLeadDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

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
    urgency: 'MEDIUM',
    initialIntent: '',
    customerId: '',
    notes: '',
  })

  useEffect(() => {
    if (isOpen) {
      getCustomersAction().then(setCustomers)
    }
  }, [isOpen])

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
          urgency: 'MEDIUM',
          initialIntent: '',
          customerId: '',
          notes: '',
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增线索</DialogTitle>
          <DialogDescription>
            填写线索基本信息，创建后将自动分配给您
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* 基本信息 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-900">基本信息</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wechatName">
                  微信名/称呼 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="wechatName"
                  value={formData.wechatName}
                  onChange={(e) => handleChange('wechatName', e.target.value)}
                  placeholder="请输入微信名或称呼"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">电话</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="联系电话"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customerId">关联客户（可选）</Label>
              <Select
                value={formData.customerId || undefined}
                onValueChange={(v) => handleChange('customerId', v === 'none' ? '' : v)}
              >
                <SelectTrigger id="customerId">
                  <SelectValue placeholder="选择客户（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不关联客户</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.customerName} ({customer.customerId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="initialIntent">
                初步意向 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="initialIntent"
                value={formData.initialIntent}
                onChange={(e) => handleChange('initialIntent', e.target.value)}
                placeholder="请描述客户的初步意向"
                className="min-h-[80px]"
                required
              />
            </div>
          </div>

          {/* 线索信息 */}
          <div className="space-y-3 pt-2 border-t">
            <h3 className="text-sm font-medium text-slate-900">线索信息</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category">意向分类</Label>
                <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VISA">🛂 签证服务</SelectItem>
                    <SelectItem value="COMPANY_REGISTRATION">🏢 公司注册</SelectItem>
                    <SelectItem value="TAX_SERVICES">💰 税务服务</SelectItem>
                    <SelectItem value="FINANCIAL_SERVICES">📊 财务服务</SelectItem>
                    <SelectItem value="PERMIT_SERVICES">📋 许可证服务</SelectItem>
                    <SelectItem value="referral">📌 其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="urgency">紧迫度</Label>
                <Select value={formData.urgency} onValueChange={(v) => handleChange('urgency', v)}>
                  <SelectTrigger id="urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">🔥 HOT - 急迫</SelectItem>
                    <SelectItem value="MEDIUM">🌡️ WARM - 一般</SelectItem>
                    <SelectItem value="LOW">❄️ COLD - 不急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="source">来源渠道</Label>
                <Select value={formData.source} onValueChange={(v) => handleChange('source', v)}>
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referral">转介绍</SelectItem>
                    <SelectItem value="website">官网</SelectItem>
                    <SelectItem value="facebook">社交媒体</SelectItem>
                    <SelectItem value="facebook">展会</SelectItem>
                    <SelectItem value="cold_outreach">陌生拜访</SelectItem>
                    <SelectItem value="referral">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="budgetCurrency">预算币种</Label>
                <Select value={formData.budgetCurrency} onValueChange={(v) => handleChange('budgetCurrency', v)}>
                  <SelectTrigger id="budgetCurrency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNY">CNY - 人民币</SelectItem>
                    <SelectItem value="IDR">IDR - 印尼盾</SelectItem>
                    <SelectItem value="USD">USD - 美元</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="budgetMin">预算最小值</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => handleChange('budgetMin', e.target.value)}
                  placeholder="最小预算"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="budgetMax">预算最大值</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => handleChange('budgetMax', e.target.value)}
                  placeholder="最大预算"
                />
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-1.5 pt-2 border-t">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="添加备注信息..."
              className="min-h-[80px]"
            />
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
              '创建线索'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
