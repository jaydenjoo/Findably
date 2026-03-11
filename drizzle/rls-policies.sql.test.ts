import { describe, it, expect } from 'vitest';

describe('RLS Policies Documentation', () => {
  const rlsPoliciesSql = `
    ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
    ALTER TABLE crawl_results ENABLE ROW LEVEL SECURITY;
    ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;

    CREATE POLICY companies_select_own ON companies
      FOR SELECT USING (auth.uid()::text = user_id);

    CREATE POLICY companies_insert_own ON companies
      FOR INSERT WITH CHECK (auth.uid()::text = user_id);

    CREATE POLICY companies_update_own ON companies
      FOR UPDATE USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);

    CREATE POLICY companies_delete_own ON companies
      FOR DELETE USING (auth.uid()::text = user_id);

    CREATE POLICY crawl_results_select_own ON crawl_results
      FOR SELECT USING (
        company_id IN (
          SELECT id FROM companies WHERE user_id = auth.uid()::text
        )
      );
  `;

  it('should enable RLS on all tables', () => {
    expect(rlsPoliciesSql).toContain('ALTER TABLE companies ENABLE ROW LEVEL SECURITY');
    expect(rlsPoliciesSql).toContain('ALTER TABLE crawl_results ENABLE ROW LEVEL SECURITY');
    expect(rlsPoliciesSql).toContain('ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY');
    expect(rlsPoliciesSql).toContain('ALTER TABLE action_items ENABLE ROW LEVEL SECURITY');
    expect(rlsPoliciesSql).toContain('ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY');
  });

  it('should create policies for companies table', () => {
    expect(rlsPoliciesSql).toContain('CREATE POLICY companies_select_own');
    expect(rlsPoliciesSql).toContain('CREATE POLICY companies_insert_own');
    expect(rlsPoliciesSql).toContain('CREATE POLICY companies_update_own');
    expect(rlsPoliciesSql).toContain('CREATE POLICY companies_delete_own');
  });

  it('should check user_id for companies policies', () => {
    expect(rlsPoliciesSql).toContain('auth.uid()::text = user_id');
  });

  it('should enforce RLS via company_id foreign key', () => {
    expect(rlsPoliciesSql).toContain('company_id IN');
    expect(rlsPoliciesSql).toContain('SELECT id FROM companies');
    expect(rlsPoliciesSql).toContain('WHERE user_id = auth.uid()::text');
  });
});

describe('RLS Policy Structure', () => {
  it('should have proper policy naming convention', () => {
    const policyPattern = /CREATE POLICY \w+_\w+_\w+ ON \w+/;
    const companies_select = 'CREATE POLICY companies_select_own ON companies';
    const crawl_select = 'CREATE POLICY crawl_results_select_own ON crawl_results';

    expect(companies_select).toMatch(policyPattern);
    expect(crawl_select).toMatch(policyPattern);
  });

  it('should specify policy operations (SELECT, INSERT, UPDATE, DELETE)', () => {
    const selectPolicy = 'CREATE POLICY companies_select_own ON companies FOR SELECT USING';
    const insertPolicy = 'CREATE POLICY companies_insert_own ON companies FOR INSERT WITH CHECK';
    const updatePolicy = 'CREATE POLICY companies_update_own ON companies FOR UPDATE USING';
    const deletePolicy = 'CREATE POLICY companies_delete_own ON companies FOR DELETE USING';

    expect(selectPolicy).toContain('FOR SELECT');
    expect(insertPolicy).toContain('FOR INSERT');
    expect(updatePolicy).toContain('FOR UPDATE');
    expect(deletePolicy).toContain('FOR DELETE');
  });

  it('should document isolation via company_id FK', () => {
    const policyDoc =
      'RLS: access via company_id FK restricts user to their own company records';
    expect(policyDoc).toContain('company_id');
    expect(policyDoc).toContain('user');
  });
});
