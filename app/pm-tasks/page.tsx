import { getPMTaskOpportunitiesAction, getDepartmentMetricsAction } from '@/app/actions/opportunity-list'
import PMTasksClient from './pm-tasks-client'

export default async function PMTasksPage() {
  const [opportunities, metrics] = await Promise.all([
    getPMTaskOpportunitiesAction(),
    getDepartmentMetricsAction(),
  ])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[18px] font-semibold text-[#111827]">PM任务指派</h1>
        <p className="mt-1 text-[13px] text-[#6b7280]">
          监控P2-P5商机，激活交付流程
        </p>
      </div>

      <PMTasksClient initialOpportunities={opportunities} initialMetrics={metrics} />
    </div>
  )
}
