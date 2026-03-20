'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { assignDeliveryTaskAction, getDeliveryExecutorsAction } from '@/app/actions/delivery'
import type { DeliveryTask } from '@/app/actions/delivery'

interface Executor {
  id: string
  name: string
  email: string
}

interface Props {
  initialTasks: DeliveryTask[]
}

export default function DispatchTable({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<DeliveryTask[]>(initialTasks)
  const [executors, setExecutors] = useState<Executor[]>([])
  const [selectedTask, setSelectedTask] = useState<DeliveryTask | null>(null)
  const [executorId, setExecutorId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getDeliveryExecutorsAction().then(res => {
      if (res.success) setExecutors(res.data as Executor[])
    })
  }, [])

  function openDialog(task: DeliveryTask) {
    setSelectedTask(task)
    setExecutorId('')
    setNotes('')
  }

  function closeDialog() {
    setSelectedTask(null)
  }

  async function handleAssign() {
    if (!selectedTask || !executorId) return
    setLoading(true)
    const res = await assignDeliveryTaskAction(selectedTask.id, executorId, notes)
    setLoading(false)
    if (res.success) {
      toast.success('派单成功')
      // 乐观更新：移除已派单行
      setTasks(prev => prev.filter(t => t.id !== selectedTask.id))
      closeDialog()
    } else {
      toast.error(res.error ?? '派单失败')
    }
  }

  const stageColors: Record<string, string> = {
    P6: 'bg-blue-100 text-blue-700',
    P7: 'bg-purple-100 text-purple-700',
    P8: 'bg-green-100 text-green-700',
  }

  return (
    <>
      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>商机编号</TableHead>
              <TableHead>客户名称</TableHead>
              <TableHead>业务类型</TableHead>
              <TableHead>阶段</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-400">
                  暂无待分配商机
                </TableCell>
              </TableRow>
            ) : (
              tasks.map(task => (
                <TableRow key={task.id}>
                  <TableCell className="font-mono text-sm">{task.opportunityCode}</TableCell>
                  <TableCell>{task.customerName}</TableCell>
                  <TableCell>{task.serviceTypeLabel}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${stageColors[task.stageId] ?? 'bg-gray-100 text-gray-600'}`}>
                      {task.stageId}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => openDialog(task)}>
                      指派
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedTask} onOpenChange={open => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>指派执行人员</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-gray-500">
                商机：<span className="font-medium text-gray-900">{selectedTask?.opportunityCode}</span>
              </p>
              <p className="text-sm text-gray-500">
                客户：<span className="font-medium text-gray-900">{selectedTask?.customerName}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>执行人员</Label>
              <Select value={executorId} onValueChange={setExecutorId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择执行人员" />
                </SelectTrigger>
                <SelectContent>
                  {executors.length === 0 ? (
                    <SelectItem value="_none" disabled>暂无可用执行人员</SelectItem>
                  ) : (
                    executors.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>备注（可选）</Label>
              <Textarea
                placeholder="派单备注..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>取消</Button>
            <Button onClick={handleAssign} disabled={!executorId || loading}>
              {loading ? '派单中...' : '确认派单'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
