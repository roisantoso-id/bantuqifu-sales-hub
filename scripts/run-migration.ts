import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('Running migration: add pinnedByUsers field...')

  try {
    // 添加 pinnedByUsers 字段
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE opportunities
        ADD COLUMN IF NOT EXISTS "pinnedByUsers" TEXT[] DEFAULT '{}';

        CREATE INDEX IF NOT EXISTS idx_opportunities_pinned_by_users
        ON opportunities USING GIN ("pinnedByUsers");
      `
    })

    if (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    }

    console.log('✅ Migration completed successfully!')
  } catch (err) {
    console.error('Migration error:', err)
    process.exit(1)
  }
}

runMigration()
