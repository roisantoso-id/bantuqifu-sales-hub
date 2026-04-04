import { getDeliveryProjectsAction } from '@/app/actions/delivery'
import { DeliveryProjectListClient } from './project-list-client'

export default async function DeliveryProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const params = await searchParams
  const statusFilter = params.status || undefined
  const projects = await getDeliveryProjectsAction(
    statusFilter ? { status: statusFilter } : undefined
  )

  return (
    <DeliveryProjectListClient
      initialProjects={projects}
      initialStatus={statusFilter || 'ALL'}
    />
  )
}
