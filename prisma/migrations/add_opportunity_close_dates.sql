-- Add expectedCloseDate and actualCloseDate fields to opportunities table
-- Migration: add_opportunity_close_dates
-- Date: 2026-03-15

-- Add expectedCloseDate column (nullable)
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS "expectedCloseDate" TIMESTAMP(3);

-- Add actualCloseDate column (nullable)
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS "actualCloseDate" TIMESTAMP(3);

-- Add index for expectedCloseDate for better query performance
CREATE INDEX IF NOT EXISTS idx_opportunities_expected_close_date
ON opportunities ("expectedCloseDate");

-- Add index for actualCloseDate
CREATE INDEX IF NOT EXISTS idx_opportunities_actual_close_date
ON opportunities ("actualCloseDate");

-- Add comment
COMMENT ON COLUMN opportunities."expectedCloseDate" IS '预计成交日期';
COMMENT ON COLUMN opportunities."actualCloseDate" IS '实际成交日期';
