-- 企微群编号自增表
-- 自增从 2026010 开始（通过设置序列起始值）
CREATE SEQUENCE IF NOT EXISTS wechat_group_seq START 2026010;

CREATE TABLE IF NOT EXISTS wechat_group_sequences (
  id        INTEGER PRIMARY KEY DEFAULT nextval('wechat_group_seq'),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 商机表新增企微群字段
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS "wechatGroupId"   INTEGER,
  ADD COLUMN IF NOT EXISTS "wechatGroupName" TEXT;
