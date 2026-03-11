# Database Schema — Findably MVP

> Last Updated: 2026-03-11
> Dialect: PostgreSQL (Supabase)
> ORM: Drizzle ORM v0.45.1

## Overview

The Findably database is organized into 5 main tables representing companies, their website crawl results, diagnostic analyses, action items, and generated assets. All tables support Row Level Security (RLS) for multi-tenant data isolation.

---

## Table Definitions

### 1. Companies

Represents user organizations and their website information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | PRIMARY KEY | Unique company identifier (auto-increment) |
| `user_id` | `text` | NOT NULL, FK (Supabase Auth) | Supabase Auth user ID (tenant isolation) |
| `url` | `varchar(500)` | NOT NULL, UNIQUE | Company website URL |
| `industry` | `varchar` | NOT NULL | Enum: `ecommerce`, `blog`, `saas`, `local_business`, `other` |
| `company_size` | `varchar` | NOT NULL | Enum: `solo`, `small`, `medium` |
| `created_at` | `timestamp` | DEFAULT now() | Record creation timestamp |
| `updated_at` | `timestamp` | DEFAULT now() | Last modification timestamp |

**Indexes:**
- `companies_user_id_idx` — On `user_id` (user lookup)
- `companies_url_idx` — On `url` (unique constraint)

**Foreign Keys:** None (root entity)

**RLS Policy:** Enforced by `user_id` — users can only access their own companies.

---

### 2. Crawl Results

Stores raw HTML and parsed metadata from website crawling via n8n.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | PRIMARY KEY | Unique crawl result identifier |
| `company_id` | `integer` | NOT NULL, FK | References `companies(id)` ON DELETE CASCADE |
| `crawled_at` | `timestamp` | DEFAULT now() | Crawl execution timestamp |
| `status` | `varchar` | NOT NULL | Enum: `success`, `failed_timeout`, `failed_network`, `failed_invalid_url` |
| `raw_html` | `text` | nullable | Full HTML content (truncated if >5MB, see `html_truncated`) |
| `html_truncated` | `boolean` | DEFAULT false | Indicates if HTML was truncated |
| `meta_tags` | `json` | nullable | Parsed meta tags: `{ title, description, og:*, twitter:* }` |
| `headings` | `json` | nullable | Parsed headings: `[{ level: 1-3, text: string }]` |
| `schema_markup` | `json` | nullable | Parsed Schema.org: `[{ "@type", properties }]` |
| `performance_metrics` | `json` | nullable | Google PageSpeed: `{ mobile: { score, cwv }, desktop: { score, cwv } }` |
| `robots_txt` | `text` | nullable | Raw robots.txt content |
| `sitemap_info` | `json` | nullable | Sitemap metadata: `{ urlCount, lastModified }` |
| `detected_cms` | `varchar(50)` | nullable | Detected CMS: `wordpress`, `shopify`, `wix`, `cafe24`, etc. |
| `is_latest` | `boolean` | DEFAULT true | Indicates if this is the most recent crawl for company |

**Indexes:**
- `crawl_results_company_id_idx` — On `company_id` (company lookup)
- `crawl_results_is_latest_idx` — On `is_latest` (latest crawl query optimization)

**Foreign Keys:**
- `company_id` → `companies(id)` ON DELETE CASCADE

**RLS Policy:** Enforced via `company_id` — users can only access crawl results for their companies.

---

### 3. Diagnoses

Stores diagnostic results and scores for websites.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | PRIMARY KEY | Unique diagnosis identifier |
| `company_id` | `integer` | NOT NULL, FK | References `companies(id)` ON DELETE CASCADE |
| `crawl_result_id` | `integer` | nullable, FK | References `crawl_results(id)` ON DELETE SET NULL |
| `diagnosed_at` | `timestamp` | DEFAULT now() | Diagnosis execution timestamp |
| `seo_score` | `numeric(3,1)` | nullable | SEO score (0-100) |
| `geo_score` | `numeric(3,1)` | nullable | GEO (Generative Engine Optimization) score (0-100) |
| `performance_score` | `numeric(3,1)` | nullable | Performance score from Google PageSpeed (0-100) |
| `ai_score` | `numeric(3,1)` | nullable | AI content quality score (0-100) |
| `overall_score` | `numeric(3,1)` | NOT NULL | Weighted aggregate: (SEO×0.35 + GEO×0.35 + Performance×0.2 + AI×0.1) |
| `grade` | `varchar` | NOT NULL | Letter grade: `A`, `B`, `C`, `D`, `F` |
| `ai_insights` | `json` | nullable | Claude analysis: `{ problems: [], recommendations: [] }` |
| `is_latest` | `boolean` | DEFAULT true | Indicates if this is the most recent diagnosis for company |

