-- ============================================
-- Findably RLS Policies
-- Apply after initial schema migration
-- ============================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- companies: users can only access their own
-- ============================================
CREATE POLICY companies_select_own ON companies
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY companies_insert_own ON companies
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY companies_update_own ON companies
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY companies_delete_own ON companies
  FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================
-- crawl_results: access via company_id FK
-- ============================================
CREATE POLICY crawl_results_select_own ON crawl_results
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY crawl_results_insert_own ON crawl_results
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()::text
    )
  );

-- ============================================
-- diagnoses: access via company_id FK
-- ============================================
CREATE POLICY diagnoses_select_own ON diagnoses
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY diagnoses_insert_own ON diagnoses
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()::text
    )
  );

-- ============================================
-- action_items: access via company_id FK
-- ============================================
CREATE POLICY action_items_select_own ON action_items
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY action_items_update_own ON action_items
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()::text
    )
  );

-- ============================================
-- generated_assets: access via company_id FK
-- ============================================
CREATE POLICY generated_assets_select_own ON generated_assets
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY generated_assets_insert_own ON generated_assets
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies WHERE user_id = auth.uid()::text
    )
  );
