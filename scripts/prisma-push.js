const { execSync } = require('child_process');

console.log('🚀 Pushing Prisma schema to Supabase...\n');

try {
  execSync('npx prisma db push --skip-generate', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres.uojjjxvlauyjamvoflxb:EJTLQAtI9osb58kd@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true',
      DIRECT_URL: process.env.DIRECT_URL || 'postgresql://postgres:EJTLQAtI9osb58kd@db.uojjjxvlauyjamvoflxb.supabase.co:5432/postgres?sslmode=require'
    }
  });
  console.log('\n✅ Schema pushed successfully!');
} catch (error) {
  console.error('❌ Failed to push schema:', error.message);
  process.exit(1);
}
