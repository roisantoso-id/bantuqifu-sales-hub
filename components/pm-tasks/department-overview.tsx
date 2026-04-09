'use client'

import { Clock, Zap, AlertTriangle } from 'lucide-react'

interface DepartmentOverviewProps {
  metrics: {
    waitingForP6: number
    inP7: number
    delayed: number
  }
}

export function DepartmentOverview({ metrics }: DepartmentOverviewProps) {
  const statCards = [
    {
      label: '待P6激活',
      value: metrics.waitingForP6,
      icon: <Clock size={20} />,
      color: '#3b82f6',
      bg: '#dbeafe',
    },
    {
      label: '进行中(P7)',
      value: metrics.inP7,
      icon: <Zap size={20} />,
      color: '#10b981',
      bg: '#d1fae5',
    },
    {
      label: '超期商机',
      value: metrics.delayed,
      icon: <AlertTriangle size={20} />,
      color: '#ef4444',
      bg: '#fee2e2',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-4">
      {statCards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-[#e5e7eb] bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] text-[#6b7280]">{card.label}</p>
              <p className="mt-1 text-[24px] font-semibold text-[#111827]">
                {card.value}
              </p>
            </div>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: card.bg, color: card.color }}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
