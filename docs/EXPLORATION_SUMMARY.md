# Supabase Integration Exploration Summary — Task 1.4 Planning

> Date: 2026-03-13 | Purpose: Comprehensive reference for Phase 1 database schema design

---

## 1. Current Supabase Architecture

### 1.1 Dual Client Pattern

Findably uses two distinct Supabase clients following `@supabase/ssr` official pattern:

| Context                                               | Client  | Factory                 | Credentials       | Cookie Access                   |
| ----------------------------------------------------- | ------- | ----------------------- | ----------------- | ------------------------------- |
| **Client Components**                                 | Browser | `createBrowserClient()` | Public (ANON_KEY) | Read/Write (request + response) |
| **Server Components, Server Actions, Route Handlers** | Server  | `createServerClient()`  | Public (ANON_KEY) | Read/Write via middleware proxy |

**Browser Client** (`src/lib/supabase/client.ts`):

```typescript
'use client'
import { createBrowserClient } from '@supabase/ssr'

export function createClient(): ReturnType<typeof createBrowserClient> {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server Client** (`src/lib/supabase/server.ts`):

- Async factory pattern
- Receives cookies from `next/headers`
- Implements try/catch fallback because Server Components cannot directly write cookies
- Middleware proxy pattern compensates: middleware refreshes session on every request

```typescript
export async function createClient(): Promise<
  ReturnType<typeof createServerClient>
> {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component cannot write cookies — middleware handles
          }
        },
      },
    }
  )
}
```

### 1.2 Session Management via Middleware Proxy

**Middleware** (`src/middleware.ts`):

- Intercepts ALL requests before page serving (excludes static files for performance)
- Creates middleware-specific Supabase client
- Calls `getUser()` on every request → triggers automatic session token refresh
- Updates response cookies automatically
- **Critical benefit**: Server Components never need to refresh session; middleware ensures cookies are always fresh

```typescript
// Inside middleware
let supabaseResponse = NextResponse.next({ request })

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  }
)

const {
  data: { user },
} = await supabase.auth.getUser()
// Session is now refreshed; response cookies updated
return supabaseResponse
```

### 1.3 Protected & Auth Routes

**Protected Routes** (require login):

- `/dashboard`
- `/onboarding`
- `/diagnosis`
- `/reports/my`
- `/actions`
- `/settings`

**Auth Routes** (redirect to dashboard if already logged in):

- `/login`
- `/signup`
- `/reset-password`
- `/update-password`

**Public Routes** (no login required):

- `/` (landing)
- `/pricing`
- `/reports/sample` (sample report)

---

## 2. Authentication Flow & Security

### 2.1 Signup Flow

1. User fills form (email, password)
2. Validation with `signupSchema` (Zod) at form submission
3. Server Action `signupAction()` executes
4. `supabase.auth.signUp()` creates user in auth.users table
5. Email verification link sent to inbox
6. **Automatic**: PostgreSQL trigger `findably_handle_new_user()` auto-creates profile row
7. Redirect to `/signup/confirm` pending email verification
8. User clicks email link → `GET /auth/callback?code=...` → session established → redirect to `/onboarding/url`

### 2.2 Login Flow

1. User fills form (email, password)
2. Validation with `loginSchema` (Zod) at form submission
3. Server Action `loginAction()` executes
4. `supabase.auth.signInWithPassword()` authenticates
5. **Redirect handling**:
   - If `redirectTo` parameter present AND valid (starts with `/`), redirect to that URL
   - Otherwise redirect to `/dashboard`
6. Middleware intercepts redirect → refreshes session → serves page

### 2.3 Input Validation Boundary

**Zod Schemas** (`src/features/auth/schemas.ts`):

```typescript
const emailField = z
  .string()
  .min(1, '이메일을 입력해주세요')
  .email('올바른 이메일 형식이 아닙니다')

const passwordField = z
  .string()
  .min(1, '비밀번호를 입력해주세요')
  .min(8, '비밀번호는 8자 이상이어야 합니다')

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export const signupSchema = z.object({
  email: emailField,
  password: passwordField,
})
```

**Validation Pattern**:

- Extract from FormData
- Call `schema.safeParse(raw)`
- If fails: return `{ error: issues[0].message }`
- If succeeds: proceed to Supabase auth call

### 2.4 Security: Account Enumeration Prevention (NFR-6)

**Principle**: Attacker cannot distinguish between "email not found" vs "password wrong"

**Implementation**:

```typescript
export const AUTH_ERROR_GENERIC = '이메일 또는 비밀번호를 확인해주세요'

