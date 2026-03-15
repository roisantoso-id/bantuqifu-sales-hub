const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Running migration: add pinnedByUsers field...')

  try {
    // 使用原始 SQL 查询添加字段
    const { data, error } = await supabase
      .from('opportunities')
      .select('id')
      .limit(1)

    if (error) {
      console.error('❌ Database connection failed:', error)
      process.exit(1)
    }

    console.log('✅ Database connection successful')
    console.log('')
    console.log('📝 Please run the following SQL in Supabase SQL Editor:')
    console.log('-----------------------------------------------------------')
    console.log(`
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS "pinnedByUsers" TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_opportunities_pinned_by_users
ON opportunities USING GIN ("pinnedByUsers");

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'opportunities' AND column_name = 'pinnedByUsers';
    `)
    console.log('-----------------------------------------------------------')
    console.log('')
    console.log('📍 Steps:')
    console.log('1. Go to Supabase Dashboard > SQL Editor')
    console.log('2. Copy and paste the SQL above')
    console.log('3. Click "Run" to execute')
    console.log('')

  } catch (err) {
    console.error('❌ Error:', err)
    process.exit(1)
  }
}

runMigration()
