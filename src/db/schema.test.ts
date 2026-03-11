import { describe, it, expect } from 'vitest';
import {
  companiesTable,
  crawlResultsTable,
  diagnosesTable,
  actionItemsTable,
  generatedAssetsTable,
} from './schema';

describe('Database Schema', () => {
  it('should export companies table', () => {
    expect(companiesTable).toBeDefined();
    expect(typeof companiesTable).toBe('object');
  });

  it('should export crawl_results table', () => {
    expect(crawlResultsTable).toBeDefined();
    expect(typeof crawlResultsTable).toBe('object');
  });

  it('should export diagnoses table', () => {
    expect(diagnosesTable).toBeDefined();
    expect(typeof diagnosesTable).toBe('object');
  });

  it('should export action_items table', () => {
    expect(actionItemsTable).toBeDefined();
    expect(typeof actionItemsTable).toBe('object');
  });

  it('should export generated_assets table', () => {
    expect(generatedAssetsTable).toBeDefined();
    expect(typeof generatedAssetsTable).toBe('object');
  });
});
