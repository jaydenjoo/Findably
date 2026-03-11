import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkCanReDiagnose,
  triggerReDiagnosis,
} from '../re-diagnosis';
import { createServiceDb } from '@/lib/db/client';
import { companiesTable, diagnosesTable } from '@/db/schema';

// Mock database client
vi.mock('@/lib/db/client', () => ({
  createServiceDb: vi.fn(),
}));

describe('re-diagnosis Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkCanReDiagnose', () => {
    it('should return canReDiagnose=true when no diagnosis exists', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      };
      vi.mocked(createServiceDb).mockReturnValue(mockDb as unknown as ReturnType<typeof createServiceDb>);

      const result = await checkCanReDiagnose(1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canReDiagnose).toBe(true);
        expect(result.data.lastDiagnosedAt).toBeNull();
      }
    });

    it('should return canReDiagnose=false when last diagnosis was <1 hour ago', async () => {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    diagnosedAt: thirtyMinutesAgo,
                  },
                ]),
              }),
            }),
          }),
        }),
      };
      vi.mocked(createServiceDb).mockReturnValue(mockDb as unknown as ReturnType<typeof createServiceDb>);

      const result = await checkCanReDiagnose(1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canReDiagnose).toBe(false);
        expect(result.data.lastDiagnosedAt).toEqual(thirtyMinutesAgo);
      }
    });

    it('should return canReDiagnose=true when last diagnosis was >1 hour ago', async () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    diagnosedAt: twoHoursAgo,
                  },
                ]),
              }),
            }),
          }),
        }),
      };
      vi.mocked(createServiceDb).mockReturnValue(mockDb as unknown as ReturnType<typeof createServiceDb>);

      const result = await checkCanReDiagnose(1);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canReDiagnose).toBe(true);
      }
    });

    it('should return error when companyId is invalid', async () => {
      const result = await checkCanReDiagnose(0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.data.error).toBeDefined();
      }
    });

    it('should return error when database query fails', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockRejectedValue(new Error('DB error')),
              }),
            }),
          }),
        }),
      };
      vi.mocked(createServiceDb).mockReturnValue(mockDb as unknown as ReturnType<typeof createServiceDb>);

      const result = await checkCanReDiagnose(1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.data.error).toContain('DB error');
      }
    });
  });

  describe('triggerReDiagnosis', () => {
    it('should return error when companyId is invalid', async () => {
      const result = await triggerReDiagnosis(0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.data.error).toBeDefined();
      }
    });

    it('should return blocked error when diagnosis was <1 hour ago', async () => {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    diagnosedAt: thirtyMinutesAgo,
                  },
                ]),
              }),
            }),
          }),
        }),
      };
      vi.mocked(createServiceDb).mockReturnValue(mockDb as unknown as ReturnType<typeof createServiceDb>);

      const result = await triggerReDiagnosis(1);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.data.error).toContain('1시간 후');
      }
    });
  });
});
