-- 插入测试数据（客户、线索、商机）
-- 假设已经有 admin@bantuqifu.com 用户，ID 为 '00000000-0000-0000-0000-000000000001'
-- 假设已经有 BANTU_ID 组织

-- 获取组织 ID（假设为第一个）
DO $$
DECLARE
  org_id TEXT;
  user_id TEXT := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- 获取 BANTU_ID 组织 ID
  SELECT id INTO org_id FROM organizations WHERE code = 'BANTU_ID' LIMIT 1;

  -- 插入客户
  INSERT INTO customers (id, "organizationId", "customerId", "customerName", level, phone, email, "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid(), org_id, 'CUS-260315-0001', '极兔物流-总办', 'L4', '+62-21-12345678', 'jtexpress@example.com', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'CUS-260315-0002', '青山矿业-苏拉威西项目', 'L3', '+62-21-23456789', NULL, NOW(), NOW()),
    (gen_random_uuid(), org_id, 'CUS-260315-0003', '华为印尼-人力资源部', 'L3', NULL, 'hr@huawei-id.com', NOW(), NOW());

  -- 插入线索
  INSERT INTO leads (id, "organizationId", "leadCode", "personName", company, phone, source, category, "budgetMin", "budgetMax", "budgetCurrency", urgency, "initialIntent", status, "assigneeId", "nextFollowDate", notes, "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid(), org_id, 'LEAD-260315-0001', '王总', '山海图贸易', '+86-138-0013-8000', 'wechat', 'VISA', 5000, 10000, 'CNY', 'HIGH', '想办 B1 签证，自雇商人', 'new', user_id, NOW() + INTERVAL '2 days', '客户来自微信群，对B1签证很感兴趣', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'LEAD-260315-0002', '李经理', '深圳科技公司', '+86-138-0013-8001', 'referral', 'COMPANY_REGISTRATION', 50000, 100000, 'CNY', 'MEDIUM', '想在印尼注册PMA公司', 'contacted', user_id, NOW() + INTERVAL '5 days', NULL, NOW(), NOW());

  -- 插入商机（需要先获取客户 ID）
  INSERT INTO opportunities (id, "organizationId", "opportunityCode", "customerId", "stageId", status, "serviceType", "serviceTypeLabel", "estimatedAmount", currency, requirements, "assigneeId", "wechatGroupId", "wechatGroupName", "createdAt", "updatedAt")
  SELECT
    'OPP-260315-0001',
    org_id,
    'OPP-260315-0001',
    c.id,
    'P1',
    'active',
    'VISA',
    '签证服务',
    15000000,
    'IDR',
    '需要办理10个B1签证',
    user_id,
    2026010,
    '极兔物流签证项目',
    NOW(),
    NOW()
  FROM customers c WHERE c."customerId" = 'CUS-260315-0001' AND c."organizationId" = org_id;

  INSERT INTO opportunities (id, "organizationId", "opportunityCode", "customerId", "stageId", status, "serviceType", "serviceTypeLabel", "estimatedAmount", currency, requirements, "assigneeId", "wechatGroupId", "wechatGroupName", "createdAt", "updatedAt")
  SELECT
    'OPP-260315-0002',
    org_id,
    'OPP-260315-0002',
    c.id,
    'P2',
    'active',
    'COMPANY_REGISTRATION',
    '公司注册',
    25000000,
    'IDR',
    '注册PMA公司，矿业相关',
    user_id,
    2026011,
    '青山矿业公司注册',
    NOW(),
    NOW()
  FROM customers c WHERE c."customerId" = 'CUS-260315-0002' AND c."organizationId" = org_id;

  INSERT INTO opportunities (id, "organizationId", "opportunityCode", "customerId", "stageId", status, "serviceType", "serviceTypeLabel", "estimatedAmount", currency, requirements, "assigneeId", "wechatGroupId", "wechatGroupName", "createdAt", "updatedAt")
  SELECT
    'OPP-260315-0003',
    org_id,
    'OPP-260315-0003',
    c.id,
    'P3',
    'active',
    'IMMIGRATION',
    '移民服务',
    50000000,
    'IDR',
    '批量办理工作签证',
    user_id,
    2026012,
    '华为工签批量办理',
    NOW(),
    NOW()
  FROM customers c WHERE c."customerId" = 'CUS-260315-0003' AND c."organizationId" = org_id;

  RAISE NOTICE '✅ 测试数据插入完成';
END $$;
