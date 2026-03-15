import { getLeadsAction } from '@/app/actions/lead'
import { LeadManagementClient } from '@/components/leads/lead-management-client'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { tab?: string; q?: string; leadId?: string }
}) {
  const currentTab = searchParams.tab === 'public_pool' ? 'pool' : 'my_leads'
  const searchQuery = searchParams.q || ''
  const selectedLeadId = searchParams.leadId || null

  // 服务端直接查询数据，带上搜索参数
  const leads = await getLeadsAction(currentTab, {
    search: searchQuery,
  })

  return (
    <div className="h-screen">
      <LeadManagementClient
        initialLeads={leads}
        initialTab={currentTab}
        initialSearch={searchQuery}
        initialLeadId={selectedLeadId}
      />
    </div>
  )
}
