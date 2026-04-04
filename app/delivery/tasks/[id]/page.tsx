import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { TaskDetailClient } from './task-detail-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('selectedTenant')?.value ?? 'org_bantu_id'

  const { data: task } = await supabase
    .from('service_tasks')
    .select(`
      *,
      executor:users_auth!service_tasks_executorId_fkey (
        id, name
      ),
      project:delivery_projects!service_tasks_projectId_fkey (
        id, name,
        customer:customers!delivery_projects_customerId_fkey (
          id, customerName
        ),
        opportunity:opportunities!delivery_projects_opportunityId_fkey (
          id, opportunityCode
        )
      )
    `)
    .eq('id', id)
    .eq('organizationId', tenantId)
    .single()

  if (!task) {
    notFound()
  }

  const { data: records } = await supabase
    .from('delivery_records')
    .select(`
      *,
      user:users_auth!delivery_records_userId_fkey (
        id, name
      )
    `)
    .eq('taskId', id)
    .order('createdAt', { ascending: false })

  return (
    <TaskDetailClient
      task={task as any}
      records={(records ?? []) as any}
    />
  )
}
