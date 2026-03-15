# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bantu CRM Sales Hub - A multi-tenant Next.js 16 CRM application for "班兔印尼" (Bantu Indonesia) and "班兔中国" (Bantu China). Built with Next.js App Router, Prisma ORM, Supabase for authentication, and shadcn/ui components.

## Development Commands

```bash
# Development
npm run dev                   # Start dev server at http://localhost:3000

# Build & Production
npm run build                 # Build for production
npm start                     # Start production server

# Linting
npm run lint                  # Run ESLint

# Database (Prisma + Supabase)
npm run prisma:push           # Sync schema to database (no migrations)
npm run prisma:seed           # Seed database with initial data
npm run prisma:studio         # Open Prisma Studio GUI at http://localhost:5555
npx prisma generate           # Regenerate Prisma Client after schema changes
npx prisma validate           # Validate schema syntax
```

## Architecture

### Multi-Tenant RBAC System

This application implements strict tenant isolation with role-based access control:

**Core Principle**: Every business query MUST filter by `organizationId` to prevent cross-tenant data leakage.

**Tenant Context Flow**:
1. User logs in and selects tenant (BANTU_ID or BANTU_CN)
2. Backend sets cookies: `x-tenant-id`, `x-org-code`, `x-user-permissions`
3. All subsequent requests use `getCurrentTenantId()` from `lib/multitenant/tenant-context.ts`
4. Data Access Layer (DAL) in `lib/multitenant/dal.ts` enforces tenant filtering

**Key Models** (see `prisma/schema.prisma`):
- `Organization` - Tenants (BANTU_ID, BANTU_CN)
- `User` - Bridges with Supabase auth.users (id must match)
- `UserOrganization` - Maps user → tenant → role (composite key: userId + organizationId)
- `Role` - ADMIN, SALES, FINANCE, MANAGER
- `Permission` - Format: `module:action` (e.g., `leads:view`, `quotes:approve`)
- All business tables (`Lead`, `Opportunity`, `Customer`, `Product`, `ActionLog`) have `organizationId` foreign key

### Data Access Patterns

**❌ NEVER do this** (bypasses tenant isolation):
```typescript
const leads = await prisma.lead.findMany()
```

**✅ ALWAYS use DAL functions**:
```typescript
import { getLeads } from '@/lib/multitenant/dal'
const leads = await getLeads() // Auto-filters by current tenant
```

**For new queries**, add them to `lib/multitenant/dal.ts` with tenant filtering:
```typescript
export async function getCustomers() {
  const tenantId = getCurrentTenantId()
  return await prisma.customer.findMany({
    where: { organizationId: tenantId }
  })
}
```

### Server Actions

Server actions are in `app/actions/` directory:
- `lead.ts` - Lead CRUD operations
- `customer.ts` - Customer management
- `interaction.ts` - Customer interactions/followups
- `audit.ts` - Audit trail queries

All actions use `'use server'` directive and retrieve tenant context via cookies.

### Authentication

- Uses Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`)
- Client: `lib/supabase/client.ts` (anon key)
- Server: `lib/supabase/server.ts` (cookie-based sessions)
- Middleware: `middleware.ts` (currently bypassed for development)
- Login page: `app/login/page.tsx` with tenant selector

### Component Structure

- `components/ui/` - shadcn/ui primitives (Button, Dialog, Select, etc.)
- `components/leads/` - Lead management components
- `components/customers/` - Customer management components
- `components/dashboard/` - Dashboard widgets
- `components/sales-hub/` - Sales pipeline components
- `components/workspace/` - Workspace layout components
- `components/audit-rail/` - Audit trail components

**shadcn/ui configuration**: See `components.json` - uses "new-york" style, RSC mode, Tailwind CSS variables, Lucide icons.

### Path Aliases

```typescript
@/* → ./
@/components → ./components
@/lib → ./lib
@/hooks → ./hooks
```

## Database Setup

**Environment Variables** (`.env`):
```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres?schema=public"
NODE_ENV="development"
```

**Initial Setup**:
```bash
npm install
npm run prisma:push    # Create tables
npm run prisma:seed    # Populate initial data
```

**Automated Setup Scripts**:
- `scripts/setup-db.sh` (macOS/Linux)
- `scripts/setup-db.bat` (Windows)

## Important Files

- `MULTITENANT_IMPLEMENTATION.md` - Detailed multi-tenant architecture guide
- `MULTITENANT_RBAC_GUIDE.md` - RBAC implementation instructions
- `PRISMA_SETUP.md` - Prisma + Supabase setup guide
- `QUICKSTART.md` - Quick start guide (in Chinese)
- `MIGRATION_COMPLETE.md` - Migration history

## Security Checklist

When modifying data access code:
- [ ] All queries go through DAL layer (not direct Prisma calls)
- [ ] All API routes call `getCurrentTenantId()` to validate context
- [ ] Cookies are `httpOnly` to prevent XSS
- [ ] Logout calls `clearTenantContext()` to clear cookies
- [ ] New business tables include `organizationId` field with foreign key constraint

## Permission Checking

**Frontend**:
```typescript
import { hasPermission } from '@/lib/multitenant/tenant-context'

if (!hasPermission('quotes:approve')) {
  return <div>Unauthorized</div>
}
```

**Backend**:
```typescript
import { getCurrentTenantId, hasPermission } from '@/lib/multitenant/tenant-context'

export async function POST(req: Request) {
  const tenantId = getCurrentTenantId() // Throws if no tenant context
  if (!hasPermission('leads:create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // ... proceed with operation
}
```

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router, React 19, RSC)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma 6.2.0
- **Auth**: Supabase Auth
- **UI**: shadcn/ui + Radix UI + Tailwind CSS 4.2
- **Forms**: react-hook-form + zod
- **Icons**: Lucide React
- **Charts**: Recharts
- **Date**: date-fns + react-day-picker

## Notes

- This project was bootstrapped with v0.app and is linked to a v0 project
- Middleware is currently disabled for development (see `middleware.ts`)
- The app uses Prisma's `db push` workflow (no migrations) for rapid development
- Tenant context is stored in httpOnly cookies for security
- Same user can have different roles in different tenants
