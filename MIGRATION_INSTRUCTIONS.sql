-- 直接在 Supabase SQL Editor 中执行此脚本

-- 添加 pinnedByUsers 字段
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS "pinnedByUsers" TEXT[] DEFAULT '{}';

-- 添加 GIN 索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_opportunities_pinned_by_users
ON opportunities USING GIN ("pinnedByUsers");

-- 验证字段已添加
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'opportunities' AND column_name = 'pinnedByUsers';
