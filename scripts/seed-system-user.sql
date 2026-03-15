-- ════════════════════════════════════════════════════════════════════════════════
-- 系统用户种子数据 (Bantu System User)
-- ════════════════════════════════════════════════════════════════════════════════
-- 用途：自动化操作（如7天自动回收线索）需要一个虚拟用户来记录操作人
-- 执行方式：在 Supabase SQL Editor 中运行此脚本
-- ════════════════════════════════════════════════════════════════════════════════

-- 定义系统用户的固定 UUID
-- 使用固定 UUID: 00000000-0000-0000-0000-000000000001
DO $$
DECLARE
  system_user_id UUID := '00000000-0000-0000-0000-000000000001';
  system_email TEXT := 'system@bantuqifu.com';
BEGIN
  -- 1. 在 auth.users 表中创建系统用户（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = system_user_id
  ) THEN
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
      system_user_id,
      '00000000-0000-0000-0000-000000000000',
      system_email,
      crypt('SYSTEM_USER_NO_LOGIN_' || gen_random_uuid()::text, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"system","providers":["system"]}'::jsonb,
      '{"name":"Bantu System (系统自动执行)"}'::jsonb,
      false,
      'authenticated'
    );

    RAISE NOTICE '✓ 系统用户已创建: %', system_user_id;
  ELSE
    RAISE NOTICE '⚠ 系统用户已存在，跳过创建';
  END IF;

  -- 2. 在业务表 users_auth 中创建对应记录
  INSERT INTO users_auth (id, email, name, "isActive", "createdAt", "updatedAt")
  VALUES (
    system_user_id::text,
    system_email,
    'Bantu System (系统自动执行)',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✓ 业务用户记录已创建';

END $$;

-- 3. 将系统用户绑定到所有租户（印尼和中国）
DO $$
DECLARE
  system_user_id TEXT := '00000000-0000-0000-0000-000000000001';
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
      system_user_id,
      org_id_id,
      admin_role_id,
      NOW(),
      NOW()
    )
    ON CONFLICT ("userId", "organizationId") DO NOTHING;

    RAISE NOTICE '✓ 系统用户已绑定到印尼租户';
  ELSE
    RAISE NOTICE '⚠ 印尼租户或管理员角色不存在';
  END IF;

  -- 绑定到中国租户
  IF org_cn_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
    INSERT INTO user_organizations ("userId", "organizationId", "roleId", "createdAt", "updatedAt")
    VALUES (
      system_user_id,
      org_cn_id,
      admin_role_id,
      NOW(),
      NOW()
    )
    ON CONFLICT ("userId", "organizationId") DO NOTHING;

    RAISE NOTICE '✓ 系统用户已绑定到中国租户';
  ELSE
    RAISE NOTICE '⚠ 中国租户或管理员角色不存在';
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
WHERE u.id = '00000000-0000-0000-0000-000000000001';
