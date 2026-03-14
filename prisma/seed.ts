import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始填充数据...')

  // ════════════════════════════════════════════════════════════════════════════
  // 1. 清空所有现有数据
  // ════════════════════════════════════════════════════════════════════════════
  console.log('🗑️  清空现有数据...')
  await prisma.actionLogAttachment.deleteMany({})
  await prisma.actionLog.deleteMany({})
  await prisma.expenseItem.deleteMany({})
  await prisma.refundItem.deleteMany({})
  await prisma.opportunityP8Data.deleteMany({})
  await prisma.progressPoint.deleteMany({})
  await prisma.opportunityP7Data.deleteMany({})
  await prisma.materialItem.deleteMany({})
  await prisma.opportunityP6Data.deleteMany({})
  await prisma.opportunityP5Data.deleteMany({})
  await prisma.opportunityP4Data.deleteMany({})
  await prisma.opportunityP3Data.deleteMany({})
  await prisma.opportunityP2Data.deleteMany({})
  await prisma.opportunity.deleteMany({})
  await prisma.domesticEntityAssociation.deleteMany({})
  await prisma.foreignCompanyEntity.deleteMany({})
  await prisma.customerContact.deleteMany({})
  await prisma.customer.deleteMany({})
  await prisma.lead.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.domesticEntity.deleteMany({})
  await prisma.user.deleteMany({})
  console.log('✅ 数据已清空\n')

  // ════════════════════════════════════════════════════════════════════════════
  // 2. 创建用户
  // ════════════════════════════════════════════════════════════════════════════
  console.log('👤 创建用户...')
  const mockUser = await prisma.user.create({
    data: {
      id: 'u1',
      name: '销售经理',
      email: 'sales@bantu.com',
      role: 'Sales Manager',
      company: 'Bantu CRM',
    },
  })
  console.log(`✅ 用户创建: ${mockUser.name}\n`)

  // ════════════════════════════════════════════════════════════════════════════
  // 3. 创建产品
  // ════════════════════════════════════════════════════════════════════════════
  console.log('📦 创建产品...')
  const mockProducts = [
    { productCode: 'zcrm_6302359000000489135', name: '落地签【B1】', category: '签证服务', price: 750000, currency: 'IDR', difficulty: 4 },
    { productCode: 'zcrm_6302359000000489136', name: '落地签【B1】电子签续签', category: '签证服务', price: 1000000, currency: 'IDR', difficulty: 5 },
    { productCode: 'zcrm_6302359000000489137', name: '落地签【B1】机场线下续签', category: '签证服务', price: 1700000, currency: 'IDR', difficulty: 1 },
    { productCode: 'zcrm_6302359000000489152', name: '公司注册-PMA(外资公司)', category: '公司开办服务', price: 15000000, currency: 'IDR', difficulty: 4 },
    { productCode: 'zcrm_6302359000000489163', name: '注册企业税卡', category: '税务服务', price: 1000000, currency: 'IDR', difficulty: 4 },
  ]

  const products = await Promise.all(
    mockProducts.map((p) =>
      prisma.product.create({
        data: {
          productCode: p.productCode,
          name: p.name,
          category: p.category,
          price: p.price,
          currency: p.currency,
          difficulty: p.difficulty,
          billingCycles: ['一次性'],
        },
      })
    )
  )
  console.log(`✅ 创建了 ${products.length} 个产品\n`)

  // ════════════════════════════════════════════════════════════════════════════
  // 4. 创建客户
  // ════════════════════════════════════════════════════════════════════════════
  console.log('🏢 创建客户...')
  const mockCustomers = [
    { customerId: 'c-21231231304', customerName: '极兔物流-总办', level: 'L4' },
    { customerId: 'c-21231231317', customerName: '青山矿业-苏拉威西项目', level: 'L4' },
    { customerId: 'c-21231231780', customerName: '华为印尼-人力资源部', level: 'L3' },
    { customerId: 'c-21231231905', customerName: '中建八局-雅加达分部', level: 'L3' },
    { customerId: 'c-21231231987', customerName: '个人散客-王伟', level: 'L6' },
    { customerId: 'c-21231231663', customerName: '泗水进出口贸易', level: 'L5' },
    { customerId: 'c-21231231087', customerName: '餐饮连锁-海底捞印尼', level: 'L4' },
    { customerId: 'c-21231231793', customerName: '万隆纺织厂-技术中心', level: 'L5' },
    { customerId: 'c-21231231609', customerName: '雅加达某Fintech公司', level: 'L5' },
    { customerId: 'c-21231231480', customerName: '个人中介-李方', level: 'L6' },
  ]

  const customers = await Promise.all(
    mockCustomers.map((c) =>
      prisma.customer.create({
        data: {
          customerId: c.customerId,
          customerName: c.customerName,
          level: c.level as any,
        },
      })
    )
  )
  console.log(`✅ 创建了 ${customers.length} 个客户\n`)

  // ════════════════════════════════════════════════════════════════════════════
  // 5. 创建线索
  // ════════════════════════════════════════════════════════════════════════════
  console.log('📞 创建线索...')
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        leadCode: 'LEAD-1001',
        wechatName: '山海图-王总',
        phone: '13800138000',
        source: 'wechat',
        category: 'VISA',
        budgetMin: 5000,
        budgetMax: 10000,
        budgetCurrency: 'CNY',
        urgency: 'HIGH',
        initialIntent: '想办 B1 签证，自雇商人',
        status: 'new',
        assigneeId: mockUser.id,
        nextFollowDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        lastActionAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        notes: '客户来自微信群，对B1签证很感兴趣，预计下周跟进',
      },
    }),
    prisma.lead.create({
      data: {
        leadCode: 'LEAD-1002',
        wechatName: '极兔物流-李总',
        phone: '13900139000',
        source: 'referral',
        category: 'VISA',
        budgetMin: 30000,
        budgetMax: 50000,
        budgetCurrency: 'CNY',
        urgency: 'MEDIUM',
        initialIntent: '需要办理商务签C211，团队5人',
        status: 'contacted',
        assigneeId: mockUser.id,
        nextFollowDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        lastActionAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.lead.create({
      data: {
        leadCode: 'LEAD-1004',
        wechatName: '东南亚投资-陈先生',
        phone: '13600136000',
        source: 'referral',
        category: 'VISA',
        budgetMin: 15000,
        budgetMax: 25000,
        budgetCurrency: 'CNY',
        urgency: 'HIGH',
        initialIntent: '咨询工作签办理，高管级别',
        status: 'ready_for_opportunity',
        assigneeId: mockUser.id,
        nextFollowDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        lastActionAt: new Date(),
      },
    }),
  ])
  console.log(`✅ 创建了 ${leads.length} 个线索\n`)

  // ════════════════════════════════════════════════════════════════════════════
  // 6. 创建商机
  // ════════════════════════════════════════════════════════════════════════════
  console.log('💼 创建商机...')
  const opportunities = await Promise.all([
    prisma.opportunity.create({
      data: {
        opportunityCode: 'OPP-21231231304',
        customerId: customers[0].id,
        stageId: 'P3',
        status: 'active',
        serviceType: 'VISA',
        serviceTypeLabel: '报价审核',
        estimatedAmount: 1000000,
        currency: 'IDR',
        requirements: '注册企业税卡',
        assigneeId: mockUser.id,
        createdAt: new Date('2026-01-14'),
        updatedAt: new Date('2026-01-14'),
      },
    }),
    prisma.opportunity.create({
      data: {
        opportunityCode: 'OPP-21231231317',
        customerId: customers[1].id,
        stageId: 'P6',
        status: 'active',
        serviceType: 'VISA',
        serviceTypeLabel: '资料提交',
        estimatedAmount: 1700000,
        currency: 'IDR',
        requirements: '落地签【B1】机场线下续签',
        assigneeId: mockUser.id,
        createdAt: new Date('2026-02-07'),
        updatedAt: new Date('2026-02-07'),
      },
    }),
    prisma.opportunity.create({
      data: {
        opportunityCode: 'OPP-21231231780',
        customerId: customers[2].id,
        stageId: 'P6',
        status: 'active',
        serviceType: 'VISA',
        serviceTypeLabel: '资料提交',
        estimatedAmount: 12500000,
        currency: 'IDR',
        requirements: '公司变更(PMA)',
        assigneeId: mockUser.id,
        createdAt: new Date('2026-02-07'),
        updatedAt: new Date('2026-02-07'),
      },
    }),
    prisma.opportunity.create({
      data: {
        opportunityCode: 'OPP-21231231905',
        customerId: customers[3].id,
        stageId: 'P1',
        status: 'active',
        serviceType: 'VISA',
        serviceTypeLabel: '需求记录',
        estimatedAmount: 5000000,
        currency: 'IDR',
        requirements: '商标注册',
        assigneeId: mockUser.id,
        createdAt: new Date('2026-02-22'),
        updatedAt: new Date('2026-02-22'),
      },
    }),
  ])
  console.log(`✅ 创建了 ${opportunities.length} 个商机\n`)

  // ════════════════════════════════════════════════════════════════════════════
  // 7. 创建商机的 P3 数据（报价）
  // ════════════════════════════════════════════════════════════════════════════
  console.log('💰 创建商机报价数据...')
  const p3Data = await prisma.opportunityP3Data.create({
    data: {
      opportunityId: opportunities[0].id,
      productId: products[4].id, // 注册企业税卡
      quantity: 1,
      lockedPrice: 1000000,
      currency: 'IDR',
      recommendedPrice: 1000000,
      costFloor: 800000,
      profitMargin: 25,
      approvalStatus: 'auto-approved',
      approvedAt: new Date(),
    },
  })
  console.log(`✅ 创建了报价数据\n`)

  // ════════════════════════════════════════════════════════════════════════════
  // 8. 创建操作日志
  // ════════════════════════════════════════════════════════════════════════════
  console.log('📝 创建操作日志...')
  const actionLogs = await Promise.all([
    prisma.actionLog.create({
      data: {
        opportunityId: opportunities[0].id,
        operatorId: mockUser.id,
        actionType: 'CREATE',
        actionLabel: '创建商机',
        timestamp: new Date('2026-01-14'),
      },
    }),
    prisma.actionLog.create({
      data: {
        opportunityId: opportunities[1].id,
        operatorId: mockUser.id,
        actionType: 'STAGE_CHANGE',
        actionLabel: '推进至 P6',
        remark: '资料已提交，等待审理',
        timestamp: new Date('2026-02-07'),
      },
    }),
  ])
  console.log(`✅ 创建了 ${actionLogs.length} 条操作日志\n`)

  console.log('✨ 数据填充完成！')
  console.log(`
📊 数据统计:
  - 用户: 1
  - 产品: ${products.length}
  - 客户: ${customers.length}
  - 线索: ${leads.length}
  - 商机: ${opportunities.length}
  - 操作日志: ${actionLogs.length}
  `)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ 数据填充错误:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
