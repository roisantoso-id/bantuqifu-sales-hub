import { notFound } from 'next/navigation'
import { getLeadByIdAction, getLeadFollowUpsAction } from '@/app/actions/lead'
import { LeadDetailPage } from '@/components/leads/lead-detail-page'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const lead = await getLeadByIdAction(id)
  return {
    title: lead ? `${lead.leadCode} — 线索详情` : '线索详情',
  }
}

export default async function LeadDetailRoute({ params }: Props) {
  const { id } = await params
  const [lead, followUps] = await Promise.all([
    getLeadByIdAction(id),
    getLeadFollowUpsAction(id),
  ])

  if (!lead) {
    notFound()
  }

  return <LeadDetailPage lead={lead} initialFollowUps={followUps} />
}
