'use client'

import { useEffect, useState } from 'react'
import { Clock, MessageSquare, Phone, Users, Mail, TrendingUp, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getOpportunityTimelineAction } from '@/app/actions/opportunity'
import type { InteractionRow } from '@/app/actions/interaction'

interface OpportunityTimelineProps {
  opportunityId: string
}

const INTERACTION_ICONS = {
  NOTE: MessageSquare,
  CALL: Phone,
  VISIT: Users,
  MEETING: Users,
  EMAIL: Mail,
  STAGE_CHANGE: TrendingUp,
  SYSTEM: Info,
}

const INTERACTION_LABELS = {
  NOTE: '备注',
  CALL: '电话',
  VISIT: '拜访',
  MEETING: '会议',
  EMAIL: '邮件',
  STAGE_CHANGE: '阶段变更',
  SYSTEM: '系统',
}

export function OpportunityTimeline({ opportunityId }: OpportunityTimelineProps) {
  const [interactions, setInteractions] = useState<InteractionRow[]>([])
  const [hasLeadHistory, setHasLeadHistory] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimeline()
  }, [opportunityId])

  const loadTimeline = async () => {
    setLoading(true)
    try {
      const result = await getOpportunityTimelineAction(opportunityId)
      if (result.success && result.data) {
        setInteractions(result.data.interactions)
        setHasLeadHistory(result.data.hasLeadHistory)
      }
    } catch (error) {
      console.error('Failed to load timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-slate-400">加载中...</div>
      </div>
    )
  }

  if (interactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
        <Clock className="h-8 w-8 mb-2" />
        <div className="text-sm">暂无跟进记录</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 数据血缘提示 */}
      {hasLeadHistory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span className="font-medium">包含线索阶段的历史记录</span>
          </div>
          <div className="mt-1 text-xs text-blue-600">
            以下时间轴包含该商机在线索阶段的所有沟通记录
          </div>
        </div>
      )}

      {/* 时间轴列表 */}
      <div className="space-y-3">
        {interactions.map((interaction, index) => {
          const Icon = INTERACTION_ICONS[interaction.type] || MessageSquare
          const isFromLead = interaction.leadId && !interaction.opportunityId

          return (
            <div
              key={interaction.id}
              className={`relative pl-8 pb-4 ${
                index !== interactions.length - 1 ? 'border-l-2 border-slate-200' : ''
              }`}
            >
              {/* 时间轴图标 */}
              <div className="absolute left-0 top-0 -translate-x-1/2 bg-white">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full ${
                    isFromLead ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* 内容 */}
              <div className="bg-white border rounded-lg p-3 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {INTERACTION_LABELS[interaction.type]}
                    </Badge>
                    {isFromLead && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        线索阶段
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(interaction.createdAt).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="text-sm text-slate-700">{interaction.content}</div>

                {interaction.nextAction && (
                  <div className="mt-2 pt-2 border-t text-xs text-slate-600">
                    <span className="font-medium">下次行动：</span>
                    {interaction.nextAction}
                    {interaction.nextActionDate && (
                      <span className="ml-2 text-slate-500">
                        ({new Date(interaction.nextActionDate).toLocaleDateString('zh-CN')})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
