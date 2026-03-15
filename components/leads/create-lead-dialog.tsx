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
import { createLeadAction } from '@/app/actions/lead'
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
  const [formData, setFormData] = useState({
    personName: '',
    company: '',
    position: '',
    phone: '',
    email: '',
    wechat: '',
    source: 'REFERRAL',
    sourceDetail: '',
    category: 'VISA',
    urgency: 'WARM',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.personName.trim()) {
      toast.error('请输入联系人姓名')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createLeadAction(formData)

      if (result) {
        toast.success(`线索创建成功！编号: ${result.leadCode}`)
        // Reset form
        setFormData({
          personName: '',
          company: '',
          position: '',
          phone: '',
          email: '',
          wechat: '',
          source: 'REFERRAL',
          sourceDetail: '',
          category: 'VISA',
          urgency: 'WARM',
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
          {/* 联系人信息 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-900">联系人信息</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="personName">
                  姓名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="personName"
                  value={formData.personName}
                  onChange={(e) => handleChange('personName', e.target.value)}
                  placeholder="请输入联系人姓名"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company">公司</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="公司名称"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="position">职位</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  placeholder="职位"
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="电子邮箱"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wechat">微信</Label>
                <Input
                  id="wechat"
                  value={formData.wechat}
                  onChange={(e) => handleChange('wechat', e.target.value)}
                  placeholder="微信号"
                />
              </div>
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
                    <SelectItem value="OTHER">📌 其他</SelectItem>
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
                    <SelectItem value="HOT">🔥 HOT - 急迫</SelectItem>
                    <SelectItem value="WARM">🌡️ WARM - 一般</SelectItem>
                    <SelectItem value="COLD">❄️ COLD - 不急</SelectItem>
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
                    <SelectItem value="REFERRAL">转介绍</SelectItem>
                    <SelectItem value="WEBSITE">官网</SelectItem>
                    <SelectItem value="SOCIAL_MEDIA">社交媒体</SelectItem>
                    <SelectItem value="EXHIBITION">展会</SelectItem>
                    <SelectItem value="COLD_CALL">陌生拜访</SelectItem>
                    <SelectItem value="OTHER">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sourceDetail">来源详情</Label>
                <Input
                  id="sourceDetail"
                  value={formData.sourceDetail}
                  onChange={(e) => handleChange('sourceDetail', e.target.value)}
                  placeholder="具体来源说明"
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
