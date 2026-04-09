'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { activateOpportunityAction } from '@/app/actions/opportunity-list'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react'

interface ActivationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunity: {
    id: string
    opportunityCode: string
    customer?: { customerName: string } | null
  } | null
  onSuccess?: () => void
}

export default function ActivationModal({
  open,
  onOpenChange,
  opportunity,
  onSuccess,
}: ActivationModalProps) {
  const [p6Date, setP6Date] = useState<Date | undefined>(undefined)
  const [p7Date, setP7Date] = useState<Date | undefined>(undefined)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!p6Date || !p7Date) {
      setError('请设置P6和P7的目标日期')
      return
    }

    if (p7Date < p6Date) {
      setError('P7日期必须大于等于P6日期')
      return
    }

    if (!opportunity) return

    setLoading(true)
    setError('')

    try {
      const result = await activateOpportunityAction(opportunity.id, {
        p6TargetDate: format(p6Date, 'yyyy-MM-dd'),
        p7TargetDate: format(p7Date, 'yyyy-MM-dd'),
        coordinationNotes: notes,
      })

      if (result.success) {
        // Reset form
        setP6Date(undefined)
        setP7Date(undefined)
        setNotes('')
        onOpenChange(false)
        onSuccess?.()
      } else {
        setError(result.error || '激活失败，请重试')
      }
    } catch (err) {
      setError('发生错误，请重试')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>激活商机</DialogTitle>
          <DialogDescription>
            {opportunity?.opportunityCode} - {opportunity?.customer?.customerName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* P6 Target Date */}
          <div className="space-y-2">
            <Label htmlFor="p6-date" className="text-[13px]">
              P6目标日期 (物资收集)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {p6Date ? format(p6Date, 'yyyy-MM-dd') : '选择日期'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={p6Date}
                  onSelect={setP6Date}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* P7 Target Date */}
          <div className="space-y-2">
            <Label htmlFor="p7-date" className="text-[13px]">
              P7目标日期 (最终交付)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {p7Date ? format(p7Date, 'yyyy-MM-dd') : '选择日期'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={p7Date}
                  onSelect={setP7Date}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Coordination Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-[13px]">
              协调备注
            </Label>
            <Textarea
              id="notes"
              placeholder="添加内部协调说明..."
              className="min-h-[100px] resize-none text-[13px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-[12px] text-red-700">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? '激活中...' : '确认激活'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
