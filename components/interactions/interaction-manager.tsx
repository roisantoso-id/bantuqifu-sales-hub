'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, RefreshCw } from 'lucide-react'

import {
  createInteractionAction,
  getInteractionAttachmentsAction,
  getOpportunityTimelineWithLeadHistoryAction,
  getTimelineAction,
  type InteractionAttachmentRow,
  type InteractionRow,
} from '@/app/actions/interaction'
import { InteractionForm, type InteractionFormValues } from '@/components/interactions/interaction-form'
import {
  InteractionTimeline,
  type InteractionTimelineItem,
} from '@/components/interactions/interaction-timeline'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface InteractionManagerProps {
  organizationId: string
  customerId: string
  targetType: 'lead' | 'opportunity'
  targetId: string
  leadIdForOpportunity?: string
}

async function hydrateAttachments(rows: InteractionRow[]): Promise<InteractionTimelineItem[]> {
  const attachmentEntries = await Promise.all(
    rows.map(async (row) => {
      try {
        const result = await getInteractionAttachmentsAction({ interactionId: row.id })
        return [row.id, result.success ? result.data || [] : []] as const
      } catch (error) {
        console.error('[hydrateAttachments] Failed to load attachments:', error)
        return [row.id, []] as const
      }
    })
  )

  const attachmentMap = new Map<string, InteractionAttachmentRow[]>(attachmentEntries)

  return rows.map((row) => ({
    ...row,
    attachments: attachmentMap.get(row.id) || [],
  }))
}

export function InteractionManager({
  organizationId,
  customerId,
  targetType,
  targetId,
  leadIdForOpportunity,
}: InteractionManagerProps) {
  const [items, setItems] = useState<InteractionTimelineItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const title = useMemo(() => (targetType === 'lead' ? '线索互动记录' : '商机互动记录'), [targetType])

  const loadTimeline = useCallback(async () => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setIsLoading(true)
    setError(null)

    try {
      const result =
        targetType === 'opportunity' && leadIdForOpportunity
          ? await getOpportunityTimelineWithLeadHistoryAction({
              organizationId,
              opportunityId: targetId,
              leadId: leadIdForOpportunity,
            })
          : await getTimelineAction({
              organizationId,
              customerId,
              leadId: targetType === 'lead' ? targetId : undefined,
              opportunityId: targetType === 'opportunity' ? targetId : undefined,
            })

      if (!result.success) {
        if (requestIdRef.current !== requestId) {
          return
        }

        setError(result.error || '获取互动记录失败，请稍后重试')
        setItems([])
        return
      }

      const hydrated = await hydrateAttachments(result.data || [])

      if (requestIdRef.current !== requestId) {
        return
      }

      setItems(hydrated)
    } catch (loadError) {
      console.error('[InteractionManager] Failed to load timeline:', loadError)

      if (requestIdRef.current !== requestId) {
        return
      }

      setError('获取互动记录失败，请稍后重试')
      setItems([])
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [customerId, leadIdForOpportunity, organizationId, targetId, targetType])

  useEffect(() => {
    void loadTimeline()
  }, [loadTimeline])

  const handleSubmit = useCallback(
    async (values: InteractionFormValues) => {
      setIsSubmitting(true)

      try {
        const result = await createInteractionAction({
          organizationId,
          customerId,
          leadId: targetType === 'lead' ? targetId : null,
          opportunityId: targetType === 'opportunity' ? targetId : null,
          type: values.type,
          content: values.content,
          nextAction: values.nextAction || null,
          nextActionDate: values.nextActionDate || null,
        })

        if (!result.success || !result.data) {
          setError(result.error || '提交互动记录失败，请稍后重试')
          return false
        }

        setError(null)
        setItems((current) => [
          {
            ...result.data,
            attachments: [],
          },
          ...current,
        ])

        return true
      } catch (submitError) {
        console.error('[InteractionManager] Failed to create interaction:', submitError)
        setError('提交互动记录失败，请稍后重试')
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [customerId, organizationId, targetId, targetType]
  )

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800">{title}</div>
            <div className="text-[11px] text-slate-500">共 {items.length} 条记录</div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => void loadTimeline()}
          disabled={isLoading}
          className="text-slate-500 hover:text-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 py-3">
        <InteractionTimeline items={items} isLoading={isLoading} error={error} onRetry={() => void loadTimeline()} />
      </ScrollArea>

      <div className="border-t border-slate-200 px-4 py-3">
        <InteractionForm onSubmit={handleSubmit} loading={isSubmitting} />
      </div>
    </div>
  )
}
