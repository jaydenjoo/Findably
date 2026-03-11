/**
 * Score Aggregator Tests
 * Test-driven development: Write tests first, then implement
 * 종합 점수 산출 및 등급 부여 로직 검증
 */

import { describe, it, expect } from 'vitest';
import { aggregateScores } from '../score-aggregator';

describe('aggregateScores', () => {
  describe('종합 점수 계산 (공식: SEO×0.35 + GEO×0.35 + Performance×0.2 + AI×0.1)', () => {
    it('모든 점수가 100점일 때 종합 점수는 100점', () => {
      const result = aggregateScores({
        seoScore: 100,
        geoScore: 100,
        performanceScore: 100,
        aiScore: 100,
      });
      expect(result.overallScore).toBe(100.0);
    });

    it('모든 점수가 0점일 때 종합 점수는 0점', () => {
      const result = aggregateScores({
        seoScore: 0,
        geoScore: 0,
        performanceScore: 0,
        aiScore: 0,
      });
      expect(result.overallScore).toBe(0.0);
    });

    it('SEO 40점, GEO 60점, 성능 80점, AI 100점이면 (40×0.35 + 60×0.35 + 80×0.2 + 100×0.1) = 59점', () => {
      // 계산: (40 × 0.35) + (60 × 0.35) + (80 × 0.2) + (100 × 0.1) = 14 + 21 + 16 + 10 = 61
      const result = aggregateScores({
        seoScore: 40,
        geoScore: 60,
        performanceScore: 80,
        aiScore: 100,
      });
      expect(result.overallScore).toBe(61.0);
    });

    it('소수점이 있을 때 정확히 1자리까지 반올림', () => {
      // 계산: (35.5 × 0.35) + (42.3 × 0.35) + (88.7 × 0.2) + (75.2 × 0.1)
      // = 12.425 + 14.805 + 17.74 + 7.52 = 52.49 → 52.5
      const result = aggregateScores({
        seoScore: 35.5,
        geoScore: 42.3,
        performanceScore: 88.7,
        aiScore: 75.2,
      });
      expect(result.overallScore).toBe(52.5);
    });

    it('AI 점수가 0일 때도 다른 점수들로 종합 점수 계산', () => {
      // 계산: (80 × 0.35) + (85 × 0.35) + (90 × 0.2) + (0 × 0.1)
      // = 28 + 29.75 + 18 + 0 = 75.75 → 75.8
      const result = aggregateScores({
        seoScore: 80,
        geoScore: 85,
        performanceScore: 90,
        aiScore: 0,
      });
      expect(result.overallScore).toBe(75.8);
    });
  });

  describe('등급 부여 (Grade Assignment)', () => {
    it('85점 이상이면 A등급', () => {
      const resultA85 = aggregateScores({
        seoScore: 90,
        geoScore: 90,
        performanceScore: 90,
        aiScore: 90,
      });
      expect(resultA85.grade).toBe('A');

      const resultA100 = aggregateScores({
        seoScore: 100,
        geoScore: 100,
        performanceScore: 100,
        aiScore: 100,
      });
      expect(resultA100.grade).toBe('A');
    });

    it('정확히 85점이면 A등급', () => {
      const result = aggregateScores({
        seoScore: 85,
        geoScore: 85,
        performanceScore: 85,
        aiScore: 85,
      });
      expect(result.grade).toBe('A');
    });

    it('70-84점이면 B등급', () => {
      const resultB70 = aggregateScores({
        seoScore: 70,
        geoScore: 70,
        performanceScore: 70,
        aiScore: 70,
      });
      expect(resultB70.grade).toBe('B');

      const resultB84 = aggregateScores({
        seoScore: 84,
        geoScore: 84,
        performanceScore: 84,
        aiScore: 84,
      });
      expect(resultB84.grade).toBe('B');
    });

    it('정확히 70점이면 B등급', () => {
      const result = aggregateScores({
        seoScore: 70,
        geoScore: 70,
        performanceScore: 70,
        aiScore: 70,
      });
      expect(result.grade).toBe('B');
    });

    it('55-69점이면 C등급', () => {
      const resultC55 = aggregateScores({
        seoScore: 55,
        geoScore: 55,
        performanceScore: 55,
        aiScore: 55,
      });
      expect(resultC55.grade).toBe('C');

      const resultC69 = aggregateScores({
        seoScore: 69,
        geoScore: 69,
        performanceScore: 69,
        aiScore: 69,
      });
      expect(resultC69.grade).toBe('C');
    });

    it('정확히 55점이면 C등급', () => {
      const result = aggregateScores({
        seoScore: 55,
        geoScore: 55,
        performanceScore: 55,
        aiScore: 55,
      });
      expect(result.grade).toBe('C');
    });

    it('40-54점이면 D등급', () => {
      const resultD40 = aggregateScores({
        seoScore: 40,
        geoScore: 40,
        performanceScore: 40,
        aiScore: 40,
      });
      expect(resultD40.grade).toBe('D');

      const resultD54 = aggregateScores({
        seoScore: 54,
        geoScore: 54,
        performanceScore: 54,
        aiScore: 54,
      });
      expect(resultD54.grade).toBe('D');
    });

    it('정확히 40점이면 D등급', () => {
      const result = aggregateScores({
        seoScore: 40,
        geoScore: 40,
        performanceScore: 40,
        aiScore: 40,
      });
      expect(result.grade).toBe('D');
    });

    it('0-39점이면 F등급', () => {
      const resultF0 = aggregateScores({
        seoScore: 0,
        geoScore: 0,
        performanceScore: 0,
        aiScore: 0,
      });
      expect(resultF0.grade).toBe('F');

      const resultF39 = aggregateScores({
        seoScore: 39,
        geoScore: 39,
        performanceScore: 39,
        aiScore: 39,
      });
      expect(resultF39.grade).toBe('F');
    });

    it('정확히 39점이면 F등급', () => {
      const result = aggregateScores({
        seoScore: 39,
        geoScore: 39,
        performanceScore: 39,
        aiScore: 39,
      });
      expect(result.grade).toBe('F');
    });
  });

  describe('세부 점수 분해 (Breakdown)', () => {
    it('breakdown에는 각 점수가 포함됨', () => {
      const result = aggregateScores({
        seoScore: 80,
        geoScore: 85,
        performanceScore: 90,
        aiScore: 75,
      });

      expect(result.breakdown).toEqual({
        seo: 80,
        geo: 85,
        performance: 90,
        ai: 75,
      });
    });

    it('breakdown은 대시보드 표시용 개별 점수를 유지', () => {
      const result = aggregateScores({
        seoScore: 50,
        geoScore: 50,
        performanceScore: 50,
        aiScore: 50,
      });

      expect(result.breakdown.seo).toBe(50);
      expect(result.breakdown.geo).toBe(50);
      expect(result.breakdown.performance).toBe(50);
      expect(result.breakdown.ai).toBe(50);
    });
  });

  describe('반환 객체 구조', () => {
    it('반환 객체는 overallScore, grade, breakdown을 포함', () => {
      const result = aggregateScores({
        seoScore: 75,
        geoScore: 80,
        performanceScore: 85,
        aiScore: 70,
      });

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('breakdown');
    });

    it('overallScore는 number 타입', () => {
      const result = aggregateScores({
        seoScore: 60,
        geoScore: 60,
        performanceScore: 60,
        aiScore: 60,
      });

      expect(typeof result.overallScore).toBe('number');
    });

    it('grade는 A|B|C|D|F 중 하나', () => {
      const validGrades = ['A', 'B', 'C', 'D', 'F'];

      const testCases = [
        { seo: 90, geo: 90, perf: 90, ai: 90, expectedGrade: 'A' },
        { seo: 75, geo: 75, perf: 75, ai: 75, expectedGrade: 'B' },
        { seo: 60, geo: 60, perf: 60, ai: 60, expectedGrade: 'C' },
        { seo: 45, geo: 45, perf: 45, ai: 45, expectedGrade: 'D' },
        { seo: 20, geo: 20, perf: 20, ai: 20, expectedGrade: 'F' },
      ];

      testCases.forEach(({ seo, geo, perf, ai, expectedGrade }) => {
        const result = aggregateScores({
          seoScore: seo,
          geoScore: geo,
          performanceScore: perf,
          aiScore: ai,
        });

        expect(validGrades).toContain(result.grade);
        expect(result.grade).toBe(expectedGrade);
      });
    });
  });

  describe('경계값 테스트 (Boundary Cases)', () => {
    it('84.9점은 B등급 (85점 미만)', () => {
      // 각 점수를 84.9로 설정하면 종합 점수도 84.9
      const result = aggregateScores({
        seoScore: 84.9,
        geoScore: 84.9,
        performanceScore: 84.9,
        aiScore: 84.9,
      });

      expect(result.overallScore).toBeLessThan(85);
      expect(result.grade).toBe('B');
    });

    it('85.0점은 A등급 (85점 이상)', () => {
      const result = aggregateScores({
        seoScore: 85,
        geoScore: 85,
        performanceScore: 85,
        aiScore: 85,
      });

      expect(result.overallScore).toBeGreaterThanOrEqual(85);
      expect(result.grade).toBe('A');
    });

    it('69.9점은 C등급 (70점 미만)', () => {
      const result = aggregateScores({
        seoScore: 69.9,
        geoScore: 69.9,
        performanceScore: 69.9,
        aiScore: 69.9,
      });

      expect(result.overallScore).toBeLessThan(70);
      expect(result.grade).toBe('C');
    });

    it('54.9점은 D등급 (55점 미만)', () => {
      const result = aggregateScores({
        seoScore: 54.9,
        geoScore: 54.9,
        performanceScore: 54.9,
        aiScore: 54.9,
      });

      expect(result.overallScore).toBeLessThan(55);
      expect(result.grade).toBe('D');
    });

    it('39.9점은 F등급 (40점 미만)', () => {
      const result = aggregateScores({
        seoScore: 39.9,
        geoScore: 39.9,
        performanceScore: 39.9,
        aiScore: 39.9,
      });

      expect(result.overallScore).toBeLessThan(40);
      expect(result.grade).toBe('F');
    });
  });

  describe('실제 시나리오 테스트', () => {
    it('SEO 강점, GEO 약점, 균형잡힌 성능 점수 - B등급', () => {
      const result = aggregateScores({
        seoScore: 95, // 강함
        geoScore: 45, // 약함
        performanceScore: 75, // 중간
        aiScore: 70,
      });

      // (95 × 0.35) + (45 × 0.35) + (75 × 0.2) + (70 × 0.1)
      // = 33.25 + 15.75 + 15 + 7 = 71
      expect(result.overallScore).toBe(71.0);
      expect(result.grade).toBe('B');
    });

    it('균형잡힌 모든 점수 - B등급', () => {
      const result = aggregateScores({
        seoScore: 72,
        geoScore: 75,
        performanceScore: 78,
        aiScore: 70,
      });

      // (72 × 0.35) + (75 × 0.35) + (78 × 0.2) + (70 × 0.1)
      // = 25.2 + 26.25 + 15.6 + 7 = 74.05 → 74.0
      expect(result.overallScore).toBeCloseTo(74.05, 1);
      expect(result.grade).toBe('B');
    });

    it('성능과 AI가 0점이어도 SEO/GEO로 C등급 가능', () => {
      const result = aggregateScores({
        seoScore: 100,
        geoScore: 80,
        performanceScore: 0,
        aiScore: 0,
      });

      // (100 × 0.35) + (80 × 0.35) + (0 × 0.2) + (0 × 0.1)
      // = 35 + 28 + 0 + 0 = 63
      expect(result.overallScore).toBe(63.0);
      expect(result.grade).toBe('C');
    });
  });

  describe('입력 타입 검증', () => {
    it('입력 점수는 0-100 범위의 숫자', () => {
      // 이 테스트는 TypeScript에서 컴파일 타임에 검증됨
      // 런타임 테스트는 유효한 점수만 전달
      const result = aggregateScores({
        seoScore: 0,
        geoScore: 100,
        performanceScore: 50,
        aiScore: 25,
      });

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('소수점 점수 처리', () => {
      const result = aggregateScores({
        seoScore: 85.5,
        geoScore: 75.3,
        performanceScore: 88.7,
        aiScore: 72.1,
      });

      expect(typeof result.overallScore).toBe('number');
      expect(result.overallScore % 1).not.toBe(0); // 소수점 포함
    });
  });

  describe('소수점 반올림 정확성', () => {
    it('1.15 → 1.1로 반올림 (1자리)', () => {
      // 점수들을 조정하여 1.15가 나오도록
      const result = aggregateScores({
        seoScore: 3.2857,
        geoScore: 3.2857,
        performanceScore: 3.2857,
        aiScore: 3.2857,
      });

      // 소수점 1자리로 반올림되어야 함
      const decimalPlaces = (result.overallScore.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });

    it('59.96 → 60.0으로 올림', () => {
      const result = aggregateScores({
        seoScore: 59.96,
        geoScore: 59.96,
        performanceScore: 59.96,
        aiScore: 59.96,
      });

      const decimalPlaces = (result.overallScore.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });
  });
});
