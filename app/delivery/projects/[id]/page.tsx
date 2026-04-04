import {
  getDeliveryProjectByIdAction,
  getTasksByProjectAction,
} from '@/app/actions/delivery'
import { notFound } from 'next/navigation'
import { ProjectDetailClient } from './project-detail-client'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getDeliveryProjectByIdAction(id)

  if (!project) {
    notFound()
  }

  const tasks = await getTasksByProjectAction(id)

  return <ProjectDetailClient project={project} initialTasks={tasks} />
}
