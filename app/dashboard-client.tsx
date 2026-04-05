'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState, useMemo, useEffect } from 'react'
import { PrimarySidebar } from '@/components/layout/primary-sidebar'
import { SecondarySidebar } from '@/components/layout/secondary-sidebar'
import { WorkspacePane } from '@/components/workspace/workspace-pane'
import { CustomerManagement } from '@/components/customers/customer-management'
import { LeadManagementClient } from '@/components/leads/lead-management-client'
import { MyDashboard } from '@/components/dashboard/my-dashboard'
import { AuditRail } from '@/components/audit-rail/audit-panel'
import { OpportunityListView } from '@/components/opportunities/opportunity-list-view'
import { mockActionLogs, mockUser, mockLeads } from '@/lib/mock-data'
import { addAuditNote } from '@/app/actions/audit'
import { toggleOpportunityPinAction, getOpportunitiesAction, saveOpportunityItemsAction, getOpportunityItemsAction } from '@/app/actions/opportunity'
import { getProductsByCategoryAction } from '@/app/actions/product'
import type { Opportunity, NavSection, StageId, ActionLog, Lead, LeadRow, OpportunityRow, OpportunityStatus, Currency, Product } from '@/lib/types'

interface DashboardClientProps {
  initialNav: NavSection
  initialLeads: LeadRow[] | null
  initialOpportunities: OpportunityRow[] | null
  initialLeadTab: string
  initialLeadSearch: string
  selectedLeadId: string | null
  currentUserId?: string | null
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

