-- ════════════════════════════════════════════════════════════════════════════════
-- 添加 customerCode 字段到 customers 表
-- ════════════════════════════════════════════════════════════════════════════════
-- 用途：支持人读的客户编号（CUST-2024-001）
-- 执行方式：在 Supabase SQL Editor 中运行此脚本
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. 添加 customerCode 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'customerCode'
  ) THEN
    ALTER TABLE customers ADD COLUMN "customerCode" VARCHAR(50);
    RAISE NOTICE '✓ customerCode 列已添加到 customers 表';
  ELSE
    RAISE NOTICE '⚠ customerCode 列已存在，跳过创建';
  END IF;
END $$;

-- 2. 为现有客户生成 customerCode（如果为空）
UPDATE customers
SET "customerCode" = 'CUST-' || TO_CHAR(created_at, 'YYYY') || '-' || LPAD(row_number() OVER (PARTITION BY organizationId ORDER BY created_at)::text, 5, '0')
WHERE "customerCode" IS NULL;

-- 3. 验证更新
SELECT 
  id,
  "customerId",
  "customerCode",
  "customerName",
  created_at
FROM customers
LIMIT 10;
