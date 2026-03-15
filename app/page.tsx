import { getLeadsAction } from '@/app/actions/lead'
import { DashboardClient } from '@/app/dashboard-client'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  // Next.js 15+ searchParams 是 Promise，需要 await
  const params = await searchParams

  // 从 URL 读取状态
  const activeNav = (params.nav || 'opportunities') as 'leads' | 'opportunities' | 'customers' | 'analytics'
  const leadTab = params.tab || 'my_leads'
  const leadSearch = params.q || ''
  const selectedLeadId = params.leadId || null

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
