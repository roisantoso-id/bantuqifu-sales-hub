-- ════════════════════════════════════════════════════════════════════════════════
-- 添加 customerCode 字段到 customers 表
-- ════════════════════════════════════════════════════════════════════════════════
-- 用途：支持人读的客户编号（CUST-2024-001），与现有 customerId 兼容
-- 执行方式：
--   1. 在 Supabase SQL Editor 中运行此脚本
--   2. 或使用 psql 命令行工具执行
-- 
-- 预期结果：
--   - customers 表新增 customerCode 列（VARCHAR, 可为空）
--   - 现有客户将自动生成格式为 CUST-YYYY-XXXXX 的编号
--   - 新客户在创建时由应用层生成编号
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. 添加 customerCode 列（如果不存在）
BEGIN;

DO $$
BEGIN
  -- 检查列是否已存在
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'customerCode'
  ) THEN
    -- 添加新列（允许 NULL，后续批量生成值）
    ALTER TABLE public.customers ADD COLUMN "customerCode" VARCHAR(50) UNIQUE;
    RAISE NOTICE '✓ customerCode 列已添加到 customers 表';
  ELSE
    RAISE NOTICE '⚠️ customerCode 列已存在，跳过创建';
  END IF;
END $$;

-- 2. 为现有客户生成 customerCode（批量更新）
UPDATE public.customers
SET "customerCode" = 'CUST-' || TO_CHAR(created_at, 'YYYY') || '-' || LPAD(
  (ROW_NUMBER() OVER (PARTITION BY organization_id ORDER BY created_at))::text, 
  5, 
  '0'
)
WHERE "customerCode" IS NULL;

-- 3. 验证数据一致性
DO $$
DECLARE
  total_count INT;
  with_code_count INT;
  without_code_count INT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM public.customers;
  SELECT COUNT(*) INTO with_code_count FROM public.customers WHERE "customerCode" IS NOT NULL;
  SELECT COUNT(*) INTO without_code_count FROM public.customers WHERE "customerCode" IS NULL;
  
  RAISE NOTICE '统计信息：';
  RAISE NOTICE '  总客户数: %', total_count;
  RAISE NOTICE '  已有编号: %', with_code_count;
  RAISE NOTICE '  缺少编号: %', without_code_count;
  
  IF without_code_count > 0 THEN
    RAISE WARNING '⚠️ 还有 % 个客户缺少编号', without_code_count;
  ELSE
    RAISE NOTICE '✓ 所有客户已成功生成编号';
  END IF;
END $$;

-- 4. 添加唯一性约束（确保每个编号唯一）
-- 注意：如果数据中存在重复，此步骤可能失败，需要手动处理
-- ALTER TABLE public.customers ADD CONSTRAINT uk_customer_code UNIQUE("customerCode");

COMMIT;

-- 5. 最终验证 - 显示前 10 个客户
SELECT 
  id,
  organization_id,
  "customerId",
  "customerCode",
  "customerName",
  created_at
FROM public.customers
LIMIT 10;

-- ════════════════════════════════════════════════════════════════════════════════
-- 后续步骤：
-- 1. 确认迁移成功后，前端代码将从 customerCode 优先展示
-- 2. 新建客户时应用层会自动生成符合规则的 customerCode
-- 3. 搜索、导出等功能将支持按 customerCode 查询
-- ════════════════════════════════════════════════════════════════════════════════

