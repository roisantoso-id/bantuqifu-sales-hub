'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OpportunityHeader } from './opportunity-header'
import { OpportunityTimeline } from './opportunity-timeline'
import type { OpportunityRow } from '@/app/actions/opportunity'
import { RefreshCw } from 'lucide-react'

interface OpportunityDetailProps {
  opportunity: OpportunityRow
  onRefresh: () => void
}

export function OpportunityDetail({ opportunity, onRefresh }: OpportunityDetailProps) {
  const [activeTab, setActiveTab] = useState('timeline')

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 头部工具栏 */}
      <div className="border-b px-6 py-3 flex items-center justify-between bg-slate-50/50">
        <h2 className="text-sm font-bold text-slate-900">商机详情</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          className="h-8 gap-1.5 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          刷新
        </Button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 商机头部信息 */}
        <OpportunityHeader
          opportunity={opportunity}
          onViewLead={(leadId) => {
            console.log('View lead:', leadId)
            // TODO: 实现查看线索详情
          }}
        />

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">跟进时间轴</TabsTrigger>
            <TabsTrigger value="details">详细信息</TabsTrigger>
            <TabsTrigger value="files">附件文档</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4">
            <OpportunityTimeline opportunityId={opportunity.id} />
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">商机编号</div>
                  <div className="text-sm text-slate-900 font-mono">{opportunity.opportunityCode}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">当前阶段</div>
                  <div className="text-sm text-slate-900">{opportunity.stageId}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">服务类型</div>
                  <div className="text-sm text-slate-900">{opportunity.serviceTypeLabel || opportunity.serviceType}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">状态</div>
                  <div className="text-sm text-slate-900">
                    {opportunity.status === 'active' ? '进行中' : opportunity.status === 'won' ? '已赢单' : '已失败'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">预估金额</div>
                  <div className="text-sm text-slate-900">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: opportunity.currency || 'IDR',
                    }).format(opportunity.estimatedAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">预计成交日期</div>
                  <div className="text-sm text-slate-900">
                    {opportunity.expectedCloseDate
                      ? new Date(opportunity.expectedCloseDate).toLocaleDateString('zh-CN')
                      : '未设置'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm font-medium text-slate-700 mb-1">创建时间</div>
                  <div className="text-sm text-slate-900">
                    {new Date(opportunity.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>

              {opportunity.notes && (
                <div>
                  <div className="text-sm font-medium text-slate-700 mb-1">备注</div>
                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                    {opportunity.notes}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <div className="text-4xl mb-2">📎</div>
              <div className="text-sm">附件功能开发中</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
