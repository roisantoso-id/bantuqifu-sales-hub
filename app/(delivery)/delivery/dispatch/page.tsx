import { getDeliveryTasksAction } from '@/app/actions/delivery'
import DispatchTable from '@/components/delivery/dispatch-table'

export default async function DispatchPage() {
  const result = await getDeliveryTasksAction()
  const tasks = result.success ? result.data : []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">PM 派单中心</h1>
        <p className="mt-1 text-sm text-gray-500">待分配的 P6/P7/P8 阶段商机</p>
      </div>
      <DispatchTable initialTasks={tasks} />
    </div>
  )
}
