'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { InteractionRow } from '@/app/actions/interaction'

export type InteractionType = InteractionRow['type']

export interface InteractionFormValues {
  type: InteractionType
  content: string
  nextAction: string
  nextActionDate: string | null
}

interface InteractionFormProps {
  onSubmit: (values: InteractionFormValues) => Promise<boolean | void>
  loading?: boolean
  disabled?: boolean
  className?: string
  submitLabel?: string
  defaultValues?: Partial<InteractionFormValues>
}

const INTERACTION_TYPE_OPTIONS: Array<{ value: InteractionType; label: string }> = [
  { value: 'NOTE', label: '备注' },
  { value: 'CALL', label: '电话' },
  { value: 'VISIT', label: '拜访' },
  { value: 'MEETING', label: '会议' },
  { value: 'EMAIL', label: '邮件' },
  { value: 'STAGE_CHANGE', label: '阶段变更' },
  { value: 'SYSTEM', label: '系统' },
]

const EMPTY_VALUES: InteractionFormValues = {
  type: 'NOTE',
  content: '',
  nextAction: '',
  nextActionDate: null,
}

export function InteractionForm({
  onSubmit,
  loading = false,
  disabled = false,
  className,
  submitLabel = '提交记录',
  defaultValues,
}: InteractionFormProps) {
  const mergedDefaults = useMemo<InteractionFormValues>(
    () => ({
      ...EMPTY_VALUES,
      ...defaultValues,
    }),
    [defaultValues]
  )

  const [values, setValues] = useState<InteractionFormValues>(mergedDefaults)
  const [error, setError] = useState('')

  useEffect(() => {
    setValues(mergedDefaults)
  }, [mergedDefaults])

  const selectedDate = values.nextActionDate ? new Date(values.nextActionDate) : undefined

  const resetForm = () => {
    setValues(mergedDefaults)
    setError('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (disabled || loading) {
      return
    }

    const trimmedContent = values.content.trim()
    const trimmedNextAction = values.nextAction.trim()

    if (!trimmedContent) {
      setError('请填写记录内容')
      return
    }

    setError('')

    const result = await onSubmit({
      type: values.type,
      content: trimmedContent,
      nextAction: trimmedNextAction,
      nextActionDate: values.nextActionDate,
    })

    if (result !== false) {
      resetForm()
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-slate-500">交互类型</label>
        <Select
          value={values.type}
          onValueChange={(type) => setValues((current) => ({ ...current, type: type as InteractionType }))}
          disabled={disabled || loading}
        >
          <SelectTrigger className="h-9 w-full text-xs">
            <SelectValue placeholder="请选择交互类型" />
          </SelectTrigger>
          <SelectContent>
            {INTERACTION_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-slate-500">记录内容</label>
        <Textarea
          value={values.content}
          onChange={(event) => setValues((current) => ({ ...current, content: event.target.value }))}
          disabled={disabled || loading}
          placeholder="补充本次沟通的关键信息、结果或结论"
          className="min-h-[96px] resize-none text-xs leading-5"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-slate-500">下一步计划</label>
        <Input
          value={values.nextAction}
          onChange={(event) => setValues((current) => ({ ...current, nextAction: event.target.value }))}
          disabled={disabled || loading}
          placeholder="例如：发送报价单 / 约下次会议"
          className="h-9 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-slate-500">下次跟进时间</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || loading}
              className={cn(
                'h-9 w-full justify-between text-xs font-normal',
                !selectedDate && 'text-slate-400'
              )}
            >
              {selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '选择日期'}
              <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setValues((current) => ({
                  ...current,
                  nextActionDate: date ? format(date, 'yyyy-MM-dd') : null,
                }))
              }}
              initialFocus
            />
            <div className="flex items-center justify-between border-t px-3 py-2">
              <span className="text-[11px] text-slate-500">可选，便于安排下一次跟进</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px]"
                onClick={() => setValues((current) => ({ ...current, nextActionDate: null }))}
              >
                清除
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">{error}</div>}

      <Button type="submit" disabled={disabled || loading} className="h-9 w-full text-xs font-medium">
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            提交中...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}
