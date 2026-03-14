'use client'

import { useState, useMemo } from 'react'
import { AlertCircle, ChevronDown, Calendar } from 'lucide-react'
import type { Opportunity, Lead, ActionLog, Currency } from '@/lib/types'

interface MyDashboardProps {
  opportunities: Opportunity[]
  leads: Lead[]
  actionLogs: Record<string, ActionLog[]>
  assignee: string
  userName: string
}

const EXCHANGE_RATES: Record<Currency, number> = { CNY: 1, IDR: 0.00048 }

// 日期预设计算
const getDatePresets = () => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  return {
    today: { start: today, end: now, label: '今日' },
    week: { start: weekStart, end: now, label: '本周' },
    month: { start: monthStart, end: now, label: '本月' },
    quarter: { start: quarterStart, end: now, label: '上季度' },
    ytd: { start: yearStart, end: now, label: '年度至今' },
  }
}

interface TrendPoint {
  date: string
  leads: number
  p4: number // 签约总额
  p5: number // 实收回款
}

export function MyDashboard({ opportunities, leads, actionLogs, assignee, userName }: MyDashboardProps) {
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('CNY')
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start: monthStart, end: now }
  })
  const [isLoading, setIsLoading] = useState(false)
  const presets = getDatePresets()

  // Filter by current user
  const myLeads = leads.filter((l) => l.assignee === assignee)
  const myOpportunities = opportunities.filter((o) => o.assignee === assignee)

  // Date range filtering
  const filteredLeads = useMemo(() => {
    return myLeads.filter((l) => {
      const createdDate = new Date(l.createdAt)
      return createdDate >= dateRange.start && createdDate <= dateRange.end
    })
  }, [myLeads, dateRange])

  const filteredOpportunities = useMemo(() => {
    return myOpportunities.filter((o) => {
      const createdDate = new Date(o.createdAt)
      return createdDate >= dateRange.start && createdDate <= dateRange.end
    })
  }, [myOpportunities, dateRange])

  // KPI 1: 活跃线索（带环比）
  const activeLeads = useMemo(() => {
    return filteredLeads.filter((l) => l.status !== 'discarded' && l.status !== 'public_pool' && l.status !== 'no_interest')
  }, [filteredLeads])

  const urgentLeads = useMemo(() => {
    return activeLeads.filter((l) => l.urgency === '高')
  }, [activeLeads])

  const prevPeriodLeads = useMemo(() => {
    const daysDiff = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    const prevStart = new Date(dateRange.start.getTime() - daysDiff * 24 * 60 * 60 * 1000)
    const prevEnd = dateRange.start
    return myLeads.filter((l) => {
      const createdDate = new Date(l.createdAt)
      return createdDate >= prevStart && createdDate <= prevEnd && l.status !== 'discarded' && l.status !== 'public_pool' && l.status !== 'no_interest'
    })
  }, [myLeads, dateRange])

  const leadsChange = prevPeriodLeads.length > 0 ? Math.round(((activeLeads.length - prevPeriodLeads.length) / prevPeriodLeads.length) * 100) : 0

  // KPI 2: 签约总额 (P4)
  const p4Total = useMemo(() => {
    return filteredOpportunities.reduce((sum, opp) => {
      if (opp.stageId === 'P4' && opp.estimatedAmount) {
        const inCNY = opp.estimatedAmount / EXCHANGE_RATES[opp.currency]
        return sum + inCNY * EXCHANGE_RATES[displayCurrency]
      }
      return sum
    }, 0)
  }, [filteredOpportunities, displayCurrency])

  const prevPeriodP4 = useMemo(() => {
    const daysDiff = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    const prevStart = new Date(dateRange.start.getTime() - daysDiff * 24 * 60 * 60 * 1000)
    const prevEnd = dateRange.start
    return myOpportunities.filter((o) => {
      const createdDate = new Date(o.createdAt)
      return createdDate >= prevStart && createdDate <= prevEnd && o.stageId === 'P4' && o.estimatedAmount
    }).reduce((sum, opp) => {
      const inCNY = opp.estimatedAmount / EXCHANGE_RATES[opp.currency]
      return sum + inCNY * EXCHANGE_RATES[displayCurrency]
    }, 0)
  }, [myOpportunities, dateRange, displayCurrency])

  const p4Change = prevPeriodP4 > 0 ? Math.round(((p4Total - prevPeriodP4) / prevPeriodP4) * 100) : 0

  // KPI 3: 实收回款 (P5/P8)
  const receiptsTotal = useMemo(() => {
    return filteredOpportunities.reduce((sum, opp) => {
      if ((opp.stageId === 'P5' || opp.stageId === 'P8') && opp.p5Data?.receivedAmount) {
        const inCNY = opp.p5Data.receivedAmount / EXCHANGE_RATES[opp.currency]
        return sum + inCNY * EXCHANGE_RATES[displayCurrency]
      }
      return sum
    }, 0)
  }, [filteredOpportunities, displayCurrency])

  const prevPeriodReceipts = useMemo(() => {
    const daysDiff = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)
    const prevStart = new Date(dateRange.start.getTime() - daysDiff * 24 * 60 * 60 * 1000)
    const prevEnd = dateRange.start
    return myOpportunities.filter((o) => {
      const createdDate = new Date(o.createdAt)
      return createdDate >= prevStart && createdDate <= prevEnd && (o.stageId === 'P5' || o.stageId === 'P8') && o.p5Data?.receivedAmount
    }).reduce((sum, opp) => {
      const inCNY = opp.p5Data?.receivedAmount || 0 / EXCHANGE_RATES[opp.currency]
      return sum + inCNY * EXCHANGE_RATES[displayCurrency]
    }, 0)
  }, [myOpportunities, dateRange, displayCurrency])

  const receiptsChange = prevPeriodReceipts > 0 ? Math.round(((receiptsTotal - prevPeriodReceipts) / prevPeriodReceipts) * 100) : 0

  // KPI 4: 交付负载
  const p7Count = filteredOpportunities.filter((o) => o.stageId === 'P7').length
  const avgP7Progress = useMemo(() => {
    const p7Opps = filteredOpportunities.filter((o) => o.stageId === 'P7')
    if (p7Opps.length === 0) return 0
    const totalProgress = p7Opps.reduce((sum, opp) => {
      if (opp.p7Data?.progressPoints) {
        const completed = opp.p7Data.progressPoints.filter((p) => p.status === 'completed').length
        return sum + (completed / opp.p7Data.progressPoints.length) * 100
      }
      return sum
    }, 0)
    return Math.round(totalProgress / p7Opps.length)
  }, [filteredOpportunities])

  // 转化漏斗数据
  const funnelData = useMemo(() => {
    const counts = {
      leads: activeLeads.length,
      p1: filteredOpportunities.filter((o) => o.stageId === 'P1').length,
      p3: filteredOpportunities.filter((o) => o.stageId === 'P3').length,
      p5: filteredOpportunities.filter((o) => o.stageId === 'P5').length,
      p8: filteredOpportunities.filter((o) => o.stageId === 'P8').length,
    }
    const max = Math.max(...Object.values(counts))
    return Object.entries(counts).map(([key, value]) => ({
      label: key === 'leads' ? '线索' : key.toUpperCase(),
      value,
      width: max > 0 ? (value / max) * 100 : 0,
      conversionRate: counts.leads > 0 ? Math.round((value / counts.leads) * 100) : 0,
    }))
  }, [activeLeads, filteredOpportunities])

  // 业绩走势数据（按日聚合）
  const trendData = useMemo(() => {
    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
    const points: TrendPoint[] = []
    
    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(dateRange.start)
      currentDate.setDate(currentDate.getDate() + i)
      const dateStr = currentDate.toISOString().split('T')[0]
      
      const dayLeads = filteredLeads.filter((l) => l.createdAt.startsWith(dateStr)).length
      const dayP4 = filteredOpportunities.filter((o) => o.stageId === 'P4' && o.createdAt.startsWith(dateStr)).reduce((sum, o) => {
        const inCNY = (o.estimatedAmount || 0) / EXCHANGE_RATES[o.currency]
        return sum + inCNY * EXCHANGE_RATES[displayCurrency]
      }, 0)
      const dayP5 = filteredOpportunities.filter((o) => (o.stageId === 'P5' || o.stageId === 'P8') && o.createdAt.startsWith(dateStr)).reduce((sum, o) => {
        const inCNY = (o.p5Data?.receivedAmount || 0) / EXCHANGE_RATES[o.currency]
        return sum + inCNY * EXCHANGE_RATES[displayCurrency]
      }, 0)
      
      points.push({ date: dateStr, leads: dayLeads, p4: dayP4, p5: dayP5 })
    }
    return points
  }, [filteredLeads, filteredOpportunities, dateRange, displayCurrency])

  // 待办事项（不受日期筛选影响）
  const overdueLead = myLeads.find((l) => l.nextFollowDate && new Date(l.nextFollowDate) < new Date())
  const p3LowPrice = myOpportunities.find((o) => o.stageId === 'P3' && (o.estimatedAmount || 0) < 10000)

  const handleDatePreset = (preset: any) => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 300)
    setDateRange(preset)
  }

  const dateRangeStr = `${dateRange.start.toISOString().split('T')[0]} ~ ${dateRange.end.toISOString().split('T')[0]}`

  return (
    <div className="flex h-full flex-col overflow-auto bg-white">
      {/* Global Toolbar */}
      <div className="border-b border-[#e5e7eb] px-5 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-[#111827]">我的数据</h2>
            <p className="mt-0.5 text-[11px] text-[#9ca3af]">用户：{userName}</p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-sm border border-[#e5e7eb] bg-[#fafbfc] px-2 py-1">
              <Calendar size={13} className="text-[#9ca3af]" />
              <span className="font-mono text-[11px] text-[#374151]">{dateRangeStr}</span>
            </div>
            
            {/* Presets Dropdown */}
            <div className="relative group">
              <button className="flex h-7 items-center gap-1 rounded-sm border border-[#e5e7eb] bg-white px-2 text-[11px] font-medium text-[#374151] hover:bg-[#f9fafb]">
                预设
                <ChevronDown size={12} />
              </button>
              <div className="absolute right-0 top-7 hidden gap-1 rounded-sm border border-[#e5e7eb] bg-white p-1 shadow-sm group-hover:flex flex-col z-10">
                {Object.entries(presets).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handleDatePreset(preset)}
                    className="whitespace-nowrap rounded-sm px-2 py-1 text-[11px] text-[#374151] hover:bg-[#f3f4f6]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency Toggle */}
            <button
              onClick={() => setDisplayCurrency(displayCurrency === 'CNY' ? 'IDR' : 'CNY')}
              className="rounded-sm border border-[#e5e7eb] bg-white px-2 py-1 text-[11px] font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              {displayCurrency}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3 border-b border-[#e5e7eb] px-5 py-3 bg-[#fafbfc]">
        {/* KPI 1: 活跃线索 */}
        <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
          {isLoading ? (
            <div className="h-16 animate-pulse bg-[#f3f4f6] rounded-sm" />
          ) : (
            <>
              <div className="text-[11px] text-[#9ca3af] font-medium">活跃线索</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-[18px] font-semibold text-[#111827]">{activeLeads.length}</span>
                <span className={`text-[11px] font-medium ${leadsChange >= 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}>
                  {leadsChange > 0 ? '+' : ''}{leadsChange}%
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-[#6b7280]">紧急: <span className="font-semibold text-[#dc2626]">{urgentLeads.length}</span></div>
            </>
          )}
        </div>

        {/* KPI 2: 签约总额 */}
        <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
          {isLoading ? (
            <div className="h-16 animate-pulse bg-[#f3f4f6] rounded-sm" />
          ) : (
            <>
              <div className="text-[11px] text-[#9ca3af] font-medium">签约总额 (P4)</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-[14px] font-semibold text-[#111827]">{(p4Total / 10000).toFixed(1)}w</span>
                <span className={`text-[11px] font-medium ${p4Change >= 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}>
                  {p4Change > 0 ? '+' : ''}{p4Change}%
                </span>
              </div>
              <div className="mt-1.5 text-[10px] text-[#9ca3af]">{displayCurrency}</div>
            </>
          )}
        </div>

        {/* KPI 3: 实收回款 */}
        <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
          {isLoading ? (
            <div className="h-16 animate-pulse bg-[#f3f4f6] rounded-sm" />
          ) : (
            <>
              <div className="text-[11px] text-[#9ca3af] font-medium">实收回款 (P5/P8)</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-[14px] font-semibold text-[#111827]">{(receiptsTotal / 10000).toFixed(1)}w</span>
                <span className={`text-[11px] font-medium ${receiptsChange >= 0 ? 'text-[#dc2626]' : 'text-[#16a34a]'}`}>
                  {receiptsChange > 0 ? '+' : ''}{receiptsChange}%
                </span>
              </div>
              <div className="mt-1.5 text-[10px] text-[#9ca3af]">{displayCurrency}</div>
            </>
          )}
        </div>

        {/* KPI 4: 交付负载 */}
        <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
          {isLoading ? (
            <div className="h-16 animate-pulse bg-[#f3f4f6] rounded-sm" />
          ) : (
            <>
              <div className="text-[11px] text-[#9ca3af] font-medium">交付负载 (P7)</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-[18px] font-semibold text-[#111827]">{p7Count}</span>
                <span className="text-[11px] text-[#6b7280]">项</span>
              </div>
              <div className="mt-1.5 text-[11px] text-[#9ca3af]">平均进度: <span className="font-semibold text-[#2563eb]">{avgP7Progress}%</span></div>
            </>
          )}
        </div>
      </div>

      {/* Trend Chart */}
      {!isLoading && trendData.length > 0 && (
        <div className="border-b border-[#e5e7eb] px-5 py-3">
          <div className="text-[12px] font-semibold text-[#111827] mb-2">业绩走势</div>
          <div className="h-32 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-3 flex items-end gap-1">
            {trendData.map((point, idx) => {
              const maxLeads = Math.max(...trendData.map((p) => p.leads), 1)
              const leadsHeight = (point.leads / maxLeads) * 80
              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <div
                    className="w-full bg-[#dbeafe] rounded-t-sm transition-all"
                    style={{ height: `${leadsHeight}px` }}
                    title={`${point.date}: ${point.leads} 线索`}
                  />
                  {idx % Math.max(1, Math.floor(trendData.length / 10)) === 0 && (
                    <span className="text-[9px] text-[#9ca3af]">{point.date}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Conversion Funnel */}
      <div className="border-b border-[#e5e7eb] px-5 py-3">
        <div className="text-[12px] font-semibold text-[#111827] mb-3">转化漏斗</div>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-[#f3f4f6] rounded-sm animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {funnelData.map((stage, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-12 text-[11px] font-medium text-[#374151]">{stage.label}</div>
                <div className="flex-1">
                  <div className="h-6 rounded-sm bg-[#f3f4f6] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] transition-all"
                      style={{ width: `${stage.width}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right text-[11px] font-mono text-[#6b7280]">
                  {stage.value} ({stage.conversionRate}%)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="flex-1 overflow-auto px-5 py-3">
        <div className="text-[12px] font-semibold text-[#111827] mb-2">实时警报</div>
        <div className="space-y-2">
          {overdueLead && (
            <div className="flex gap-2 rounded-sm border border-[#fecaca] bg-[#fef2f2] p-2">
              <AlertCircle size={13} className="text-[#dc2626] flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#991b1b]">
                线索 <span className="font-mono font-semibold">{overdueLead.id}</span> 已超期未跟进
              </div>
            </div>
          )}
          {p3LowPrice && (
            <div className="flex gap-2 rounded-sm border border-[#fef08a] bg-[#fffbeb] p-2">
              <AlertCircle size={13} className="text-[#ca8a04] flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#92400e]">
                商机 <span className="font-mono font-semibold">{p3LowPrice.id}</span> 金额过低，建议审价
              </div>
            </div>
          )}
          {!overdueLead && !p3LowPrice && (
            <div className="text-[11px] text-[#9ca3af] py-4 text-center">暂无待办事项</div>
          )}
        </div>
      </div>

      {/* China Entity Search Dialog + Handlers */}
      {trendData.length === 0 && !isLoading && (
        <div className="flex h-full items-center justify-center text-[12px] text-[#9ca3af]">
          当前时间段暂无业务流水
        </div>
      )}
    </div>
  )
}
