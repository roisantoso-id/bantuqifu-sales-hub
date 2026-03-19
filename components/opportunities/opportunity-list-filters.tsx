'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

const STAGES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']

const STATUS_OPTIONS = [
  { value: 'active', label: '进行中' },
  { value: 'won', label: '已成交' },
  { value: 'lost', label: '已丢失' },
]

const SERVICE_TYPE_OPTIONS = [
  { value: 'VISA', label: '签证服务' },
  { value: 'COMPANY_REGISTRATION', label: '公司注册' },
  { value: 'FACTORY_SETUP', label: '工厂落地' },
  { value: 'TAX_SERVICES', label: '税务服务' },
  { value: 'PERMIT_SERVICES', label: '许可证服务' },
  { value: 'FINANCIAL_SERVICES', label: '财务服务' },
  { value: 'IMMIGRATION', label: '移民服务' },
  { value: 'OTHER', label: '其他' },
]

export function OpportunityListFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset to page 1 on filter change
      params.delete('page')
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      const params = new URLSearchParams(searchParams.toString())
      if (val.trim()) {
        params.set('search', val)
      } else {
        params.delete('search')
      }
      params.delete('page')
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#9ca3af]" />
        <Input
          placeholder="搜索商机编号或客户名称..."
          defaultValue={searchParams.get('search') ?? ''}
          onChange={handleSearch}
          className="pl-8 h-8 w-56 text-[13px]"
        />
      </div>

      {/* Stage filter */}
      <Select
        value={searchParams.get('stage') ?? 'all'}
        onValueChange={(v) => updateParam('stage', v)}
      >
        <SelectTrigger className="h-8 w-32 text-[13px]">
          <SelectValue placeholder="所有阶段" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有阶段</SelectItem>
          {STAGES.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={searchParams.get('status') ?? 'all'}
        onValueChange={(v) => updateParam('status', v)}
      >
        <SelectTrigger className="h-8 w-28 text-[13px]">
          <SelectValue placeholder="所有状态" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有状态</SelectItem>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Service type filter */}
      <Select
        value={searchParams.get('serviceType') ?? 'all'}
        onValueChange={(v) => updateParam('serviceType', v)}
      >
        <SelectTrigger className="h-8 w-36 text-[13px]">
          <SelectValue placeholder="所有业务类型" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">所有业务类型</SelectItem>
          {SERVICE_TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
