'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ActivationModal } from './activation-modal'
import { DepartmentOverview } from './department-overview'
import { Clock, Zap, AlertCircle } from 'lucide-react'
import type { PMTaskOpportunity } from '@/app/actions/opportunity-list'

interface PMTaskAssignmentViewProps {
  initialOpportunities: PMTaskOpportunity[]
  initialMetrics?: {
    waitingForP6: number
    inP7: number
    delayed: number
  }
}

const STAGE_LABELS: Record<string, string> = {
  P2: 'P2',
  P3: 'P3',
  P4: 'P4',
  P5: 'P5',
}

const STAGE_COLORS: Record<string, string> = {
  P2: 'bg-blue-100 text-blue-800',
  P3: 'bg-blue-50 text-blue-700',
  P4: 'bg-indigo-100 text-indigo-800',
  P5: 'bg-purple-100 text-purple-800',
}

export function PMTaskAssignmentView({
  initialOpportunities,
  initialMetrics,
}: PMTaskAssignmentViewProps) {
  const [opportunities] = useState<PMTaskOpportunity[]>(initialOpportunities)
  const [selectedOpportunity, setSelectedOpportunity] = useState<PMTaskOpportunity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleActivate = (opportunity: PMTaskOpportunity) => {
    setSelectedOpportunity(opportunity)
    setIsModalOpen(true)
  }

  const metrics = initialMetrics || { waitingForP6: 0, inP7: 0, delayed: 0 }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-6 py-5">
        <h1 className="text-[18px] font-semibold text-[#111827]">PM任务指派</h1>
        <p className="mt-1 text-[13px] text-[#6b7280]">监控P2-P5商机，激活交付流程</p>
      </div>

      {/* Department Overview */}
      <div className="border-b border-[#e5e7eb] px-6 py-4">
        <DepartmentOverview metrics={metrics} />
      </div>

      {/* Project Pool Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="rounded-lg border border-[#e5e7eb] overflow-hidden">
          <Table>
            <TableHeader className="bg-[#f9fafb]">
              <TableRow>
                <TableHead className="text-[12px] font-semibold text-[#6b7280] h-10 px-4">商机编号</TableHead>
                <TableHead className="text-[12px] font-semibold text-[#6b7280] h-10 px-4">客户名称</TableHead>
                <TableHead className="text-[12px] font-semibold text-[#6b7280] h-10 px-4">当前阶段</TableHead>
                <TableHead className="text-[12px] font-semibold text-[#6b7280] h-10 px-4">预计金额</TableHead>
                <TableHead className="text-[12px] font-semibold text-[#6b7280] h-10 px-4">预期完成</TableHead>
                <TableHead className="text-[12px] font-semibold text-[#6b7280] h-10 px-4 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[13px] text-[#9ca3af]">
                    暂无待激活的商机
                  </TableCell>
                </TableRow>
              ) : (
                opportunities.map((opp, idx) => (
                  <TableRow key={opp.id} className={idx % 2 === 1 ? 'bg-[#f9fafb]' : ''}>
                    <TableCell className="text-[13px] text-[#111827] px-4 py-3 font-medium">
                      {opp.opportunityCode}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#111827] px-4 py-3">
                      {opp.customer?.customerName || '未知客户'}
                    </TableCell>
                    <TableCell className="text-[13px] px-4 py-3">
                      <Badge className={`${STAGE_COLORS[opp.stageId] || 'bg-gray-100 text-gray-800'}`}>
                        {STAGE_LABELS[opp.stageId] || opp.stageId}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[13px] text-[#111827] px-4 py-3">
                      {opp.estimatedAmount ? `${opp.estimatedAmount.toLocaleString()} ${opp.currency}` : '-'}
                    </TableCell>
                    <TableCell className="text-[13px] text-[#6b7280] px-4 py-3">
                      {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString('zh-CN') : '-'}
                    </TableCell>
                    <TableCell className="text-right px-4 py-3">
                      <Button
                        onClick={() => handleActivate(opp)}
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white text-[12px] h-7 px-3"
                      >
                        激活
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Activation Modal */}
      {selectedOpportunity && (
        <ActivationModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          opportunity={selectedOpportunity}
          onSuccess={() => {
            setIsModalOpen(false)
            setSelectedOpportunity(null)
          }}
        />
      )}
    </div>
  )
}
