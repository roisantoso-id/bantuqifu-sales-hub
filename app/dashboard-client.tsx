'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState, useMemo, useEffect } from 'react'
import { toast } from 'sonner'
import { PanelRightOpen } from 'lucide-react'
import { PrimarySidebar } from '@/components/layout/primary-sidebar'
import { SecondarySidebar } from '@/components/layout/secondary-sidebar'
import { WorkspacePane } from '@/components/workspace/workspace-pane'
import { CustomerManagement } from '@/components/customers/customer-management'
import { LeadManagementClient } from '@/components/leads/lead-management-client'
import { MyDashboard } from '@/components/dashboard/my-dashboard'
import { AuditRail } from '@/components/audit-rail/audit-panel'
import { OpportunityListView } from '@/components/opportunities/opportunity-list-view'
import { mockActionLogs, mockUser, mockLeads } from '@/lib/mock-data'
import { toggleOpportunityPinAction, getOpportunitiesAction, saveOpportunityItemsAction, getOpportunityWorkspaceAction, updateOpportunityAction, updateOpportunityStageAction, saveOpportunityP4DraftAction, submitOpportunityContractAction, saveOpportunityP5ReceiptAction, rejectOpportunityP5ReceiptAction, confirmOpportunityP5PaymentAction, createOpportunityNoteWithAttachmentsAction } from '@/app/actions/opportunity'
import { getProductsByCategoryAction } from '@/app/actions/product'
import type { Opportunity, NavSection, StageId, ActionLog, Lead, LeadRow, OpportunityRow, OpportunityStatus, Currency, Product, OpportunityP2Data, OpportunityP3Data, OpportunityP4Data } from '@/lib/types'

interface DashboardClientProps {
  initialNav: NavSection
  initialLeads: LeadRow[] | null
  initialOpportunities: OpportunityRow[] | null
  initialLeadTab: string
  initialLeadSearch: string
  selectedLeadId: string | null
  currentUserId?: string | null
}

const DEFAULT_SERVICE_TYPE: Opportunity['serviceType'] = 'VISA'

function buildP3Data(items: OpportunityP2Data[]): OpportunityP3Data[] {
  return items.map((item) => ({
    tempId: item.tempId,
    productId: item.productId,
    productName: item.productName,
    targetName: item.targetName,
    lockedPrice: item.basePrice,
    currency: item.currency,
    costFloor: item.costFloor,
    profitMargin: item.profitMargin,
    costPriceCny: item.costPriceCny,
    costPriceIdr: item.costPriceIdr,
    partnerPriceCny: item.partnerPriceCny,
    partnerPriceIdr: item.partnerPriceIdr,
    retailPriceCny: item.retailPriceCny,
    retailPriceIdr: item.retailPriceIdr,
    approvalStatus: 'auto-approved',
  }))
}

