'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DepartmentOverview from './department-overview'
import ActivationModal from './activation-modal'
import { PMTaskOpportunity } from '@/app/actions/opportunity-list'
import { format, parseISO } from 'date-fns'
import { Zap } from 'lucide-react'

interface PMTasksClientProps {
  initialOpportunities: PMTaskOpportunity[]
  initialMetrics: {
    waitingForP6: number
    inP7: number
    delayed: number
  }
}

const STAGE_CONFIG = {
  P2: { label: '需求确认', color: 'bg-blue-100 text-blue-800' },
  P3: { label: '方案确认', color: 'bg-blue-100 text-blue-800' },
  P4: { label: '合同签署', color: 'bg-purple-100 text-purple-800' },
  P5: { label: '预付款', color: 'bg-indigo-100 text-indigo-800' },
}

export default function PMTasksClient({
  initialOpportunities,
  initialMetrics,
}: PMTasksClientProps) {
  const [opportunities, setOpportunities] = useState(initialOpportunities)
  const [selectedOpportunity, setSelectedOpportunity] = useState<PMTaskOpportunity | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleActivate = (opportunity: PMTaskOpportunity) => {
    setSelectedOpportunity(opportunity)
    setModalOpen(true)
  }

  const handleModalSuccess = () => {
    // Refresh the opportunities list
    // In a real app, you'd refetch from the server
    // For now, we'll just close the modal
    // The user can refresh the page to see updates
  }

  return (
    <>
      <DepartmentOverview metrics={initialMetrics} />

      {/* Project Pool Table */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white overflow-hidden">
        <div className="border-b border-[#e5e7eb] px-4 py-3">
          <h2 className="text-[14px] font-medium text-[#111827]">待激活商机池</h2>
        </div>

        {opportunities.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[#9ca3af]">
            暂无待激活商机。所有商机已激活。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#f9fafb]">
                <TableRow className="hover:bg-transparent border-b border-[#e5e7eb]">
                  <TableHead className="h-10 px-4 py-2 text-[12px] font-semibold text-[#374151] bg-[#f9fafb]">
                    商机编号
                  </TableHead>
                  <TableHead className="h-10 px-4 py-2 text-[12px] font-semibold text-[#374151] bg-[#f9fafb]">
                    客户名称
                  </TableHead>
                  <TableHead className="h-10 px-4 py-2 text-[12px] font-semibold text-[#374151] bg-[#f9fafb]">
                    当前阶段
                  </TableHead>
                  <TableHead className="h-10 px-4 py-2 text-[12px] font-semibold text-[#374151] bg-[#f9fafb] text-right">
                    金额
                  </TableHead>
                  <TableHead className="h-10 px-4 py-2 text-[12px] font-semibold text-[#374151] bg-[#f9fafb]">
                    预期完成日期
                  </TableHead>
                  <TableHead className="h-10 px-4 py-2 text-[12px] font-semibold text-[#374151] bg-[#f9fafb] text-right">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opp, idx) => (
                  <TableRow
                    key={opp.id}
                    className={`border-b border-[#e5e7eb] ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'
                    } hover:bg-[#f3f4f6] transition-colors`}
                  >
                    <TableCell className="px-4 py-3">
                      <div>
                        <p className="text-[13px] font-medium text-[#111827]">
                          {opp.opportunityCode}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] text-[#374151]">
                        {opp.customer?.customerName || '-'}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        className={`text-[11px] font-medium ${
                          STAGE_CONFIG[opp.stageId as keyof typeof STAGE_CONFIG]?.color ||
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {STAGE_CONFIG[opp.stageId as keyof typeof STAGE_CONFIG]?.label ||
                          opp.stageId}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <p className="text-[13px] text-[#111827] font-medium">
                        {opp.currency === 'USD' ? '$' : '¥'}
                        {opp.estimatedAmount.toLocaleString('zh-CN', {
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <p className="text-[13px] text-[#6b7280]">
                        {opp.expectedCloseDate
                          ? format(parseISO(opp.expectedCloseDate), 'yyyy-MM-dd')
                          : '-'}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-white text-[12px] h-8 px-3"
                        onClick={() => handleActivate(opp)}
                      >
                        <Zap size={14} className="mr-1" />
                        激活
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Activation Modal */}
      <ActivationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        opportunity={selectedOpportunity}
        onSuccess={handleModalSuccess}
      />
    </>
  )
}
