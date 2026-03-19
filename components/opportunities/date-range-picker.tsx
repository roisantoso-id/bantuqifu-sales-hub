'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { CalendarIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { DateRange } from 'react-day-picker'

interface DateRangePickerProps {
  from?: string
  to?: string
  onChange: (from: string | null, to: string | null) => void
  placeholder?: string
  className?: string
}

export function DateRangePicker({ from, to, onChange, placeholder = '选择日期范围', className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const range: DateRange = {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  }

  const hasValue = !!(from || to)

  const label = from && to
    ? `${format(new Date(from), 'yyyy/MM/dd')} — ${format(new Date(to), 'yyyy/MM/dd')}`
    : from
    ? `${format(new Date(from), 'yyyy/MM/dd')} —`
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`h-8 text-[12px] justify-start font-normal gap-1.5 ${hasValue ? 'text-[#111827]' : 'text-[#9ca3af]'} ${className ?? ''}`}
        >
          <CalendarIcon className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
          {hasValue && (
            <X
              className="size-3 ml-auto shrink-0 text-[#9ca3af] hover:text-[#374151]"
              onClick={(e) => {
                e.stopPropagation()
                onChange(null, null)
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => {
            onChange(
              r?.from ? format(r.from, 'yyyy-MM-dd') : null,
              r?.to ? format(r.to, 'yyyy-MM-dd') : null,
            )
            if (r?.from && r?.to) setOpen(false)
          }}
          locale={zhCN}
          numberOfMonths={2}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
