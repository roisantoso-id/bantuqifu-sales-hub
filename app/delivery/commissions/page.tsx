import { getCommissionRecordsAction, getCommissionStatsAction } from '@/app/actions/delivery'
import { CommissionsClient } from './commissions-client'

export default async function CommissionsPage() {
  const [records, stats] = await Promise.all([
    getCommissionRecordsAction(),
    getCommissionStatsAction(),
  ])

  return <CommissionsClient initialRecords={records} initialStats={stats} />
}
