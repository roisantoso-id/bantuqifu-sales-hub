import { getLeadsAction } from '@/app/actions/lead'
import { getOpportunitiesAction } from '@/app/actions/opportunity'
import { createClient } from '@/lib/supabase/server'
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

  // 获取当前用户ID
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id || null

  // 根据导航模块预加载数据 - 始终调用，但可能返回 null
  const viewMode = leadTab === 'pool' ? 'pool' : 'my_leads'
  const initialLeads = activeNav === 'leads'
    ? await getLeadsAction(viewMode, { search: leadSearch })
    : null

  const initialOpportunities = activeNav === 'opportunities'
    ? await getOpportunitiesAction()
    : null

  return (
    <DashboardClient
      initialNav={activeNav}
      initialLeads={initialLeads}
      initialOpportunities={initialOpportunities}
      initialLeadTab={leadTab}
      initialLeadSearch={leadSearch}
      selectedLeadId={selectedLeadId}
      currentUserId={currentUserId}
    />
  )
}
