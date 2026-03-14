'use client'

import { useState, useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
import type { Opportunity, Lead, ActionLog, Currency } from '@/lib/types'

interface MyDashboardProps {
  opportunities: Opportunity[]
  leads: Lead[]
  actionLogs: Record<string, ActionLog[]>
  assignee: string
  userName: string
}

const EXCHANGE_RATES: Record<Currency, number> = { CNY: 1, IDR: 0.00048 }

export function MyDashboard({ opportunities, leads, actionLogs, assignee, userName }: MyDashboardProps) {
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('CNY')

  // Filter by current user
  const myLeads = leads.filter((l) => l.assignee === assignee)
  const myOpportunities = opportunities.filter((o) => o.assignee === assignee)

  // KPI 1: 活跃线索
  const activeLeads = useMemo(() => {
    return myLeads.filter((l) => l.status !== 'discarded' && l.status !== 'public_pool' && l.status !== 'no_interest')
  }, [myLeads])

  const urgentLeads = useMemo(() => {
    return activeLeads.filter((l) => l.urgency === '高')
  }, [activeLeads])

  // KPI 2: 商机总额
  const totalOpportunityValue = useMemo(() => {
    return myOpportunities.reduce((sum, opp) => {
      const inCNY = (opp.estimatedAmount || 0) / EXCHANGE_RATES[opp.currency]
      return sum + inCNY * EXCHANGE_RATES[displayCurrency]
    }, 0)
  }, [myOpportunities, displayCurrency])

  // KPI 3: 本月回款
  const monthlyReceipts = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return myOpportunities.reduce((sum, opp) => {
      if (opp.p5Data?.paymentStatus === 'verified' && opp.p5Data?.confirmedAt) {
        const confirmedDate = new Date(opp.p5Data.confirmedAt)
        if (confirmedDate >= monthStart && confirmedDate <= now) {
          const inCNY = (opp.p5Data.receivedAmount || 0) / EXCHANGE_RATES[opp.currency]
          return sum + inCNY * EXCHANGE_RATES[displayCurrency]
        }
      }
      return sum
    }, 0)
  }, [myOpportunities, displayCurrency])

  // KPI 4: 交付负载
  const p7Count = myOpportunities.filter((o) => o.stageId === 'P7').length
  const avgP7Progress = useMemo(() => {
    const p7Opps = myOpportunities.filter((o) => o.stageId === 'P7')
    if (p7Opps.length === 0) return 0
    const totalProgress = p7Opps.reduce((sum, opp) => {
      if (opp.p7Data?.progressPoints) {
        const completed = opp.p7Data.progressPoints.filter((p) => p.status === 'completed').length
        return sum + (completed / opp.p7Data.progressPoints.length) * 100
      }
      return sum
    }, 0)
    return Math.round(totalProgress / p7Opps.length)
  }, [myOpportunities])

  // 转化漏斗数据
  const funnelData = useMemo(() => {
    const counts = {
      leads: activeLeads.length,
      p1: myOpportunities.filter((o) => o.stageId === 'P1').length,
      p3: myOpportunities.filter((o) => o.stageId === 'P3').length,
      p5: myOpportunities.filter((o) => o.stageId === 'P5').length,
      p8: myOpportunities.filter((o) => o.stageId === 'P8').length,
    }
    const maxCount = Math.max(...Object.values(counts), 1)
    return {
      counts,
      widths: {
        leads: (counts.leads / maxCount) * 100,
        p1: (counts.p1 / maxCount) * 100,
        p3: (counts.p3 / maxCount) * 100,
        p5: (counts.p5 / maxCount) * 100,
        p8: (counts.p8 / maxCount) * 100,
      },
    }
  }, [activeLeads, myOpportunities])

  // 预警数据
  const criticalAlerts = useMemo(() => {
    const alerts = []
    const now = new Date()
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    
    const leadRecoveryWarnings = myLeads.filter((l) => {
      if (l.status === 'public_pool' || l.status === 'discarded') return false
      if (l.nextFollowDate) {
        const followDate = new Date(l.nextFollowDate)
        return followDate >= now && followDate <= in48h
      }
      return false
    })
    
    if (leadRecoveryWarnings.length > 0) {
      alerts.push({
        type: 'lead-recovery',
        label: `线索回收预警 (${leadRecoveryWarnings.length})`,
        items: leadRecoveryWarnings.slice(0, 3).map((l) => ({
          id: l.id,
          title: l.wechatName,
          desc: `${l.nextFollowDate} 前需跟进`,
          urgent: true,
        })),
      })
    }

    const lowPriceQuotes = myOpportunities
      .filter((o) => o.stageId === 'P3')
      .filter((o) => o.p3Data?.some((p) => p.approvalStatus === 'admin-required'))
    
    if (lowPriceQuotes.length > 0) {
      alerts.push({
        type: 'p3-approval',
        label: `P3 低价审批 (${lowPriceQuotes.length})`,
        items: lowPriceQuotes.slice(0, 3).map((o) => ({
          id: o.id,
          title: o.customer.name,
          desc: '报价低于推荐价，待管理员审批',
          urgent: false,
        })),
      })
    }

    return alerts
  }, [myLeads, myOpportunities])

  // 交付进度分布
  const stageDistribution = useMemo(() => {
    const p123Count = myOpportunities.filter((o) => ['P1', 'P2', 'P3'].includes(o.stageId)).length
    const p456Count = myOpportunities.filter((o) => ['P4', 'P5', 'P6'].includes(o.stageId)).length
    const p78Count = myOpportunities.filter((o) => ['P7', 'P8'].includes(o.stageId)).length
    const total = myOpportunities.length || 1
    return {
      sales: { count: p123Count, pct: Math.round((p123Count / total) * 100) },
      materials: { count: p456Count, pct: Math.round((p456Count / total) * 100) },
      delivery: { count: p78Count, pct: Math.round((p78Count / total) * 100) },
    }
  }, [myOpportunities])

  return (
    <div className="flex h-full flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[16px] font-semibold text-[#111827]">我的数据</h1>
            <p className="mt-1 text-[12px] text-[#6b7280]">{userName} · 个人商机看板</p>
          </div>
          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
            className="h-8 rounded-sm border border-[#e5e7eb] bg-white px-2 text-[12px] text-[#111827] outline-none focus:border-[#2563eb]"
          >
            <option value="CNY">¥ CNY</option>
            <option value="IDR">Rp IDR</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">活跃线索</span>
                {urgentLeads.length > 0 && (
                  <span className="inline-flex items-center rounded-sm bg-[#fecaca] px-1.5 py-0.5 text-[10px] font-semibold text-[#991b1b]">
                    {urgentLeads.length} 紧急
                  </span>
                )}
              </div>
              <div className="text-[24px] font-bold text-[#111827]">{activeLeads.length}</div>
              <p className="mt-1 text-[11px] text-[#9ca3af]">{urgentLeads.length} 个高优先级</p>
            </div>

            <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">商机总额</div>
              <div className="font-mono text-[20px] font-bold text-[#111827]">
                {displayCurrency === 'CNY' ? '¥' : 'Rp'} {totalOpportunityValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <p className="mt-1 text-[11px] text-[#9ca3af]">{myOpportunities.length} 个商机</p>
            </div>

            <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">本月回款</div>
              <div className="font-mono text-[20px] font-bold text-[#16a34a]">
                {displayCurrency === 'CNY' ? '¥' : 'Rp'} {monthlyReceipts.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
              <p className="mt-1 text-[11px] text-[#9ca3af]">已验证</p>
            </div>

            <div className="rounded-sm border border-[#e5e7eb] bg-white p-3">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af]">交付负载</div>
              <div className="font-mono text-[20px] font-bold text-[#111827]">{p7Count} 项</div>
              <p className="mt-1 text-[11px] text-[#9ca3af]">平均进度 {avgP7Progress}%</p>
            </div>
          </div>

          {/* Funnel */}
          <div className="rounded-sm border border-[#e5e7eb] bg-white p-4">
            <h3 className="mb-3 text-[12px] font-semibold text-[#111827]">转化漏斗</h3>
            <div className="space-y-2">
              {[
                { label: '线索', key: 'leads', color: '#dbeafe' },
                { label: 'P1 需求', key: 'p1', color: '#e0e7ff' },
                { label: 'P3 报价', key: 'p3', color: '#fef3c7' },
                { label: 'P5 收款', key: 'p5', color: '#d1fae5' },
                { label: 'P8 结算', key: 'p8', color: '#dcfce7' },
              ].map((stage) => (
                <div key={stage.key} className="flex items-center gap-2">
                  <span className="w-[60px] text-[11px] font-medium text-[#6b7280]">{stage.label}</span>
                  <div className="flex-1">
                    <div className="flex h-6 items-center rounded-sm bg-[#f3f4f6]">
                      <div
                        className="flex items-center justify-center rounded-sm transition-all"
                        style={{
                          width: `${funnelData.widths[stage.key as keyof typeof funnelData.widths]}%`,
                          backgroundColor: stage.color,
                        }}
                      >
                        {funnelData.widths[stage.key as keyof typeof funnelData.widths] > 15 && (
                          <span className="font-mono text-[10px] font-semibold text-[#111827]">
                            {funnelData.counts[stage.key as keyof typeof funnelData.counts]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono w-[40px] text-right text-[11px] text-[#9ca3af]">
                    {funnelData.counts[stage.key as keyof typeof funnelData.counts]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts & Workload */}
          <div className="grid grid-cols-[1fr_0.5fr] gap-4">
            <div className="rounded-sm border border-[#e5e7eb] bg-white p-4">
              <h3 className="mb-3 text-[12px] font-semibold text-[#111827]">待办提醒</h3>
              <div className="space-y-2">
                {criticalAlerts.length === 0 ? (
                  <p className="text-[12px] text-[#9ca3af]">暂无紧急提醒</p>
                ) : (
                  criticalAlerts.map((alert) => (
                    <div key={alert.type}>
                      <div className="mb-1.5 text-[11px] font-semibold text-[#111827]">{alert.label}</div>
                      <div className="space-y-1">
                        {alert.items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-start gap-2 rounded-sm p-1.5 text-[11px] ${
                              item.urgent ? 'bg-[#fef2f2]' : 'bg-[#fafbfc]'
                            }`}
                          >
                            <AlertCircle size={14} className={item.urgent ? 'text-[#dc2626]' : 'text-[#f59e0b]'} />
                            <div className="flex-1">
                              <p className={`font-medium ${item.urgent ? 'text-[#dc2626]' : 'text-[#111827]'}`}>
                                {item.title}
                              </p>
                              <p className="text-[#9ca3af]">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-sm border border-[#e5e7eb] bg-white p-4">
              <h3 className="mb-3 text-[12px] font-semibold text-[#111827]">阶段分布</h3>
              <div className="space-y-2">
                {[
                  { label: '销售阶段', pct: stageDistribution.sales.pct, color: '#bfdbfe' },
                  { label: '资料阶段', pct: stageDistribution.materials.pct, color: '#fed7aa' },
                  { label: '交付阶段', pct: stageDistribution.delivery.pct, color: '#a7f3d0' },
                ].map((dist) => (
                  <div key={dist.label} className="flex items-center gap-2">
                    <span className="text-[11px] text-[#6b7280]">{dist.label}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="flex-1 h-4 rounded-sm bg-[#f3f4f6]">
                        <div
                          className="h-full rounded-sm transition-all"
                          style={{ width: `${dist.pct}%`, backgroundColor: dist.color }}
                        />
                      </div>
                      <span className="font-mono w-[30px] text-right text-[11px] font-semibold text-[#111827]">
                        {dist.pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
