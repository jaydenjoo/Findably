# RLS (Row Level Security) Policy Structure

## Overview

Findably uses Supabase Row Level Security (RLS) to enforce data isolation at the database level. Each user can only access their own company data and related records.

## Architecture

### Isolation Model: Company-Based Multi-Tenancy

All tables enforce isolation via `company_id` foreign key:

```
users (Supabase Auth)
  ├── companies (user_id → Supabase Auth uid)
  ├── crawl_results (company_id FK)
  ├── diagnoses (company_id FK)
  ├── action_items (company_id FK)
  └── generated_assets (company_id FK)
```

A user can access a record in related tables ONLY if the record's `company_id` belongs to one of their companies.

## RLS Policies by Table

### 1. companies Table

**Direct user ownership** — Users can only access their own company records.

#### Policies:

- **companies_select_own** (SELECT)
  - Condition: `auth.uid()::text = user_id`
  - User can view their own company record

- **companies_insert_own** (INSERT)
  - Condition: `auth.uid()::text = user_id`
  - User can create a new company with themselves as owner

- **companies_update_own** (UPDATE)
  - Condition: `auth.uid()::text = user_id`
  - User can modify their own company record

- **companies_delete_own** (DELETE)
  - Condition: `auth.uid()::text = user_id`
  - User can delete their own company record

### 2. crawl_results Table

**FK-based isolation** — Users can access crawl results only for their own companies.

#### Policy Logic:

```sql
company_id IN (
  SELECT id FROM companies WHERE user_id = auth.uid()::text
)
```

This ensures:
- User can view crawl results for their companies only
- User cannot see other users' crawl results even if they know the company_id

#### Policies:

- **crawl_results_select_own** (SELECT)
  - User views crawl data for their company's website

- **crawl_results_insert_own** (INSERT)
  - Only n8n webhook (with service role) or backend can insert
  - Frontend cannot directly insert (use Server Actions)

### 3. diagnoses Table

**Same FK-based isolation as crawl_results**

#### Policies:

- **diagnoses_select_own** (SELECT)
  - User views diagnosis results for their companies only

- **diagnoses_insert_own** (INSERT)
  - Backend Server Actions insert diagnosis records
  - Frontend cannot directly insert

### 4. action_items Table

**Same FK-based isolation**

#### Policies:

- **action_items_select_own** (SELECT)
  - User views action items for their companies

- **action_items_update_own** (UPDATE)
  - User can mark action items as completed for their companies

### 5. generated_assets Table

**Same FK-based isolation**

#### Policies:

- **generated_assets_select_own** (SELECT)
  - User views generated Schema Markup, meta tags for their companies

- **generated_assets_insert_own** (INSERT)
  - Backend inserts generated assets for user's companies

## Implementation Details

### Client Types & Behavior

1. **Browser Client** (`createClient()` in `src/lib/supabase/client.ts`)
   - Uses anon key
   - RLS enforced
   - Can read/write own data via Supabase client

2. **Server Client** (`createClient()` in `src/lib/supabase/server.ts`)
   - Uses anon key (with session cookies)
   - RLS enforced
   - Recommended for Server Components, Server Actions

3. **Service Role Client** (in `src/lib/db/client.ts` - NOT recommended)
   - Uses service role key
   - RLS bypassed
   - Only for admin operations, secrets management

### Type Casting

All policies cast `auth.uid()` to `text`:
```sql
auth.uid()::text = user_id
```

This is because:
- `auth.uid()` returns UUID type
- `user_id` column is `text` type
- Explicit cast ensures correct comparison

## Testing RLS Locally

### With Supabase CLI

```bash
# Start local Supabase
supabase start

# Enable RLS
supabase db push

# Test with different users
supabase sql < drizzle/rls-policies.sql
```

### Example Test

1. User A creates company with ID 1
2. User B tries to query company 1 → RLS blocks it
3. User A queries company 1 → Success

## Security Considerations

### What RLS Protects

✅ Database-level access control
✅ Prevents accidental data leakage
✅ Works even if application logic is compromised
✅ Applies to ALL access methods (API, direct queries)

### What RLS Does NOT Protect

❌ SQL injection at the application level (use parameterized queries)
❌ Logic errors in policies
❌ Compromise of service role key (never expose)

### Best Practices

1. **Always verify JWT in middleware** before allowing access
2. **Never use service role key in frontend** or client-side code
3. **Test RLS with multiple users** during development
4. **Log all RLS violations** via Sentry
5. **Review policies** regularly for correctness

## Rollback SQL

To disable RLS for testing/migration:

```sql
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses DISABLE ROW LEVEL SECURITY;
ALTER TABLE action_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE generated_assets DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS companies_select_own ON companies;
DROP POLICY IF EXISTS companies_insert_own ON companies;
-- ... etc
```

## References

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
