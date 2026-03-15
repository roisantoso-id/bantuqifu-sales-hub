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
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { getCustomersAction, type CustomerRow } from '@/app/actions/customer'
import { convertLeadToOpportunityAction, type LeadRow } from '@/app/actions/lead'
import { toast } from 'sonner'

interface ConvertToOppDialogProps {
  lead: LeadRow | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ConvertToOppDialog({
  lead,
  isOpen,
  onClose,
  onSuccess,
}: ConvertToOppDialogProps) {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 加载系统中的已有客户列表
  useEffect(() => {
    if (isOpen) {
      setIsLoadingCustomers(true)
      getCustomersAction()
        .then((data) => {
          setCustomers(data)
          setIsLoadingCustomers(false)
        })
        .catch((error) => {
          console.error('Failed to load customers:', error)
          toast.error('加载客户列表失败')
          setIsLoadingCustomers(false)
        })
    }
  }, [isOpen])

  const handleConvert = async () => {
    if (!lead) return

    if (!selectedCustomerId) {
      toast.error('请先选择关联客户！')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await convertLeadToOpportunityAction(lead.id, selectedCustomerId)

      if (result.success) {
        toast.success(`转化成功！已生成商机 ${result.opportunityId}`)
        onSuccess()
        onClose()
      } else {
        toast.error(result.error || '转化失败')
      }
    } catch (error) {
      console.error('Convert error:', error)
      toast.error('转化失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!lead) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>将线索转化为商机</DialogTitle>
          <DialogDescription>
            转化后该线索将被锁定只读。请选择或关联一个真实的客户主体（Customer）。
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          {/* 线索信息摘要 */}
          <Alert className="bg-slate-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">线索编号:</span> {lead.leadCode}
                </div>
                <div>
                  <span className="font-medium">联系人:</span> {lead.personName}
                </div>
                <div>
                  <span className="font-medium">意向分类:</span> {lead.category}
                </div>
                {lead.company && (
                  <div>
                    <span className="font-medium">公司:</span> {lead.company}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* 客户选择 */}
          <div className="space-y-2">
            <Label htmlFor="customer-select">
              关联客户主体 <span className="text-red-500">*</span>
            </Label>

            {isLoadingCustomers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                <span className="ml-2 text-sm text-slate-500">加载客户列表...</span>
              </div>
            ) : (
              <Select onValueChange={setSelectedCustomerId} value={selectedCustomerId}>
                <SelectTrigger id="customer-select">
                  <SelectValue placeholder="请选择印尼实体或联系人..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">
                      暂无客户数据，请先创建客户
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.customerName}</span>
                          <span className="text-xs text-slate-500">
                            {customer.customerId} · {customer.level}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}

            <p className="text-xs text-slate-500">
              * 商机将自动继承线索的意向分类和备注信息
            </p>
          </div>

          {/* 提示信息 */}
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-xs">
              转化后，线索将被标记为"已转化"状态，所有字段将变为只读。商机将进入 P1
              初步接触阶段，您可以在商机页面继续推进。
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            onClick={handleConvert}
            disabled={isSubmitting || !selectedCustomerId || isLoadingCustomers}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                转化中...
              </>
            ) : (
              '确认转化并锁定线索'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
