-- ════════════════════════════════════════════════════════════════════════════════
-- 系统用户种子数据 (Bantu System User)
-- ════════════════════════════════════════════════════════════════════════════════
-- 用途：自动化操作（如7天自动回收线索）需要一个虚拟用户来记录操作人
-- 执行方式：在 Supabase SQL Editor 中运行此脚本
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. 在 auth.users 表中创建系统用户（如果不存在）
-- 注意：Supabase auth.users 表通常由 Auth API 管理，这里我们直接插入一个虚拟用户
-- 如果您的 Supabase 项目不允许直接插入 auth.users，请跳过此步骤

DO $$
BEGIN
  -- 检查系统用户是否已存在
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = 'bantu-system-001'
  ) THEN
    -- 插入系统用户到 auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      'bantu-system-001',
      '00000000-0000-0000-0000-000000000000',
      'system@bantuqifu.com',
      crypt('SYSTEM_USER_NO_LOGIN', gen_salt('bf')), -- 无法登录的密码
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"system","providers":["system"]}',
      '{"name":"Bantu System (系统自动执行)"}',
      false,
      'authenticated'
    );

    RAISE NOTICE '✓ 系统用户已创建: bantu-system-001';
  ELSE
    RAISE NOTICE '⚠ 系统用户已存在，跳过创建';
  END IF;
END $$;

-- 2. 在业务表 users_auth 中创建对应记录（如果使用 Prisma schema）
-- 注意：根据您的实际表结构调整
INSERT INTO users_auth (id, email, name, "isActive", "createdAt", "updatedAt")
VALUES (
  'bantu-system-001',
  'system@bantuqifu.com',
  'Bantu System (系统自动执行)',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. 将系统用户绑定到所有租户（印尼和中国）
-- 假设您有 organizations 和 user_organizations 表

-- 获取印尼租户 ID
DO $$
DECLARE
  org_id_id TEXT;
  org_cn_id TEXT;
  admin_role_id TEXT;
BEGIN
  -- 查找租户 ID
  SELECT id INTO org_id_id FROM organizations WHERE code = 'BANTU_ID' LIMIT 1;
  SELECT id INTO org_cn_id FROM organizations WHERE code = 'BANTU_CN' LIMIT 1;

  -- 查找管理员角色 ID
  SELECT id INTO admin_role_id FROM roles WHERE code = 'ADMIN' LIMIT 1;

  -- 绑定到印尼租户
  IF org_id_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
    INSERT INTO user_organizations ("userId", "organizationId", "roleId", "createdAt", "updatedAt")
    VALUES (
      'bantu-system-001',
      org_id_id,
      admin_role_id,
      NOW(),
      NOW()
    )
    ON CONFLICT ("userId", "organizationId") DO NOTHING;

    RAISE NOTICE '✓ 系统用户已绑定到印尼租户';
  END IF;

  -- 绑定到中国租户
  IF org_cn_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
    INSERT INTO user_organizations ("userId", "organizationId", "roleId", "createdAt", "updatedAt")
    VALUES (
      'bantu-system-001',
      org_cn_id,
      admin_role_id,
      NOW(),
      NOW()
    )
    ON CONFLICT ("userId", "organizationId") DO NOTHING;

    RAISE NOTICE '✓ 系统用户已绑定到中国租户';
  END IF;
END $$;

-- 4. 验证系统用户创建成功
SELECT
  u.id,
  u.email,
  u.name,
  uo."organizationId",
  o.name as org_name,
  r.name as role_name
FROM users_auth u
LEFT JOIN user_organizations uo ON u.id = uo."userId"
LEFT JOIN organizations o ON uo."organizationId" = o.id
LEFT JOIN roles r ON uo."roleId" = r.id
WHERE u.id = 'bantu-system-001';
