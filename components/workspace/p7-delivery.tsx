'use client'

import { Download, CheckCircle, Clock, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { OpportunityP7Data, ProgressPoint } from '@/lib/types'

interface P7DeliveryProps {
  p7Data?: OpportunityP7Data
  onDataChange: (data: OpportunityP7Data) => void
  onCompleteDelivery: () => void
}

export function P7Delivery({ p7Data, onDataChange, onCompleteDelivery }: P7DeliveryProps) {
  const [addingPoint, setAddingPoint] = useState(false)
  const [newPointLabel, setNewPointLabel] = useState('')

  const currentData = p7Data || {
    progressPoints: [],
    deliveryStatus: 'in_transit',
  }

  const addProgressPoint = () => {
    if (!newPointLabel.trim()) return
    const newPoint: ProgressPoint = {
      id: `point-${Date.now()}`,
      label: newPointLabel,
      status: 'pending',
      timestamp: new Date().toISOString(),
    }
    onDataChange({
      ...currentData,
      progressPoints: [...currentData.progressPoints, newPoint],
    })
    setNewPointLabel('')
    setAddingPoint(false)
  }

  const updateProgressPoint = (id: string, status: 'pending' | 'in_progress' | 'completed') => {
    onDataChange({
      ...currentData,
      progressPoints: currentData.progressPoints.map((p) =>
        p.id === id
          ? {
              ...p,
              status,
              timestamp: status === 'completed' ? new Date().toISOString() : p.timestamp,
            }
          : p
      ),
    })
  }

  const deleteProgressPoint = (id: string) => {
    onDataChange({
      ...currentData,
      progressPoints: currentData.progressPoints.filter((p) => p.id !== id),
    })
  }

  const completedPoints = currentData.progressPoints.filter(
    (p) => p.status === 'completed'
  ).length
  const totalPoints = currentData.progressPoints.length

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-[#e5e7eb] px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-[#111827]">P7: 交付与完成</h3>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Progress Timeline */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto border-r border-[#e5e7eb]">
          <div className="mb-3">
            <h4 className="text-[12px] font-semibold text-[#111827] mb-2">办件进度</h4>
            {completedPoints > 0 && (
              <div className="mb-2 text-[11px]">
                <span className="text-[#6b7280]">已完成: </span>
                <span className="font-mono font-semibold text-[#10b981]">
                  {completedPoints}/{totalPoints}
                </span>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-2">
            {currentData.progressPoints.map((point, idx) => {
              const statusIcon = {
                pending: <Clock size={14} className="text-[#9ca3af]" />,
                in_progress: <Clock size={14} className="text-[#f59e0b] animate-pulse" />,
                completed: <CheckCircle size={14} className="text-[#10b981]" />,
              }[point.status]

              const statusColor = {
                pending: 'bg-[#f3f4f6]',
                in_progress: 'bg-[#fef3c7]',
                completed: 'bg-[#d1fae5]',
              }[point.status]

              return (
                <div key={point.id} className={`rounded-sm border border-[#e5e7eb] ${statusColor} p-2`}>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">{statusIcon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#111827]">{point.label}</p>
                      {point.timestamp && point.status === 'completed' && (
                        <p className="mt-0.5 text-[10px] text-[#6b7280]">
                          完成于 {new Date(point.timestamp).toLocaleString('zh-CN')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {point.status !== 'completed' && (
                        <button
                          onClick={() =>
                            updateProgressPoint(
                              point.id,
                              point.status === 'pending' ? 'in_progress' : 'completed'
                            )
                          }
                          className="flex h-6 px-2 rounded-sm text-[10px] font-medium transition-colors"
                          style={{
                            backgroundColor:
                              point.status === 'pending' ? '#2563eb' : '#10b981',
                            color: 'white',
                          }}
                        >
                          {point.status === 'pending' ? '进行中' : '完成'}
                        </button>
                      )}
                      <button
                        onClick={() => deleteProgressPoint(point.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-sm text-[#9ca3af] hover:bg-white hover:text-[#dc2626]"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Point Form */}
          {addingPoint && (
            <div className="mt-3 rounded-sm border border-[#2563eb] bg-[#eff6ff] p-2">
              <input
                type="text"
                value={newPointLabel}
                onChange={(e) => setNewPointLabel(e.target.value)}
                placeholder="输入进度节点名称..."
                className="w-full rounded-sm border border-[#2563eb] bg-white px-2 py-1 text-[12px] text-[#111827] outline-none placeholder:text-[#9ca3af]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addProgressPoint()
                  if (e.key === 'Escape') setAddingPoint(false)
                }}
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={addProgressPoint}
                  className="flex-1 h-6 rounded-sm bg-[#2563eb] text-[10px] font-medium text-white hover:bg-[#1d4ed8]"
                >
                  确认
                </button>
                <button
                  onClick={() => setAddingPoint(false)}
                  className="flex-1 h-6 rounded-sm border border-[#e5e7eb] text-[10px] text-[#6b7280] hover:bg-white"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {!addingPoint && (
            <button
              onClick={() => setAddingPoint(true)}
              className="mt-3 flex h-7 items-center justify-center rounded-sm border border-[#2563eb] text-[11px] font-medium text-[#2563eb] hover:bg-[#eff6ff]"
            >
              <ChevronDown size={12} className="mr-1" />
              添加进度节点
            </button>
          )}
        </div>

        {/* Right: Delivery & Documents */}
        <div className="w-72 shrink-0 flex flex-col border-l border-[#e5e7eb] p-4">
          {/* Delivery Status */}
          <div className="mb-4 rounded-sm border border-[#e5e7eb] bg-[#f9fafb] p-3">
            <p className="mb-2 text-[11px] font-medium text-[#6b7280]">交付状态</p>
            <div className="flex items-center gap-2">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  currentData.deliveryStatus === 'in_transit'
                    ? 'bg-[#f59e0b]'
                    : 'bg-[#10b981]'
                }`}
              />
              <span className="text-[12px] font-medium text-[#111827]">
                {currentData.deliveryStatus === 'in_transit' ? '配送中' : '已交付'}
              </span>
            </div>
          </div>

          {/* Final Document */}
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-medium text-[#6b7280]">最终凭证</p>
            {currentData.finalDocumentUrl ? (
              <div className="flex flex-col gap-2 rounded-sm border border-[#e5e7eb] bg-white p-3">
                <div className="flex h-20 items-center justify-center rounded-sm border border-[#e5e7eb] bg-[#f3f4f6]">
                  <button className="flex h-7 items-center gap-1 rounded-sm bg-[#2563eb] px-2 text-[10px] text-white hover:bg-[#1d4ed8]">
                    <Download size={12} />
                    下载
                  </button>
                </div>
                <p className="text-[10px] text-[#6b7280]">
                  已上传于{' '}
                  {new Date().toLocaleString('zh-CN')}
                </p>
              </div>
            ) : (
              <div className="flex h-20 items-center justify-center rounded-sm border-2 border-dashed border-[#d1d5db] bg-[#f9fafb]">
                <p className="text-[11px] text-[#9ca3af]">待上传最终凭证</p>
              </div>
            )}
          </div>

          {/* Completion Action */}
          {currentData.deliveryStatus === 'delivered' && (
            <button
              onClick={onCompleteDelivery}
              className="flex h-8 items-center justify-center rounded-sm bg-[#10b981] text-[12px] font-medium text-white hover:bg-[#059669]"
            >
              <CheckCircle size={13} className="mr-1" />
              完成交付并关闭
            </button>
          )}

          {/* Delivery Notes */}
          <div className="mt-auto pt-3 border-t border-[#e5e7eb]">
            <p className="mb-1 text-[11px] font-medium text-[#6b7280]">备注</p>
            <textarea
              placeholder="交付相关说明..."
              className="w-full h-16 rounded-sm border border-[#e5e7eb] p-2 text-[11px] text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#2563eb]"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