**Indexes:**
- `diagnoses_company_id_idx` — On `company_id` (company lookup)
- `diagnoses_is_latest_idx` — On `is_latest` (latest diagnosis query optimization)

**Foreign Keys:**
- `company_id` → `companies(id)` ON DELETE CASCADE
- `crawl_result_id` → `crawl_results(id)` ON DELETE SET NULL

**RLS Policy:** Enforced via `company_id` — users can only access diagnoses for their companies.

---

### 4. Action Items

Stores actionable recommendations derived from diagnoses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | PRIMARY KEY | Unique action item identifier |
| `company_id` | `integer` | NOT NULL, FK | References `companies(id)` ON DELETE CASCADE |
| `diagnosis_id` | `integer` | NOT NULL, FK | References `diagnoses(id)` ON DELETE CASCADE |
| `item_type` | `varchar` | NOT NULL | Enum: `quick_win`, `standard`, `long_term` |
| `title` | `varchar(255)` | NOT NULL | Action item title |
| `description` | `text` | NOT NULL | Detailed description and implementation guidance |
| `priority` | `varchar` | NOT NULL | Enum: `high`, `medium`, `low` |
| `expected_impact_score` | `numeric(3,1)` | nullable | Expected score improvement (0-100) |
| `estimated_effort` | `varchar` | nullable | Enum: `<1h`, `1-8h`, `>8h` |
| `completed` | `boolean` | DEFAULT false | User-marked completion status |

**Indexes:**
- `action_items_company_id_idx` — On `company_id` (company lookup)
- `action_items_diagnosis_id_idx` — On `diagnosis_id` (diagnosis lookup)

**Foreign Keys:**
- `company_id` → `companies(id)` ON DELETE CASCADE
- `diagnosis_id` → `diagnoses(id)` ON DELETE CASCADE

**RLS Policy:** Enforced via `company_id` — users can only access action items for their companies.

---

### 5. Generated Assets

Stores generated content (schema markup, meta tags, guides) for users to implement.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `serial` | PRIMARY KEY | Unique asset identifier |
| `company_id` | `integer` | NOT NULL, FK | References `companies(id)` ON DELETE CASCADE |
| `diagnosis_id` | `integer` | nullable, FK | References `diagnoses(id)` ON DELETE SET NULL |
| `asset_type` | `varchar` | NOT NULL | Enum: `schema_markup`, `meta_tags`, `guide` |
| `content` | `json` | nullable | Flexible JSON content based on asset type |
| `generated_at` | `timestamp` | DEFAULT now() | Asset generation timestamp |

**Indexes:**
- `generated_assets_company_id_idx` — On `company_id` (company lookup)

**Foreign Keys:**
- `company_id` → `companies(id)` ON DELETE CASCADE
- `diagnosis_id` → `diagnoses(id)` ON DELETE SET NULL

**RLS Policy:** Enforced via `company_id` — users can only access assets for their companies.

---

## Data Types Reference

| Type | PostgreSQL | Notes |
|------|-----------|-------|
| Serial | `serial` | Auto-incrementing integer (PRIMARY KEY use) |
| Text | `text` | Variable-length text (no length limit) |
| Varchar | `varchar(N)` | Variable-length text (max N chars) |
| Integer | `integer` | 32-bit signed integer |
| Numeric(M,N) | `numeric(3,1)` | Decimal precision: M total digits, N after decimal (e.g., 100.0) |
| JSON | `json` | PostgreSQL native JSON (not jsonb) — good for read-heavy workloads |
| Boolean | `boolean` | True/False values |
| Timestamp | `timestamp` | UTC timestamp without timezone |

---

## Entity Relationship Diagram