// In Server Actions:
if (error) {
  return { error: AUTH_ERROR_GENERIC } // ALL failures use same message
}
```

**Applied to**:

- Login (wrong email or wrong password)
- Signup (email already registered)
- Password reset (email not found)

### 2.5 Security: Open Redirect Prevention

**Principle**: Prevent attacker from redirecting user to malicious domain after login

**Implementation**:

```typescript
const redirectTo = formData.get('redirectTo')?.toString() || '/dashboard'
const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard'
redirect(safeRedirect)
```

**Pattern**:

- Whitelist relative paths only (must start with `/`)
- Reject absolute URLs (e.g., `https://evil.com`)
- Default to safe location if validation fails

---

## 3. Database Schema — Current State

### 3.1 Profiles Table

**Purpose**: Store user profile data auto-created on signup

**Location**: `supabase/migrations/001_findably_profiles.sql`

**Schema**:

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  industry    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

**Columns**:

- `id` (uuid): Foreign key to auth.users, auto-populated on signup
- `display_name` (text, nullable): User's display name (optional input)
- `industry` (text, nullable): User's industry (optional input)
- `created_at` (timestamptz): Timestamp auto-set on insert
- `updated_at` (timestamptz): Timestamp auto-refreshed on every update (via trigger)

### 3.2 Auto-Triggers (Automation Layer)

#### Trigger 1: Auto-Profile Creation (`findably_handle_new_user`)

**Purpose**: When new user signs up, automatically create their profile row

**Location**: `supabase/migrations/001_findably_profiles.sql`

**Code**:

```sql
CREATE OR REPLACE FUNCTION public.findably_handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$;

CREATE TRIGGER findably_handle_new_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.findably_handle_new_user();
```

**Behavior**:

- Fires AFTER user inserted in auth.users (during signup)
- Extracts name from `raw_user_meta_data` (populated by Supabase during OAuth or signup)
- Creates profile row with auto-generated ID

#### Trigger 2: Auto-Timestamp Update (`findably_update_updated_at`)

**Purpose**: Automatically refresh `updated_at` column whenever a row is updated

**Location**: `supabase/migrations/001_findably_profiles.sql` (initial), `supabase/migrations/002_findably_profiles_rls_hardening.sql` (hardened version)

**Hardened Code**:

```sql
CREATE OR REPLACE FUNCTION public.findably_update_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER findably_update_updated_at_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.findably_update_updated_at();
```

**Security hardening**:

- `SECURITY DEFINER`: Function executes with owner's permissions (postgres), not caller's
- `SET search_path = ''`: Prevents SQL injection via namespace confusion (blocks attacker from injecting malicious functions into search path)

### 3.3 Row-Level Security (RLS) — Defense in Depth

**Migration 1** (`001_findably_profiles.sql`):

- Basic SELECT policy: `auth.uid() = id`
- Basic UPDATE policy: `auth.uid() = id`

**Migration 2** (`002_findably_profiles_rls_hardening.sql`):

- Strengthens to 3-layer defense:

#### Layer 1: Role Restriction (excludes anon)

```sql
CREATE POLICY "findably_profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated  -- ← Only authenticated users (excludes public/anon)
  USING (auth.uid() = id);
```

**Impact**: Even if RLS is misconfigured on other columns, anon users cannot query profiles at all.

#### Layer 2: Row-Level Filtering

```sql
CREATE POLICY "findably_profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)  -- ← Can only see own row
  WITH CHECK (auth.uid() = id AND id = id);  -- ← Can only update own row
```

#### Layer 3: Column-Level Protection

```sql
WITH CHECK (auth.uid() = id AND id = id)  -- ← Prevents attacker from changing id column
```

**Rationale**: Attacker cannot UPDATE their id to someone else's id, thus cannot modify another user's profile.

---

## 4. Type Safety & Validation

### 4.1 Zod at System Boundary

