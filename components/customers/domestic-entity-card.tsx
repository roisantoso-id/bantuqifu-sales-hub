'use client'

import { ExternalLink, X } from 'lucide-react'
import type { ChinaEntity } from '@/lib/types'

interface DomesticEntityCardProps {
  entity: ChinaEntity
  industry?: string // 印尼业务行业
  contactPerson?: string // 联系人名字用于对比
  businessMatch: 'high' | 'medium' | 'low'
  riskLevel: 'low' | 'medium' | 'high'
  onRemove?: () => void
}

export function DomesticEntityCard({
  entity,
  industry,
  contactPerson,
  businessMatch,
  riskLevel,
  onRemove,
}: DomesticEntityCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case '存续':
        return { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' }
      case '吊销':
        return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' }
      case '注销':
        return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' }
    }
  }

  const matchColor = {
    high: { bg: '#dbeafe', text: '#1e40af', label: '高' },
    medium: { bg: '#fef3c7', text: '#92400e', label: '中' },
    low: { bg: '#fee2e2', text: '#991b1b', label: '低' },
  }

  const riskColor = {
    low: { bg: '#f0fdf4', text: '#166534', label: '低风险' },
    medium: { bg: '#fef3c7', text: '#92400e', label: '中风险' },
    high: { bg: '#fef2f2', text: '#991b1b', label: '高风险' },
  }

  const statusColor = getStatusColor(entity.status)

  return (
    <div className="rounded-sm border border-[#e5e7eb] bg-white overflow-hidden">
      {/* Header with 天眼查 blue line */}
      <div className="border-l-4" style={{ borderLeftColor: '#128BED' }}>
        <div className="px-4 py-3 space-y-2">
          {/* Company name with link */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-[#111827]">{entity.companyName}</p>
              <p className="mt-0.5 font-mono text-[11px] text-[#6b7280]">社信代码：{entity.creditCode}</p>
            </div>
            <a
              href={`https://www.tianyancha.com/search?key=${entity.creditCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded-sm hover:bg-[#f3f4f6] text-[#9ca3af] hover:text-[#111827]"
              title="查看天眼查详情"
            >
              <ExternalLink size={14} />
            </a>
            {onRemove && (
              <button
                onClick={onRemove}
                className="flex h-7 w-7 items-center justify-center rounded-sm hover:bg-[#fee2e2] text-[#9ca3af] hover:text-[#dc2626]"
                title="取消关联"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Core Info Grid */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-medium text-[#9ca3af] uppercase tracking-wider">法定代表人</p>
              <p className="mt-1 text-[13px] font-semibold text-[#111827]">{entity.legalPerson}</p>
              {contactPerson && (
                <p className="mt-0.5 text-[11px] text-[#6b7280]">印尼联系人：{contactPerson}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-medium text-[#9ca3af] uppercase tracking-wider">注册资本</p>
              <p className="mt-1 font-mono text-[13px] font-semibold text-[#111827]">{entity.regCapital}</p>
            </div>
          </div>

          {/* Status and Details */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-semibold"
              style={{ background: statusColor.bg, color: statusColor.text, border: `1px solid ${statusColor.border}` }}
            >
              {entity.status}
            </span>
            <span className="text-[11px] text-[#6b7280]">
              {entity.foundedDate ? `创立于 ${entity.foundedDate.split('-')[0]}年` : ''}
            </span>
          </div>

          {/* Business Match Analysis */}
          <div className="mt-3 rounded-sm bg-[#fafbfc] p-2 space-y-1.5">
            <p className="text-[11px] font-medium text-[#6b7280]">业务匹配分析</p>
            <div className="space-y-1">
              {entity.industry && (
                <p className="text-[11px] text-[#374151]">
                  该国内实体行业为：<span className="font-semibold">{entity.industry}</span>
                </p>
              )}
              {industry && (
                <p className="text-[11px] text-[#374151]">
                  当前印尼业务：<span className="font-semibold">{industry}</span>
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-[#6b7280]">匹配度：</span>
                <span
                  className="inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-semibold"
                  style={{
                    background: matchColor[businessMatch].bg,
                    color: matchColor[businessMatch].text,
                  }}
                >
                  {matchColor[businessMatch].label}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Level */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-[#6b7280]">风险等级：</span>
            <span
              className="inline-flex items-center rounded-sm px-2 py-1 text-[11px] font-semibold"
              style={{
                background: riskColor[riskLevel].bg,
                color: riskColor[riskLevel].text,
              }}
            >
              {riskColor[riskLevel].label}
            </span>
          </div>

          {/* Risk Warning if needed */}
          {entity.status === '吊销' && (
            <div className="mt-2 rounded-sm bg-[#fef2f2] px-2 py-1.5 border border-[#fecaca]">
              <p className="text-[11px] text-[#991b1b]">
                ⚠️ 该国内实体已吊销，建议在财务确认阶段注意收款风险。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