  // 商机相关状态 - 使用真实数据或 mock 数据
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    if (initialOpportunities && initialOpportunities.length > 0) {
      return initialOpportunities.map(opp => ({
        id: opp.id,
        opportunityCode: opp.opportunityCode,
        customerId: opp.customerId,
        customerName: opp.customer?.customerName || '未知客户',
        customer: {
          id: opp.customer?.id || opp.customerId,
          name: opp.customer?.customerName || '未知客户',
          passportNo: opp.customer?.customerId || '',
          phone: '',
          email: '',
          wechat: '',
          level: 'L5' as const,
          industry: '',
          country: 'Indonesia',
        },
        stageId: opp.stageId as StageId,
        status: (opp.status as OpportunityStatus) || 'active',
        serviceType: (opp.serviceType as 'VISA' | 'COMPANY_REGISTRATION' | 'FACTORY_SETUP' | 'TAX_SERVICES' | 'PERMIT_SERVICES' | 'FINANCIAL_SERVICES' | 'IMMIGRATION' | 'OTHER') || 'VISA',
        serviceTypeLabel: opp.serviceTypeLabel || opp.serviceType,
        estimatedAmount: opp.estimatedAmount || 0,
        currency: (opp.currency as Currency) || 'IDR',
        requirements: opp.requirements || undefined,
        notes: opp.notes || undefined,
        wechatGroupId: opp.wechatGroupId || undefined,
        wechatGroupName: opp.wechatGroupName || undefined,
        destination: undefined,
        travelDate: undefined,
        assignee: '',
        createdAt: opp.createdAt,
        updatedAt: opp.updatedAt,
        expectedCloseDate: opp.expectedCloseDate || undefined,
        products: [],
        quote: undefined,
        pinnedByUsers: opp.pinnedByUsers || [],
      } as any))
    }
    return []
  })
  const [leads, setLeads] = useState<Lead[]>(mockLeads)
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialOpportunities && initialOpportunities.length > 0) {
      return initialOpportunities[0].id
    }
    return ''
  })
  const [viewingStage, setViewingStage] = useState<StageId>(() => {
    if (initialOpportunities && initialOpportunities.length > 0) {
      return initialOpportunities[0].stageId as StageId
    }
    return 'P1'
  })
  const [actionLogs, setActionLogs] = useState<Record<string, ActionLog[]>>(mockActionLogs)
  const [showAuditRail, setShowAuditRail] = useState(true)
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

  // URL 更新辅助函数
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
    if (activeNav !== 'opportunities') return
    getOpportunitiesAction().then(async (data) => {
      if (!data) return

      const opportunitiesWithItems = await Promise.all(
        data.map(async (opp) => {
          const p2Data = await getOpportunityItemsAction(opp.id)
          const p3Data = p2Data.map((item) => ({
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
            approvalStatus: 'auto-approved' as const,
          }))
          return {
            id: opp.id,
            opportunityCode: opp.opportunityCode,
            customerId: opp.customerId,
            customerName: opp.customer?.customerName || '未知客户',
            customer: {
              id: opp.customer?.id || opp.customerId,
              name: opp.customer?.customerName || '未知客户',
              passportNo: opp.customer?.customerId || '',
              phone: '',
              email: '',
              wechat: '',
              level: 'L5' as const,
              industry: '',
              country: 'Indonesia',
            },
            stageId: opp.stageId as StageId,
            status: (opp.status as OpportunityStatus) || 'active',
            serviceType: (opp.serviceType as 'VISA' | 'COMPANY_REGISTRATION' | 'FACTORY_SETUP' | 'TAX_SERVICES' | 'PERMIT_SERVICES' | 'FINANCIAL_SERVICES' | 'IMMIGRATION' | 'OTHER') || 'VISA',
            serviceTypeLabel: opp.serviceTypeLabel || opp.serviceType,
            estimatedAmount: opp.estimatedAmount || 0,
            currency: (opp.currency as Currency) || 'IDR',
            requirements: opp.requirements || undefined,
            notes: opp.notes || undefined,
            wechatGroupId: opp.wechatGroupId || undefined,
            wechatGroupName: opp.wechatGroupName || undefined,
            destination: undefined,
            travelDate: undefined,
            assignee: '',
            createdAt: opp.createdAt,
            updatedAt: opp.updatedAt,
            expectedCloseDate: opp.expectedCloseDate || undefined,
            products: [],
            quote: undefined,
            p2Data,
            p3Data,
            pinnedByUsers: opp.pinnedByUsers || [],
          } as any
        })
      )

      setOpportunities(opportunitiesWithItems)
    })
  }, [activeNav])

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selectedOpportunity = useMemo(
    () => opportunities.find((o) => o.id === selectedId) ?? opportunities[0],
    [opportunities, selectedId]
  )

  const currentLogs = useMemo(() => actionLogs[selectedId] ?? [], [actionLogs, selectedId])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const reloadOpportunityItems = useCallback(
    async (oppId: string) => {
      const items = await getOpportunityItemsAction(oppId)
      const p3Data = items.map((item) => ({
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
        approvalStatus: item.approvalStatus || 'auto-approved' as const,
      }))

      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === oppId
            ? { ...o, p2Data: items, p3Data, updatedAt: new Date().toISOString() }
            : o
        )
      )
    },
    []
  )

  const appendLog = useCallback(
    (oppId: string, log: Omit<ActionLog, 'id' | 'opportunityId' | 'operatorId' | 'operatorName'>) => {
      const entry: ActionLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        opportunityId: oppId,
        operatorId: mockUser.id,
        operatorName: mockUser.name,
        ...log,
      }
      setActionLogs((prev) => ({
        ...prev,
        [oppId]: [...(prev[oppId] ?? []), entry],
      }))
    },
    []
  )

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSelectOpportunity = (opp: Opportunity) => {
    setSelectedId(opp.id)
    setViewingStage(opp.stageId)
  }

  const handleOpportunityUpdate = (data: Partial<Opportunity>) => {
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === selectedId ? { ...o, ...data, updatedAt: new Date().toISOString() } : o
      )
    )
  }

  const handleSave = async () => {
    if (!selectedOpportunity) return

    if (viewingStage === 'P2' || viewingStage === 'P3') {
      const sourceItems = viewingStage === 'P3' && selectedOpportunity.p3Data && selectedOpportunity.p3Data.length > 0
        ? selectedOpportunity.p3Data
        : (selectedOpportunity.p2Data || [])

      const result = await saveOpportunityItemsAction(selectedOpportunity.id, sourceItems as any)
      if (!result.success) {
        console.error(`[handleSave] Failed to save ${viewingStage} items:`, result.error)
        return
      }

      await reloadOpportunityItems(selectedOpportunity.id)
    }

    appendLog(selectedId, { actionType: 'FORM', actionLabel: '保存草稿' })
  }

  const handleAdvanceStage = () => {
    const stageMap: Record<StageId, StageId | null> = {
      P1: 'P2',
      P2: 'P3',
      P3: 'P4',
      P4: 'P5',
      P5: 'P6',
      P6: 'P7',
      P7: 'P8',
      P8: null,
    }
    const next = stageMap[selectedOpportunity.stageId]
    if (!next) return
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === selectedId ? { ...o, stageId: next, updatedAt: new Date().toISOString() } : o
      )
    )
    setViewingStage(next)
    appendLog(selectedId, {
      actionType: 'STAGE_CHANGE',
      actionLabel: `推进至 ${next}`,
      remark: `从 ${selectedOpportunity.stageId} 推进`,
    })
  }

  const handleQuoteSent = () => {
    appendLog(selectedId, {
      actionType: 'QUOTE',
      actionLabel: '发送报价',
      remark: '报价单已通过邮件/微信发送给客户',
    })
  }

  const handleAddNote = useCallback(
    async (remark: string, files: File[]) => {
      try {
        const newLog = await addAuditNote(selectedId, remark, files)
        setActionLogs((prev) => ({
          ...prev,
          [selectedId]: [...(prev[selectedId] ?? []), newLog],
        }))
      } catch (err) {
        console.error('[v0] Error adding note:', err)
        throw err
      }
    },
    [selectedId]
  )

  const handleTogglePin = useCallback(
    async (oppId: string, isPinned: boolean) => {
      try {
        const result = await toggleOpportunityPinAction(oppId, isPinned)
        if (result.success) {
          // 重新加载商机列表以获取最新的置顶状态
          const updatedOpps = await getOpportunitiesAction()
          if (updatedOpps && updatedOpps.length > 0) {
            setOpportunities(updatedOpps.map(opp => ({
              id: opp.id,
              customerId: opp.customerId,
              customerName: opp.customer?.customerName || '未知客户',
              customer: {
                id: opp.customer?.id || opp.customerId,
                name: opp.customer?.customerName || '未知客户',
                passportNo: opp.opportunityCode,
                phone: '',
                email: '',
                wechat: '',
                level: 'L5' as const,
                industry: '',
                country: 'Indonesia',
              },
              stageId: opp.stageId as StageId,
              status: (opp.status as OpportunityStatus) || 'active',
              serviceType: (opp.serviceType as 'VISA' | 'COMPANY_REGISTRATION' | 'FACTORY_SETUP' | 'TAX_SERVICES' | 'PERMIT_SERVICES' | 'FINANCIAL_SERVICES' | 'IMMIGRATION' | 'OTHER') || 'VISA',
              serviceTypeLabel: opp.serviceTypeLabel || opp.serviceType,
              estimatedAmount: opp.estimatedAmount || 0,
              currency: (opp.currency as Currency) || 'IDR',
              requirements: opp.requirements || undefined,
              notes: opp.notes || undefined,
              destination: undefined,
              travelDate: undefined,
              assignee: '',
              wechatGroupId: opp.wechatGroupId ?? null,
              wechatGroupName: opp.wechatGroupName ?? null,
              createdAt: opp.createdAt,
              updatedAt: opp.updatedAt,
              expectedCloseDate: opp.expectedCloseDate || undefined,
              products: [],
              quote: undefined,
              pinnedByUsers: opp.pinnedByUsers || [],
            } as any)))
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
        <>
          {/* 商机列表 (280px) */}
          <SecondarySidebar
            opportunities={opportunities}
            selectedId={selectedId}
            onSelect={handleSelectOpportunity}
            onTogglePin={handleTogglePin}
            currentUserId={currentUserId || mockUser.id}
          />

          {/* 工作区 (flex-1) */}
          <WorkspacePane
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
            onQuoteSent={handleQuoteSent}
          />

          {/* 审计栏 (256px) */}
          <AuditRail
            visible={showAuditRail}
            onToggle={setShowAuditRail}
            opportunity={selectedOpportunity}
            logs={currentLogs}
            onAddNote={handleAddNote}
          />
        </>
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
