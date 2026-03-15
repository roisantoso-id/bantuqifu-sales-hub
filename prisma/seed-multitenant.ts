import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 开始初始化多租户 RBAC 系统...\n')

  // ═══════════════════════════════════════════════════════════════════════════
  // 第一步：创建两个租户 (Organizations)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📦 1. 创建租户...')
  
  const orgID = await prisma.organization.upsert({
    where: { code: 'BANTU_ID' },
    update: {},
    create: {
      code: 'BANTU_ID',
      name: '班兔印尼 Site',
      site: 'ID',
    },
  })
  console.log(`   ✓ 班兔印尼: ${orgID.id}`)

  const orgCN = await prisma.organization.upsert({
    where: { code: 'BANTU_CN' },
    update: {},
    create: {
      code: 'BANTU_CN',
      name: '班兔中国 Site',
      site: 'CN',
    },
  })
  console.log(`   ✓ 班兔中国: ${orgCN.id}\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 第二步：创建权限系统
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🔐 2. 创建权限...')

  const permissions = [
    // CRM 模块
    { code: 'leads:view', name: '查看线索', module: 'CRM' },
    { code: 'leads:create', name: '创建线索', module: 'CRM' },
    { code: 'leads:edit', name: '编辑线索', module: 'CRM' },
    { code: 'leads:delete', name: '删除线索', module: 'CRM' },
    
    { code: 'opportunities:view', name: '查看商机', module: 'CRM' },
    { code: 'opportunities:create', name: '创建商机', module: 'CRM' },
    { code: 'opportunities:edit', name: '编辑商机', module: 'CRM' },
    { code: 'opportunities:advance', name: '推进阶段', module: 'CRM' },
    
    { code: 'customers:view', name: '查看客户', module: 'CRM' },
    { code: 'customers:create', name: '创建客户', module: 'CRM' },
    { code: 'customers:edit', name: '编辑客户', module: 'CRM' },
    
    // 财务模块
    { code: 'quotes:view', name: '查看报价', module: 'FINANCE' },
    { code: 'quotes:approve', name: '批准报价', module: 'FINANCE' },
    { code: 'payments:view', name: '查看支付', module: 'FINANCE' },
    { code: 'payments:record', name: '记录支付', module: 'FINANCE' },
    
    // 管理员模块
    { code: 'admin:users', name: '管理用户', module: 'ADMIN' },
    { code: 'admin:roles', name: '管理角色', module: 'ADMIN' },
    { code: 'admin:settings', name: '系统设置', module: 'ADMIN' },
  ]

  const permissionMap: Record<string, string> = {}
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    })
    permissionMap[perm.code] = p.id
    console.log(`   ✓ ${perm.code}`)
  }
  console.log()

  // ═══════════════════════════════════════════════════════════════════════════
  // 第三步：创建角色
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('👥 3. 创建角色...')

  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      code: 'ADMIN',
      name: '系统管理员',
      permissions: {
        create: permissions.map(p => ({
          permissionId: permissionMap[p.code],
        })),
      },
    },
  })
  console.log(`   ✓ ADMIN: ${adminRole.id}`)

  const salesRole = await prisma.role.upsert({
    where: { code: 'SALES' },
    update: {},
    create: {
      code: 'SALES',
      name: '销售专员',
      permissions: {
        create: [
          'leads:view', 'leads:create', 'leads:edit',
          'opportunities:view', 'opportunities:create', 'opportunities:edit', 'opportunities:advance',
          'customers:view', 'customers:create', 'customers:edit',
          'quotes:view', 'payments:view',
        ].map(code => ({ permissionId: permissionMap[code] })),
      },
    },
  })
  console.log(`   ✓ SALES: ${salesRole.id}`)

  const financeRole = await prisma.role.upsert({
    where: { code: 'FINANCE' },
    update: {},
    create: {
      code: 'FINANCE',
      name: '财务专员',
      permissions: {
        create: [
          'quotes:view', 'quotes:approve',
          'payments:view', 'payments:record',
        ].map(code => ({ permissionId: permissionMap[code] })),
      },
    },
  })
  console.log(`   ✓ FINANCE: ${financeRole.id}\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 第四步：创建测试用户
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('👤 4. 创建测试用户...')

  // 注意：这里的 ID 应该与 Supabase auth.users.id 一致
  // 如果您已有 Supabase 账户，请替换为实际的 UUID
  const testUserId = '00000000-0000-0000-0000-000000000001'

  const testUser = await prisma.user.upsert({
    where: { email: 'admin@bantuqifu.com' },
    update: {},
    create: {
      id: testUserId,
      email: 'admin@bantuqifu.com',
      name: '系统超级管理员',
      isActive: true,
    },
  })
  console.log(`   ✓ admin@bantuqifu.com: ${testUser.id}\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 第五步：将用户绑定到租户并分配角色
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🔗 5. 分配用户到租户...')

  // 在印尼站是 ADMIN
  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: {
        userId: testUser.id,
        organizationId: orgID.id,
      },
    },
    update: { roleId: adminRole.id },
    create: {
      userId: testUser.id,
      organizationId: orgID.id,
      roleId: adminRole.id,
    },
  })
  console.log(`   ✓ admin 分配到班兔印尼 (ADMIN 角色)`)

  // 在中国站也是 ADMIN
  await prisma.userOrganization.upsert({
    where: {
      userId_organizationId: {
        userId: testUser.id,
        organizationId: orgCN.id,
      },
    },
    update: { roleId: adminRole.id },
    create: {
      userId: testUser.id,
      organizationId: orgCN.id,
      roleId: adminRole.id,
    },
  })
  console.log(`   ✓ admin 分配到班兔中国 (ADMIN 角色)\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 第六步：创建测试数据（客户、线索、商机）
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📊 6. 创建测试数据...')

  // 创建客户
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        organizationId: orgID.id,
        customerId: 'CUS-260315-0001',
        customerName: '极兔物流-总办',
        level: 'L4',
        phone: '+62-21-12345678',
        email: 'jtexpress@example.com',
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: orgID.id,
        customerId: 'CUS-260315-0002',
        customerName: '青山矿业-苏拉威西项目',
        level: 'L3',
        phone: '+62-21-23456789',
      },
    }),
    prisma.customer.create({
      data: {
        organizationId: orgID.id,
        customerId: 'CUS-260315-0003',
        customerName: '华为印尼-人力资源部',
        level: 'L3',
        email: 'hr@huawei-id.com',
      },
    }),
  ])
  console.log(`   ✓ 创建了 ${customers.length} 个客户`)

  // 创建线索
  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        organizationId: orgID.id,
        leadCode: 'LEAD-260315-0001',
        personName: '王总',
        company: '山海图贸易',
        phone: '+86-138-0013-8000',
        source: 'wechat',
        category: 'VISA',
        budgetMin: 5000,
        budgetMax: 10000,
        budgetCurrency: 'CNY',
        urgency: 'HIGH',
        initialIntent: '想办 B1 签证，自雇商人',
        status: 'new',
        assigneeId: testUser.id,
        nextFollowDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        notes: '客户来自微信群，对B1签证很感兴趣',
      },
    }),
    prisma.lead.create({
      data: {
        organizationId: orgID.id,
        leadCode: 'LEAD-260315-0002',
        personName: '李经理',
        company: '深圳科技公司',
        phone: '+86-138-0013-8001',
        source: 'referral',
        category: 'COMPANY_REGISTRATION',
        budgetMin: 50000,
        budgetMax: 100000,
        budgetCurrency: 'CNY',
        urgency: 'MEDIUM',
        initialIntent: '想在印尼注册PMA公司',
        status: 'contacted',
        assigneeId: testUser.id,
        nextFollowDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    }),
  ])
  console.log(`   ✓ 创建了 ${leads.length} 个线索`)

  // 创建商机
  const opportunities = await Promise.all([
    prisma.opportunity.create({
      data: {
        id: 'OPP-260315-0001',
        organizationId: orgID.id,
        opportunityCode: 'OPP-260315-0001',
        customerId: customers[0].id,
        stageId: 'P1',
        status: 'active',
        serviceType: 'VISA',
        serviceTypeLabel: '签证服务',
        estimatedAmount: 15000000,
        currency: 'IDR',
        requirements: '需要办理10个B1签证',
        assigneeId: testUser.id,
        wechatGroupId: 2026010,
        wechatGroupName: '极兔物流签证项目',
      },
    }),
    prisma.opportunity.create({
      data: {
        id: 'OPP-260315-0002',
        organizationId: orgID.id,
        opportunityCode: 'OPP-260315-0002',
        customerId: customers[1].id,
        stageId: 'P2',
        status: 'active',
        serviceType: 'COMPANY_REGISTRATION',
        serviceTypeLabel: '公司注册',
        estimatedAmount: 25000000,
        currency: 'IDR',
        requirements: '注册PMA公司，矿业相关',
        assigneeId: testUser.id,
        wechatGroupId: 2026011,
        wechatGroupName: '青山矿业公司注册',
      },
    }),
    prisma.opportunity.create({
      data: {
        id: 'OPP-260315-0003',
        organizationId: orgID.id,
        opportunityCode: 'OPP-260315-0003',
        customerId: customers[2].id,
        stageId: 'P3',
        status: 'active',
        serviceType: 'IMMIGRATION',
        serviceTypeLabel: '移民服务',
        estimatedAmount: 50000000,
        currency: 'IDR',
        requirements: '批量办理工作签证',
        assigneeId: testUser.id,
        wechatGroupId: 2026012,
        wechatGroupName: '华为工签批量办理',
      },
    }),
  ])
  console.log(`   ✓ 创建了 ${opportunities.length} 个商机\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 完成
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('✅ 多租户 RBAC 系统初始化完成！')
  console.log('\n📌 下一步：')
  console.log('1. 在 Supabase 中创建用户：admin@bantuqifu.com')
  console.log(`2. 替换该用户的 UUID 到脚本中的 testUserId (当前为 ${testUserId})`)
  console.log('3. 在应用中进行租户选择和登录测试')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