All user input validated at system boundary (Server Action entry point) before database access:

```typescript
// Pattern used consistently across auth actions
const validated = schema.safeParse(raw)
if (!validated.success) {
  return { error: validated.error.issues[0].message }
}

const { data: result } = await supabase.method(validated.data)
```

### 4.2 TypeScript Strict Mode

- `strict: true` in tsconfig.json
- `any` type absolutely forbidden
- All function return types must be explicit
- No implicit `any` parameters

### 4.3 Server Action Return Type

```typescript
export type AuthActionState = {
  error?: string
  message?: string
}

// All auth Server Actions return AuthActionState
export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  // ...
}
```

---

## 5. Phase 1 Database Tables (Recommendations)

### 5.1 Naming Convention

**Critical**: Findably shares Supabase project with chatsio-v1. To avoid table collisions:

- **All tables**: Prefix with `findably_` (e.g., `findably_diagnoses`)
- **All functions**: Prefix with `findably_` (e.g., `findably_generate_report_pdf`)
- **All triggers**: Prefix with `findably_` (e.g., `findably_auto_score_calculation`)

### 5.2 Phase 1 Tables (from PRD Section 5, 10)

| Table                    | Purpose                                     | Key Columns                                                                       | Relationships   |
| ------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------- | --------------- |
| `findably_diagnoses`     | Store diagnosis results (free & paid)       | `id`, `user_id`, `url`, `status`, `score_seo`, `score_geo`, `created_at`          | `→ profiles`    |
| `findably_reports`       | Store detailed analysis results (paid only) | `id`, `diagnosis_id`, `competitors` (json), `roadmap_90days` (json), `created_at` | `→ diagnoses`   |
| `findably_crawl_results` | Raw crawl data (Layer 1-3 results)          | `id`, `diagnosis_id`, `metadata` (json), `crawl_timestamp`                        | `→ diagnoses`   |
| `findably_competitors`   | Competitor analysis data                    | `id`, `report_id`, `competitor_url`, `score_comparison` (json)                    | `→ reports`     |
| `findably_actions`       | Generated action items (code, schema, etc.) | `id`, `report_id`, `action_type`, `code_snippet`, `cms_detected`                  | `→ reports`     |
| `findably_samples`       | Sample report data (green-tech)             | `id`, `snapshot_json` (json), `updated_at`                                        | — (independent) |
| `findably_payments`      | 🔴 Payment records (high security)          | `id`, `user_id`, `amount`, `status`, `toss_response` (json), `created_at`         | `→ profiles`    |

### 5.3 Schema Template for Phase 1 Tables

```sql
-- Template for findably_diagnoses, findably_reports, etc.
CREATE TABLE IF NOT EXISTS public.findably_<table_name> (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- domain-specific columns
  status          text NOT NULL DEFAULT 'pending',  -- pending, processing, completed, failed
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS: Only user who created it can view/edit
CREATE POLICY "findably_<table_name>_select_own"
  ON public.findably_<table_name> FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "findably_<table_name>_update_own"
  ON public.findably_<table_name> FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND id = id);

CREATE POLICY "findably_<table_name>_insert_own"
  ON public.findably_<table_name> FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "findably_<table_name>_delete_own"
  ON public.findably_<table_name> FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Auto-timestamp trigger
CREATE TRIGGER findably_<table_name>_update_timestamp
  BEFORE UPDATE ON public.findably_<table_name>
  FOR EACH ROW
  EXECUTE FUNCTION public.findably_update_updated_at();

-- Audit trail (optional, Phase 2)
-- CREATE TABLE IF NOT EXISTS public.findably_<table_name>_audit (
--   id              bigserial PRIMARY KEY,
--   table_name      text NOT NULL,
--   record_id       uuid NOT NULL,
--   user_id         uuid NOT NULL,
--   action          text NOT NULL,  -- insert, update, delete
--   changes         jsonb,
--   created_at      timestamptz NOT NULL DEFAULT now()
-- );
```

### 5.4 Key Table Features

**All Phase 1 tables should include**:

1. **UUID Primary Key**: `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
   - Prevents ID enumeration attacks
   - Globally unique across all databases

2. **User Association**: `user_id uuid REFERENCES profiles(id) ON DELETE CASCADE`
   - Every record belongs to a user
   - ON DELETE CASCADE: if user deleted, their records auto-deleted

3. **Status Tracking**: `status text NOT NULL DEFAULT 'pending'`
   - Allows state machine (pending → processing → completed/failed)
   - Enables filtering ("show only completed analyses")

4. **Timestamps**: `created_at` (insert-only), `updated_at` (auto-refresh via trigger)
   - created_at: immutable, set once at insert
   - updated_at: auto-updated on every modification (via trigger)

5. **JSON Columns for Nested Data**: `json | jsonb` for complex structures
   - `crawl_results` (json): HTML metadata, API responses
   - `competitors` (json): Array of competitor analysis
   - `roadmap_90days` (json): Structured plan

6. **RLS Policies**: 4-policy pattern (SELECT, UPDATE, INSERT, DELETE)
   - All `TO authenticated` (excludes anon)
   - All include `auth.uid() = user_id` row filter
   - UPDATE/INSERT include `WITH CHECK` clause to prevent id changes

7. **Auto-Timestamp Trigger**: `findably_update_updated_at()`
   - Ensures `updated_at` always reflects last modification
   - Applied to BEFORE UPDATE event
   - Uses hardened function with `SET search_path = ''`

### 5.5 findably_payments Table (🔴 HIGH SECURITY)

**Special handling required**:

```sql
CREATE TABLE IF NOT EXISTS public.findably_payments (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount          bigint NOT NULL,  -- Stored in cents (9900 = 99,000원)
  currency        text NOT NULL DEFAULT 'KRW',
  status          text NOT NULL,  -- pending, completed, failed, refunded
  payment_method  text,  -- card, bank_transfer
  toss_order_id   text NOT NULL UNIQUE,  -- Toss Payments idempotency key
  toss_response   jsonb,  -- Full Toss API response (audit trail)
  error_reason    text,  -- If failed: reason from Toss
  refunded_at     timestamptz,  -- When refund occurred (if any)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS: Users can only view their own payments
CREATE POLICY "findably_payments_select_own"
  ON public.findably_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin audit access (Phase 2: add admin role)
-- CREATE POLICY "findably_payments_select_admin"
--   ON public.findably_payments FOR SELECT
--   TO authenticated
--   USING (... check if user is admin ...);

-- Insert only allowed via Edge Function (prevent client-side tampering)
-- No INSERT/UPDATE/DELETE policies for authenticated users
-- Edge Function (server-controlled) will: validate amount, call Toss API, insert record

-- Audit trail for compliance
CREATE TABLE IF NOT EXISTS public.findably_payments_audit (
  id              bigserial PRIMARY KEY,
  payment_id      uuid NOT NULL REFERENCES public.findably_payments(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL,
  action          text NOT NULL,  -- created, updated, failed, refunded
  old_status      text,
  new_status      text,
  toss_status     text,  -- Status returned by Toss API
  ip_address      inet,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

**Critical security notes**:

- `amount` stored in cents (prevents floating-point precision loss)
- `toss_order_id` UNIQUE + NOT NULL (prevents duplicate charges via idempotency)
- `toss_response` jsonb stores full Toss API response (audit trail, debugging)
- **NO INSERT/UPDATE/DELETE policies for authenticated users** — prevent direct client access
- All payment modifications via Edge Function only (server-controlled, validates signature with Toss)
- Audit table logs all changes for PCI compliance

---

## 6. Known Limitations & Workarounds

### 6.1 Server Component Cookie Writes

**Limitation**: Server Components can call `cookies().set()` but the write often fails silently (Next.js limitation).

**Workaround**: Middleware proxy pattern

- Middleware refreshes session on every request → updates response cookies
- Server Components don't need to write cookies
- Session always stays fresh automatically

**Pattern**:

```typescript
// Server Component can READ cookies via middleware-refreshed session
const supabase = await createClient()
const {
  data: { user },
} = await supabase.auth.getUser() // getUser reads from middleware-refreshed cookie
// No need for setAll() call — middleware already handled it
```

### 6.2 Anon User Restrictions

**Limitation**: Supabase anon key has minimal privileges intentionally.

**Impact**:

- Anonymous users cannot INSERT/UPDATE/DELETE anything
- Can only SELECT from tables explicitly allowing public role
- Most tables restricted to authenticated role only

**Design choice**: Findably requires login for all meaningful operations (diagnosis, reports, settings).

### 6.3 Shared Supabase Project Risk

**Limitation**: Findably shares PostgreSQL database with chatsio-v1.

**Risk**: Table name collisions

- Example: if chatsio creates `diagnoses` table, Findably creating same table causes conflict

**Mitigation**:

- **Strict naming convention**: All Findably objects prefixed `findably_`
- All tables: `findably_diagnoses`, `findably_reports`, etc.
- All functions: `findably_handle_new_user`, `findably_update_updated_at`, etc.
- All triggers: `findably_*_trigger`
- All policies: `"findably_*"`

**Enforcement**:

- Code review checklist: verify all SQL uses findably\_ prefix
- Migration file naming: `###_findably_<description>.sql`

---

## 7. Next Steps for Phase 1 Implementation

### 7.1 Immediate Tasks

1. **Design detailed schemas** for Phase 1 tables using template (Section 5.3):
   - `findably_diagnoses` (status: pending → processing → completed)
   - `findably_crawl_results` (Layer 1-3 raw data storage)
   - `findably_reports` (analysis results, JSON for nested structures)
   - `findably_competitors` (competitor scores, comparisons)
   - `findably_actions` (generated code snippets, schema markup)
   - `findably_samples` (green-tech sample data)
   - `findably_payments` (🔴 payment records with audit trail)

2. **Create migration files** (003*\*.sql through 010*\*.sql):
   - One migration per table
   - Include rollback SQL in comments
   - Apply findably\_ prefix to all objects
   - Add RLS policies (4-policy pattern from Section 5.3)
   - Add triggers for auto-timestamps

3. **Define relationships** between tables:
   - Foreign key diagram (diagnoses → reports → competitors/actions)
   - Cascade delete rules
   - Ownership chain (user → diagnosis → report → competitors)

4. **Generate TypeScript types**:
   - Run `supabase gen types > types/database.ts`
   - Import types in Server Actions and queries
   - Use for type safety across all Supabase interactions

### 7.2 Testing Checklist

- [ ] RLS policies tested: anon user cannot access authenticated tables
- [ ] Foreign key cascades verified: deleting user deletes all their records
- [ ] Triggers fire correctly: updated_at auto-refreshes on every update
- [ ] Timestamps work: created_at immutable, updated_at changes
- [ ] UUID generation works: no duplicate IDs
- [ ] Status transitions work: pending → processing → completed

### 7.3 Documentation Artifacts

- [ ] ER Diagram (Mermaid) showing all Phase 1 tables + relationships
- [ ] Data flow diagram (Mermaid) showing crawling → diagnosis → report
- [ ] RLS policy matrix (table × role × permission)
- [ ] Payment flow (user → checkout → Toss API → database)

---

## 8. File Inventory

### Configuration Files

- `src/lib/supabase/client.ts` — Browser Supabase client factory (17 lines)
- `src/lib/supabase/server.ts` — Server Supabase client factory (37 lines)

### Middleware

- `src/middleware.ts` — Session refresh + route protection (107 lines)

### Authentication

- `src/features/auth/schemas.ts` — Zod validation schemas (45 lines)
- `src/features/auth/types.ts` — TypeScript types + security constants (13 lines)
- `src/features/auth/actions/signup.ts` — Signup Server Action (42 lines)
- `src/features/auth/actions/login.ts` — Login Server Action (39 lines)

### Database Migrations

- `supabase/migrations/001_findably_profiles.sql` — Initial profiles table + triggers + basic RLS (84 lines)
- `supabase/migrations/002_findably_profiles_rls_hardening.sql` — Hardened RLS + function security (58 lines)

---

## References

- PRD Section 5: Architecture (4-Layer Crawler, 5-Agent Analysis, Phase 1 Scope)
- PRD Section 10: Module Boundaries (table assignments to features)
- Supabase Official: [Session Management](https://supabase.com/docs/guides/auth/server-side-rendering)
- Supabase Official: [Row-Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- OWASP: [Account Enumeration](https://owasp.org/www-community/attacks/Username_Enumeration)
- OWASP: [Open Redirect](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