function mapOpportunityRowToOpportunity(
  opp: OpportunityRow,
  workspaceData?: {
    p2Data: OpportunityP2Data[]
    p3Data?: OpportunityP3Data[]
    p4Data?: OpportunityP4Data
    p5Data?: Opportunity['p5Data']
    p6Data?: Opportunity['p6Data']
    p7Data?: Opportunity['p7Data']
    p8Data?: Opportunity['p8Data']
  }
): Opportunity {
  const serviceType = (opp.serviceType as Opportunity['serviceType']) || DEFAULT_SERVICE_TYPE
  const p2Data = workspaceData?.p2Data ?? []
  const p3Data = workspaceData?.p3Data ?? buildP3Data(p2Data)

  return {
    id: opp.id,
    opportunityCode: opp.opportunityCode,
    customerId: opp.customerId,
    customer: {
      id: opp.customer?.id || opp.customerId,
      name: opp.customer?.customerName || '未知客户',
      passportNo: opp.customer?.passportNo || '',
      phone: opp.customer?.phone || '',
      email: opp.customer?.email || '',
      wechat: opp.customer?.wechat || '',
      level: 'L5',
    },
    stageId: opp.stageId as StageId,
    status: (opp.status as OpportunityStatus) || 'active',
    serviceType,
    serviceTypeLabel: opp.serviceTypeLabel || opp.serviceType,
    estimatedAmount: opp.estimatedAmount || 0,
    currency: (opp.currency as Currency) || 'IDR',
    requirements: opp.requirements || undefined,
    notes: opp.notes || undefined,
    destination: undefined,
    travelDate: undefined,
    assignee: '',
    createdAt: opp.createdAt,
    updatedAt: opp.updatedAt,
    expectedCloseDate: opp.expectedCloseDate || undefined,
    products: [],
    quote: undefined,
    pinnedByUsers: opp.pinnedByUsers || [],
    wechatGroupId: opp.wechatGroupId || undefined,
    wechatGroupName: opp.wechatGroupName || undefined,
    p2Data,
    p3Data,
    p4Data: workspaceData?.p4Data,
    p5Data: workspaceData?.p5Data,
    p6Data: workspaceData?.p6Data,
    p7Data: workspaceData?.p7Data,
    p8Data: workspaceData?.p8Data,
  } as Opportunity
}

function mergeOpportunityIntoList(opportunities: Opportunity[], updated: Opportunity): Opportunity[] {
  const exists = opportunities.some((opp) => opp.id === updated.id)

  if (!exists) {
    return [updated, ...opportunities]
  }

  return opportunities.map((opp) => (opp.id === updated.id ? updated : opp))
}

const STAGE_MAP: Record<StageId, StageId | null> = {
  P1: 'P2',
  P2: 'P3',
  P3: 'P4',
  P4: 'P5',
  P5: 'P6',
  P6: 'P7',
  P7: 'P8',
  P8: null,
}

function getPersistableP1Updates(opportunity: Opportunity) {
  return {
    requirements: opportunity.requirements ?? '',
    serviceType: opportunity.serviceType,
    serviceTypeLabel: opportunity.serviceTypeLabel,
    notes: opportunity.notes ?? '',
  }
}

