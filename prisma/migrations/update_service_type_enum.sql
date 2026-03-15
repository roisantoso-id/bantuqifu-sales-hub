-- Update ServiceType enum to match business categories
-- Migration: update_service_type_enum
-- Date: 2026-03-15

-- Step 1: Create new enum type with all values
CREATE TYPE "ServiceType_new" AS ENUM (
  'VISA',
  'COMPANY_REGISTRATION',
  'FACTORY_SETUP',
  'TAX_SERVICES',
  'PERMIT_SERVICES',
  'FINANCIAL_SERVICES',
  'IMMIGRATION',
  'OTHER'
);

-- Step 2: Add temporary column with new enum type
ALTER TABLE opportunities
ADD COLUMN "serviceType_new" "ServiceType_new";

-- Step 3: Migrate existing data (map old values to new values)
UPDATE opportunities
SET "serviceType_new" =
  CASE "serviceType"::text
    WHEN 'VISA' THEN 'VISA'::"ServiceType_new"
    WHEN 'IMMIGRATION' THEN 'IMMIGRATION'::"ServiceType_new"
    WHEN 'STUDY' THEN 'OTHER'::"ServiceType_new"
    WHEN 'WORK' THEN 'VISA'::"ServiceType_new"
    ELSE 'OTHER'::"ServiceType_new"
  END;

-- Step 4: Drop old column and rename new column
ALTER TABLE opportunities DROP COLUMN "serviceType";
ALTER TABLE opportunities RENAME COLUMN "serviceType_new" TO "serviceType";

-- Step 5: Set NOT NULL constraint
ALTER TABLE opportunities ALTER COLUMN "serviceType" SET NOT NULL;

-- Step 6: Drop old enum type
DROP TYPE "ServiceType";

-- Step 7: Rename new enum type to original name
ALTER TYPE "ServiceType_new" RENAME TO "ServiceType";

-- Verification query (optional - comment out in production)
-- SELECT "serviceType", COUNT(*)
-- FROM opportunities
-- GROUP BY "serviceType";
