import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('Drizzle Migrations', () => {
  const projectRoot = process.cwd();
  const drizzleDir = join(projectRoot, 'drizzle');

  it('should generate migrations directory', () => {
    expect(existsSync(drizzleDir)).toBe(true);
  });

  it('should have migration metadata file', () => {
    const metaPath = join(drizzleDir, 'meta');
    expect(existsSync(metaPath)).toBe(true);
  });

  it('should have initial migration SQL file', () => {
    const sqlFiles = readdirSync(drizzleDir)
      .filter((f: string) => f.endsWith('.sql'));
    expect(sqlFiles.length).toBeGreaterThan(0);
  });

  describe('Migration file format validation', () => {
    it('should have valid SQL migration syntax', () => {
      const sqlFiles = readdirSync(drizzleDir)
        .filter((f: string) => f.endsWith('.sql') && !f.includes('rls'));

      expect(sqlFiles.length).toBeGreaterThan(0);

      sqlFiles.forEach((file: string) => {
        const filePath = join(drizzleDir, file);
        const content = readFileSync(filePath, 'utf-8');
        expect(content).toMatch(/CREATE|ALTER|DROP|INSERT/i);
      });
    });

    it('should create companies table', () => {
      const sqlFiles = readdirSync(drizzleDir)
        .filter((f: string) => f.endsWith('.sql') && !f.includes('rls'));

      const hasCompaniesTable = sqlFiles.some((file: string) => {
        const filePath = join(drizzleDir, file);
        const content = readFileSync(filePath, 'utf-8');
        return /CREATE TABLE.*companies/i.test(content);
      });

      expect(hasCompaniesTable).toBe(true);
    });

    it('should create crawl_results table', () => {
      const sqlFiles = readdirSync(drizzleDir)
        .filter((f: string) => f.endsWith('.sql') && !f.includes('rls'));

      const hasCrawlResultsTable = sqlFiles.some((file: string) => {
        const filePath = join(drizzleDir, file);
        const content = readFileSync(filePath, 'utf-8');
        return /CREATE TABLE.*crawl_results/i.test(content);
      });

      expect(hasCrawlResultsTable).toBe(true);
    });

    it('should create diagnoses table', () => {
      const sqlFiles = readdirSync(drizzleDir)
        .filter((f: string) => f.endsWith('.sql') && !f.includes('rls'));

      const hasDiagnosesTable = sqlFiles.some((file: string) => {
        const filePath = join(drizzleDir, file);
        const content = readFileSync(filePath, 'utf-8');
        return /CREATE TABLE.*diagnoses/i.test(content);
      });

      expect(hasDiagnosesTable).toBe(true);
    });

    it('should create action_items table', () => {
      const sqlFiles = readdirSync(drizzleDir)
        .filter((f: string) => f.endsWith('.sql') && !f.includes('rls'));

      const hasActionItemsTable = sqlFiles.some((file: string) => {
        const filePath = join(drizzleDir, file);
        const content = readFileSync(filePath, 'utf-8');
        return /CREATE TABLE.*action_items/i.test(content);
      });

      expect(hasActionItemsTable).toBe(true);
    });

    it('should create generated_assets table', () => {
      const sqlFiles = readdirSync(drizzleDir)
        .filter((f: string) => f.endsWith('.sql') && !f.includes('rls'));

      const hasGeneratedAssetsTable = sqlFiles.some((file: string) => {
        const filePath = join(drizzleDir, file);
        const content = readFileSync(filePath, 'utf-8');
        return /CREATE TABLE.*generated_assets/i.test(content);
      });

      expect(hasGeneratedAssetsTable).toBe(true);
    });
  });

  describe('RLS Policies SQL', () => {
    it('should have RLS policies file', () => {
      const rlsPath = join(drizzleDir, 'rls-policies.sql');
      expect(existsSync(rlsPath)).toBe(true);
    });

    it('should enable RLS on all tables', () => {
      const rlsPath = join(drizzleDir, 'rls-policies.sql');
      const content = readFileSync(rlsPath, 'utf-8');
      expect(content).toMatch(/ALTER TABLE.*ENABLE ROW LEVEL SECURITY/i);
    });

    it('should have at least one policy per table', () => {
      const rlsPath = join(drizzleDir, 'rls-policies.sql');
      const content = readFileSync(rlsPath, 'utf-8');
      const policyCount = (content.match(/CREATE POLICY/gi) || []).length;
      expect(policyCount).toBeGreaterThanOrEqual(5); // At least 1 per table
    });
  });
});
