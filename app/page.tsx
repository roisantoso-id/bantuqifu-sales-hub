import { getLeadsAction } from '@/app/actions/lead'
import { DashboardClient } from '@/app/dashboard-client'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  // 从 URL 读取状态
  const activeNav = (searchParams.nav || 'opportunities') as 'leads' | 'opportunities' | 'customers' | 'analytics'
  const leadTab = searchParams.tab || 'my_leads'
  const leadSearch = searchParams.q || ''
  const selectedLeadId = searchParams.leadId || null

  // 如果是线索模块，服务端预加载数据
  let initialLeads = null
  if (activeNav === 'leads') {
    const viewMode = leadTab === 'pool' ? 'pool' : 'my_leads'
    initialLeads = await getLeadsAction(viewMode, {
      search: leadSearch,
    })
  }

  return (
    <DashboardClient
      initialNav={activeNav}
      initialLeads={initialLeads}
      initialLeadTab={leadTab}
      initialLeadSearch={leadSearch}
      selectedLeadId={selectedLeadId}
    />
  )
}
