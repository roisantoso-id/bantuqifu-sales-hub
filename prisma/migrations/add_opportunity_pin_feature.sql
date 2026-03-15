-- 添加商机置顶功能
-- 为 opportunities 表添加 pinnedByUsers 字段，存储置顶该商机的用户ID列表

ALTER TABLE opportunities
ADD COLUMN "pinnedByUsers" TEXT[] DEFAULT '{}';

-- 添加索引以提高查询性能
CREATE INDEX idx_opportunities_pinned_by_users ON opportunities USING GIN ("pinnedByUsers");

-- 注释
COMMENT ON COLUMN opportunities."pinnedByUsers" IS '置顶该商机的用户ID列表（数组）';