```
┌──────────────────┐
│   companies      │
├──────────────────┤
│ id (PK)          │
│ user_id (FK Auth)│
│ url (UNIQUE)     │
│ industry         │
│ company_size     │
│ created_at       │
│ updated_at       │
└────────┬─────────┘
         │ 1:N
         │
    ┌────┴──────────────────────┬──────────────────┬──────────────┐
    │                            │                  │              │
    ▼                            ▼                  ▼              ▼
┌──────────────────┐   ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
│ crawl_results    │   │  diagnoses       │  │action_items  │  │gen_assets    │
├──────────────────┤   ├──────────────────┤  ├──────────────┤  ├──────────────┤
│ id (PK)          │   │ id (PK)          │  │ id (PK)      │  │ id (PK)      │
│ company_id (FK)  │   │ company_id (FK)  │  │ company_id   │  │ company_id   │
│ crawled_at       │   │ crawl_result_id  │  │ diagnosis_id │  │ diagnosis_id │
│ status           │   │ diagnosed_at     │  │ item_type    │  │ asset_type   │
│ raw_html         │   │ seo_score        │  │ title        │  │ content      │
│ meta_tags (JSON) │   │ geo_score        │  │ description  │  │ generated_at │
│ headings (JSON)  │   │ performance_score│  │ priority     │  └──────────────┘
│ schema_markup    │   │ ai_score         │  │ effort       │
│ perf_metrics     │   │ overall_score    │  │ completed    │
│ robots_txt       │   │ grade            │  └──────────────┘
│ sitemap_info     │   │ ai_insights (JSON)
│ detected_cms     │   │ is_latest        │
│ is_latest        │   └──────────────────┘
└──────────────────┘
        │ 1:N
        └─ crawl_result_id references crawl_results(id)
```

---

## Row Level Security (RLS)

All tables have RLS enabled with company-based tenant isolation. See `/drizzle/rls-policies.sql` for complete policy definitions.

**Core Principle:** Users can only access data where `user_id` matches their authenticated session user ID (enforced at the `companies` table level).

**Policies Per Table:**
1. **companies**: SELECT/INSERT/UPDATE/DELETE enforced by `user_id = current_user_id()`
2. **crawl_results**: CRUD enforced via joined `companies.user_id` check
3. **diagnoses**: CRUD enforced via joined `companies.user_id` check
4. **action_items**: CRUD enforced via joined `companies.user_id` check
5. **generated_assets**: CRUD enforced via joined `companies.user_id` check

---

## Seed Data

Sample data for local development is exported from `src/db/seed.ts`:
- `sampleCompany` — Example company (ecommerce, small team)
- `sampleCrawlResult` — Successful crawl with meta tags, headings, schema, performance metrics
- `sampleDiagnosis` — Grade C diagnosis with scores and AI insights
- `sampleActionItems` — 3 action items (2 quick wins, 1 standard)
- `sampleGeneratedAsset` — Organization schema markup JSON-LD

Use these to populate a local test database:

```bash
# After DATABASE_URL is set and migrations are applied:
npx tsx src/db/seed.ts
```

---

## Migration Files

- **Metadata**: `/drizzle/meta/` (Drizzle-managed)
- **Schema Migration**: `/drizzle/0000_naive_plazm.sql`
  - Creates all 5 tables
  - Establishes foreign key relationships
  - Creates indexes for query optimization
  - Constraints: PRIMARY KEY, UNIQUE (url), NOT NULL, DEFAULT values

- **RLS Policies**: `/drizzle/rls-policies.sql` (Applied separately after base migration)
  - Enables RLS on all tables
  - Creates 12 policies (2-3 per table for SELECT/INSERT/UPDATE/DELETE)

---

## Query Patterns

### Recent Company Diagnoses (Latest Only)

```sql
SELECT d.* FROM diagnoses d
WHERE d.company_id = $1 AND d.is_latest = true
ORDER BY d.diagnosed_at DESC;
```

### Company with Latest Crawl and Diagnosis

```sql
SELECT c.*, cr.*, d.*
FROM companies c
LEFT JOIN crawl_results cr ON cr.company_id = c.id AND cr.is_latest = true
LEFT JOIN diagnoses d ON d.company_id = c.id AND d.is_latest = true
WHERE c.user_id = $1 AND c.id = $2;
```

### Action Items by Priority

```sql
SELECT * FROM action_items
WHERE diagnosis_id = $1
ORDER BY
  CASE WHEN priority = 'high' THEN 1 WHEN priority = 'medium' THEN 2 ELSE 3 END,
  expected_impact_score DESC;
```

---

## Performance Considerations

1. **Indexing**: All foreign keys and lookup columns have indexes to optimize JOIN queries
2. **JSON Fields**: Use `jsonb` if full-text search on JSON content is added in future (currently using `json` for read-heavy workloads)
3. **Cascading Deletes**: Deleting a company cascades to all related records
4. **NULL Handling**: Score columns are nullable to support partial diagnosis states
5. **Timestamp Defaults**: All timestamp columns use `DEFAULT now()` for automatic server-side timestamps

---

## Future Enhancements

- Add `notifications` table for alert management
- Add `usage_logs` table for analytics tracking
- Add `api_logs` table for request/response audit trail
- Migrate JSON fields to `jsonb` if full-text search is needed
- Add `workspace_id` column for multi-workspace support (Phase 2)
- Add `subscription_tier` to companies for SaaS billing tiers (Phase 2)

---