export function DashboardClient({
  initialNav,
  initialLeads,
  initialOpportunities,
  initialLeadTab,
  initialLeadSearch,
  selectedLeadId,
  currentUserId,
}: DashboardClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // 从 URL 读取当前导航状态
  const activeNav = (searchParams.get('nav') || initialNav) as NavSection

  const initialOpportunityId = searchParams.get('oppId') || initialOpportunities?.[0]?.id || ''

  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    if (initialOpportunities && initialOpportunities.length > 0) {
      return initialOpportunities.map((opp) => mapOpportunityRowToOpportunity(opp))
    }
    return []
  })
  const [leads, setLeads] = useState<Lead[]>(mockLeads)
  const [selectedId, setSelectedId] = useState<string>(initialOpportunityId)
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null)
  const [isOpportunityLoading, setIsOpportunityLoading] = useState(false)
  const [viewingStage, setViewingStage] = useState<StageId>('P1')
  const [actionLogs, setActionLogs] = useState<Record<string, ActionLog[]>>(mockActionLogs)
  const [showAuditRail, setShowAuditRail] = useState(true)
  const [auditRailReloadToken, setAuditRailReloadToken] = useState(0)
  const [realProducts, setRealProducts] = useState<Product[]>([])
  const [productCategories, setProductCategories] = useState<Array<{ id: string; nameZh: string }>>([])

  // 加载真实产品数据
  useEffect(() => {
    getProductsByCategoryAction().then(groups => {
      setProductCategories(
        groups
          .filter(group => group.category)
          .map(group => ({ id: group.category!.id, nameZh: group.category!.nameZh }))
      )

      setRealProducts(
        groups.flatMap(group =>
          group.products.map(p => ({
            id: p.id,
            name: p.name,
            category: group.categoryName,
            categoryId: p.categoryId,
            categoryNameZh: p.categoryNameZh,
            price: p.price,
            currency: p.currency,
            description: p.description ?? undefined,
            difficulty: p.difficulty,
            billingCycles: ['一次性'],
          } as Product))
        )
      )
    })
  }, [])

  useEffect(() => {
    if (activeNav !== 'opportunities') return

    getOpportunitiesAction().then((data) => {
      if (!data) return
      setOpportunities((prev) => {
        const workspaceById = new Map(prev.map((opp) => [opp.id, opp]))
        return data.map((opp) => {
          const existing = workspaceById.get(opp.id)
          return mapOpportunityRowToOpportunity(opp, existing ? {
            p2Data: existing.p2Data || [],
            p3Data: existing.p3Data,
            p4Data: existing.p4Data,
            p5Data: existing.p5Data,
            p6Data: existing.p6Data,
            p7Data: existing.p7Data,
            p8Data: existing.p8Data,
          } : undefined)
        })
      })
    })
  }, [activeNav])

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selectedOpportunity = activeOpportunity
  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })

      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, pathname, router]
  )

  // 导航切换 - 更新 URL
  const handleNavChange = useCallback(
    (nav: NavSection) => {
      // 切换导航时清除其他参数
      const params = new URLSearchParams()
      params.set('nav', nav)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router]
  )

  // 切换到商机页时重新拉取数据
  useEffect(() => {
    if (activeNav !== 'opportunities') {
      return
    }

    const oppIdFromUrl = searchParams.get('oppId') || opportunities[0]?.id || ''
    if (oppIdFromUrl !== selectedId) {
      setSelectedId(oppIdFromUrl)
    }
  }, [activeNav, opportunities, searchParams, selectedId])

  useEffect(() => {
    if (activeNav !== 'opportunities' || !selectedId) {
      setActiveOpportunity(null)
      return
    }

    let cancelled = false

    setIsOpportunityLoading(true)
    setActiveOpportunity(null)

    getOpportunityWorkspaceAction(selectedId)
      .then((hydrated) => {
        if (cancelled || !hydrated) {
          if (!cancelled) {
            setActiveOpportunity(null)
          }
          return
        }

        const mapped = mapOpportunityRowToOpportunity(hydrated, {
          p2Data: hydrated.p2Data,
          p3Data: hydrated.p3Data,
          p4Data: hydrated.p4Data,
          p5Data: hydrated.p5Data,
          p6Data: hydrated.p6Data,
          p7Data: hydrated.p7Data,
          p8Data: hydrated.p8Data,
        })

        setOpportunities((prev) => mergeOpportunityIntoList(prev, mapped))
        setActiveOpportunity(mapped)
        setViewingStage(mapped.stageId)
      })
      .finally(() => {
        if (!cancelled) {
          setIsOpportunityLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeNav, selectedId])


  const reloadOpportunity = useCallback(
    async (oppId: string) => {
      const hydrated = await getOpportunityWorkspaceAction(oppId)
      if (!hydrated) {
        setActiveOpportunity((current) => (current?.id === oppId ? null : current))
        return null
      }

      const mapped = mapOpportunityRowToOpportunity(hydrated, {
        p2Data: hydrated.p2Data,
        p3Data: hydrated.p3Data,
        p4Data: hydrated.p4Data,
        p5Data: hydrated.p5Data,
        p6Data: hydrated.p6Data,
        p7Data: hydrated.p7Data,
        p8Data: hydrated.p8Data,
      })

      setOpportunities((prev) => mergeOpportunityIntoList(prev, mapped))
      setActiveOpportunity(mapped)
      return mapped
    },
    []
  )

  useEffect(() => {
    if (!selectedOpportunity?.id) {
      return
    }

    setAuditRailReloadToken((prev) => prev + 1)
  }, [selectedOpportunity?.id])

  const persistCurrentStageData = useCallback(
    async (opportunity: Opportunity, stage: StageId) => {
      if (stage === 'P1') {
        return updateOpportunityAction(opportunity.id, getPersistableP1Updates(opportunity))
      }

      if (stage === 'P2' || stage === 'P3') {
        const sourceItems = stage === 'P3' && opportunity.p3Data && opportunity.p3Data.length > 0
          ? opportunity.p3Data
          : (opportunity.p2Data || [])

        return saveOpportunityItemsAction(opportunity.id, sourceItems as Array<OpportunityP2Data | OpportunityP3Data>)
      }

      return { success: true }
    },
    []
  )

  const appendLog = useCallback(
    (oppId: string, log: Omit<ActionLog, 'id' | 'opportunityId' | 'operatorId' | 'operatorName' | 'timestamp'>) => {
      const entry: ActionLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        opportunityId: oppId,
        operatorId: mockUser.id,
        operatorName: mockUser.name,
        timestamp: new Date().toISOString(),
        ...log,
      }
      setActionLogs((prev) => ({
        ...prev,
        [oppId]: [...(prev[oppId] ?? []), entry],
      }))
    },
    []
  )

  const handleSelectOpportunity = (opp: Opportunity) => {
    setSelectedId(opp.id)
    updateUrl({ nav: 'opportunities', oppId: opp.id })
  }

  const handleOpportunityUpdate = (data: Partial<Opportunity>) => {
    if (!selectedId) {
      return
    }

    setActiveOpportunity((prev) =>
      prev && prev.id === selectedId ? { ...prev, ...data, updatedAt: new Date().toISOString() } : prev
    )
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === selectedId ? { ...o, ...data, updatedAt: new Date().toISOString() } : o
      )
    )
  }

  const handleSave = useCallback(
    async (stage: StageId = viewingStage) => {
      if (!selectedOpportunity) return false

      const result = await persistCurrentStageData(selectedOpportunity, stage)
      if (!result.success) {
        console.error(`[handleSave] Failed to save ${stage}:`, result.error)
        return false
      }

      const reloaded = await reloadOpportunity(selectedOpportunity.id)
      if (!reloaded) {
        return false
      }

      appendLog(selectedOpportunity.id, { actionType: 'FORM', actionLabel: '保存草稿', stageId: stage })
      return true
    },
    [appendLog, persistCurrentStageData, reloadOpportunity, selectedOpportunity, viewingStage]
  )

  const handleAdvanceStage = useCallback(
    async (stage: StageId = selectedOpportunity?.stageId || viewingStage) => {
      if (!selectedOpportunity) return false

      const next = STAGE_MAP[stage]
      if (!next) return false

      const saveResult = await persistCurrentStageData(selectedOpportunity, stage)
      if (!saveResult.success) {
        console.error(`[handleAdvanceStage] Failed to save ${stage}:`, saveResult.error)
        return false
      }

      const stageResult = await updateOpportunityStageAction(selectedOpportunity.id, next)
      if (!stageResult.success) {
        console.error('[handleAdvanceStage] Failed to advance stage:', stageResult.error)
        await reloadOpportunity(selectedOpportunity.id)
        return false
      }

      const reloaded = await reloadOpportunity(selectedOpportunity.id)
      if (!reloaded) {
        return false
      }

      setViewingStage(reloaded.stageId)
      appendLog(selectedOpportunity.id, {
        actionType: 'STAGE_CHANGE',
        actionLabel: `推进至 ${reloaded.stageId}`,
        remark: `从 ${stage} 推进`,
        stageId: reloaded.stageId,
      })
      return true
    },
    [appendLog, persistCurrentStageData, reloadOpportunity, selectedOpportunity, viewingStage]
  )

  const handleP4DraftSave = useCallback(
    async (data: OpportunityP4Data) => {
      if (!selectedOpportunity) {
        return { success: false, error: '未选择商机' }
      }

      const result = await saveOpportunityP4DraftAction(selectedOpportunity.id, data)
      if (!result.success) {
        console.error('[handleP4DraftSave] Failed:', result.error)
        return { success: false, error: result.error }
      }

      if (result.data) {
        const mapped = mapOpportunityRowToOpportunity(result.data, {
          p2Data: result.data.p2Data,
          p3Data: result.data.p3Data,
          p4Data: result.data.p4Data,
          p5Data: result.data.p5Data,
          p6Data: result.data.p6Data,
          p7Data: result.data.p7Data,
          p8Data: result.data.p8Data,
        })
        setOpportunities((prev) => mergeOpportunityIntoList(prev, mapped))
        setActiveOpportunity(mapped)
      } else {
        await reloadOpportunity(selectedOpportunity.id)
      }

      appendLog(selectedOpportunity.id, {
        actionType: 'FORM',
        actionLabel: '保存 P4 草稿',
        stageId: 'P4',
      })

      return { success: true }
    },
    [appendLog, reloadOpportunity, selectedOpportunity]
  )

  const handleP4Submit = useCallback(
    async (formData: FormData) => {
      if (!selectedOpportunity) {
        return { success: false, error: '未选择商机' }
      }

      const result = await submitOpportunityContractAction(selectedOpportunity.id, formData)
      if (!result.success) {
        console.error('[handleP4Submit] Failed:', result.error)
        return { success: false, error: result.error }
      }

      let nextOpportunity: Opportunity | null = null
      if (result.data) {
        nextOpportunity = mapOpportunityRowToOpportunity(result.data, {
          p2Data: result.data.p2Data,
          p3Data: result.data.p3Data,
          p4Data: result.data.p4Data,
          p5Data: result.data.p5Data,
          p6Data: result.data.p6Data,
          p7Data: result.data.p7Data,
          p8Data: result.data.p8Data,
        })
        setOpportunities((prev) => mergeOpportunityIntoList(prev, nextOpportunity!))
        setActiveOpportunity(nextOpportunity)
      } else {
        nextOpportunity = await reloadOpportunity(selectedOpportunity.id)
      }

      if (nextOpportunity) {
        setViewingStage(nextOpportunity.stageId)
      }

      appendLog(selectedOpportunity.id, {
        actionType: 'STAGE_CHANGE',
        actionLabel: '提交合同并推进至 P5',
        remark: '合同已上传到 OSS 并完成持久化',
        stageId: 'P5',
      })

      return { success: true }
    },
    [appendLog, reloadOpportunity, selectedOpportunity]
  )

  const handleP5UploadReceipt = useCallback(
    async (formData: FormData) => {
      if (!selectedOpportunity) {
        return { success: false, error: '未选择商机' }
      }

      const result = await saveOpportunityP5ReceiptAction(selectedOpportunity.id, formData)
      if (!result.success) {
        console.error('[handleP5UploadReceipt] Failed:', result.error)
        return { success: false, error: result.error }
      }

      if (result.data) {
        const mapped = mapOpportunityRowToOpportunity(result.data, {
          p2Data: result.data.p2Data,
          p3Data: result.data.p3Data,
          p4Data: result.data.p4Data,
          p5Data: result.data.p5Data,
          p6Data: result.data.p6Data,
          p7Data: result.data.p7Data,
          p8Data: result.data.p8Data,
        })
        setOpportunities((prev) => mergeOpportunityIntoList(prev, mapped))
        setActiveOpportunity(mapped)
      } else {
        await reloadOpportunity(selectedOpportunity.id)
      }

      setAuditRailReloadToken((prev) => prev + 1)
      return { success: true }
    },
    [reloadOpportunity, selectedOpportunity]
  )

  const handleP5RejectReceipt = useCallback(
    async (reason: string) => {
      if (!selectedOpportunity) {
        return { success: false, error: '未选择商机' }
      }

      const result = await rejectOpportunityP5ReceiptAction(selectedOpportunity.id, reason)
      if (!result.success) {
        console.error('[handleP5RejectReceipt] Failed:', result.error)
        return { success: false, error: result.error }
      }

      if (result.data) {
        const mapped = mapOpportunityRowToOpportunity(result.data, {
          p2Data: result.data.p2Data,
          p3Data: result.data.p3Data,
          p4Data: result.data.p4Data,
          p5Data: result.data.p5Data,
          p6Data: result.data.p6Data,
          p7Data: result.data.p7Data,
          p8Data: result.data.p8Data,
        })
        setOpportunities((prev) => mergeOpportunityIntoList(prev, mapped))
        setActiveOpportunity(mapped)
      } else {
        await reloadOpportunity(selectedOpportunity.id)
      }

      setAuditRailReloadToken((prev) => prev + 1)
      return { success: true }
    },
    [reloadOpportunity, selectedOpportunity]
  )

  const handleP5ConfirmPayment = useCallback(
    async (payload: { receivedAmount: number }) => {
      if (!selectedOpportunity) {
        return { success: false, error: '未选择商机' }
      }

      const result = await confirmOpportunityP5PaymentAction(selectedOpportunity.id, payload)
      if (!result.success) {
        console.error('[handleP5ConfirmPayment] Failed:', result.error)
        return { success: false, error: result.error }
      }

      let nextOpportunity: Opportunity | null = null
      if (result.data) {
        nextOpportunity = mapOpportunityRowToOpportunity(result.data, {
          p2Data: result.data.p2Data,
          p3Data: result.data.p3Data,
          p4Data: result.data.p4Data,
          p5Data: result.data.p5Data,
          p6Data: result.data.p6Data,
          p7Data: result.data.p7Data,
          p8Data: result.data.p8Data,
        })
        setOpportunities((prev) => mergeOpportunityIntoList(prev, nextOpportunity!))
        setActiveOpportunity(nextOpportunity)
      } else {
        nextOpportunity = await reloadOpportunity(selectedOpportunity.id)
      }

      if (nextOpportunity) {
        setViewingStage(nextOpportunity.stageId)
      }

      setAuditRailReloadToken((prev) => prev + 1)
      return { success: true }
    },
    [reloadOpportunity, selectedOpportunity]
  )

  const handleQuoteSent = () => {
    appendLog(selectedId, {
      actionType: 'QUOTE',
      actionLabel: '发送报价',
      remark: '报价单已通过邮件/微信发送给客户',
    })
  }

  const handleAddNote = useCallback(
    async (remark: string, files: File[]) => {
      if (!selectedId) {
        return
      }

      const formData = new FormData()
      formData.set('opportunityId', selectedId)
      formData.set('content', remark)
      files.forEach((file) => {
        formData.append('files', file)
      })

      const result = await createOpportunityNoteWithAttachmentsAction(formData)

      if (!result.success) {
        throw new Error(result.error || '保存备注失败')
      }

      if (result.attachmentErrors?.length) {
        toast.warning('备注已保存，部分附件上传失败', {
          description: result.attachmentErrors.join('；'),
        })
      }

      setAuditRailReloadToken((prev) => prev + 1)
    },
    [selectedId]
  )

  const handleTogglePin = useCallback(
    async (oppId: string, isPinned: boolean) => {
      try {
        const result = await toggleOpportunityPinAction(oppId, isPinned)
        if (result.success) {
          const updatedOpps = await getOpportunitiesAction()
          if (updatedOpps && updatedOpps.length > 0) {
            setOpportunities((prev) => {
              const workspaceById = new Map(prev.map((opp) => [opp.id, opp]))
              return updatedOpps.map((opp) => {
                const existing = workspaceById.get(opp.id)
                return mapOpportunityRowToOpportunity(opp, existing ? {
                  p2Data: existing.p2Data || [],
                  p3Data: existing.p3Data,
                  p4Data: existing.p4Data,
                } : undefined)
              })
            })
          }
        }
      } catch (err) {
        console.error('[v0] Error toggling pin:', err)
      }
    },
    []
  )

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Pane 1 — 主导航栏 (56px) */}
      <PrimarySidebar activeNav={activeNav} onNavChange={handleNavChange} userName={mockUser.name} />

      {/* Pane 2+ — 根据 activeNav 显示不同内容 */}
      {activeNav === 'leads' ? (
        <div className="flex-1 overflow-hidden">
          <LeadManagementClient
            initialLeads={initialLeads || []}
            initialTab={initialLeadTab === 'pool' ? 'pool' : 'my_leads'}
            initialSearch={initialLeadSearch}
            initialLeadId={selectedLeadId}
          />
        </div>
      ) : activeNav === 'opportunities' ? (
        <div className="relative flex flex-1 overflow-hidden">
          {/* 商机列表 (280px) */}
          <SecondarySidebar
            opportunities={opportunities}
            selectedId={selectedId}
            onSelect={handleSelectOpportunity}
            onTogglePin={handleTogglePin}
            currentUserId={currentUserId || mockUser.id}
          />

          {/* 工作区 (flex-1) */}
          {isOpportunityLoading ? (
            <div className="flex h-full flex-1 items-center justify-center bg-white text-[14px] text-[#6b7280]">
              正在加载商机数据...
            </div>
          ) : (
            <WorkspacePane
              key={selectedOpportunity?.id || selectedId || 'empty-opportunity'}
              opportunity={selectedOpportunity}
              allProducts={realProducts.map(product => ({
                ...product,
                category: product.categoryNameZh || product.category,
              }))}
              productCategories={productCategories}
              viewingStage={viewingStage}
              onViewingStageChange={setViewingStage}
              onOpportunityUpdate={handleOpportunityUpdate}
              onSave={handleSave}
              onAdvanceStage={handleAdvanceStage}
              onP4DraftSave={handleP4DraftSave}
              onP4Submit={handleP4Submit}
              onP5UploadReceipt={handleP5UploadReceipt}
              onP5RejectReceipt={handleP5RejectReceipt}
              onP5ConfirmPayment={handleP5ConfirmPayment}
              onQuoteSent={handleQuoteSent}
            />
          )}

          {!showAuditRail && selectedOpportunity ? (
            <button
              type="button"
              onClick={() => {
                setShowAuditRail(true)
                setAuditRailReloadToken((prev) => prev + 1)
              }}
              className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#6b7280] shadow-sm transition hover:text-[#111827]"
              aria-label="重新打开跟进记录"
              title="重新打开跟进记录"
            >
              <PanelRightOpen size={16} />
            </button>
          ) : null}

          <AuditRail
            visible={showAuditRail}
            onToggle={setShowAuditRail}
            opportunity={selectedOpportunity}
            reloadToken={auditRailReloadToken}
            onAddNote={handleAddNote}
          />
        </div>
      ) : activeNav === 'oppolist' ? (
        <div className="flex-1 overflow-hidden">
          <OpportunityListView />
        </div>
      ) : activeNav === 'customers' ? (
        <div className="flex-1 overflow-hidden">
          <CustomerManagement />
        </div>
      ) : activeNav === 'analytics' ? (
        <div className="flex-1 overflow-hidden">
          <MyDashboard
            opportunities={opportunities}
            leads={leads}
            actionLogs={actionLogs}
            assignee={mockUser.name}
            userName={mockUser.name}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#9ca3af]">
          <div className="text-center">
            <div className="text-[14px] font-medium mb-2">此模块在建设中</div>
            <div className="text-[12px]">敬请期待</div>
          </div>
        </div>
      )}
    </div>
  )
}
