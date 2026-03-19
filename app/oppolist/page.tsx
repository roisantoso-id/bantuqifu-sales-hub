import { Suspense } from 'react'
import { getOpportunityListAction } from '@/app/actions/opportunity-list'
import { OpportunityListTable } from '@/components/opportunities/opportunity-list-table'
import { OpportunityListFilters } from '@/components/opportunities/opportunity-list-filters'
import { OpportunityListHeader } from '@/components/opportunities/opportunity-list-header'

interface Props {
  searchParams: Promise<{
    search?: string
    stage?: string
    status?: string
    serviceType?: string
    page?: string
  }>
}

export default async function OpportunityListPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)

  const result = await getOpportunityListAction({
    page,
    pageSize: 20,
    search: params.search,
    stage: params.stage,
    status: params.status,
    serviceType: params.serviceType,
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] shrink-0">
        <h1 className="text-[16px] font-semibold text-[#111827]">商机管理</h1>
        <Suspense>
          <OpportunityListHeader />
        </Suspense>
      </div>

      {/* Toolbar */}
      <div className="flex items-center px-6 py-3 border-b border-[#e5e7eb] shrink-0">
        <Suspense>
          <OpportunityListFilters />
        </Suspense>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <Suspense fallback={<div className="text-[13px] text-[#9ca3af] py-8 text-center">加载中...</div>}>
          <OpportunityListTable result={result} />
        </Suspense>
      </div>
    </div>
  )
}
