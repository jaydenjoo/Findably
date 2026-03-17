import { describe, it, expect } from 'vitest'
import { SCORING } from '../scoring'

describe('SCORING.getScoreGrade', () => {
  it('should return "excellent" for scores 80-100', () => {
    expect(SCORING.getScoreGrade(80)).toBe('excellent')
    expect(SCORING.getScoreGrade(90)).toBe('excellent')
    expect(SCORING.getScoreGrade(100)).toBe('excellent')
  })

  it('should return "good" for scores 60-79', () => {
    expect(SCORING.getScoreGrade(60)).toBe('good')
    expect(SCORING.getScoreGrade(70)).toBe('good')
    expect(SCORING.getScoreGrade(79)).toBe('good')
  })

  it('should return "warning" for scores 40-59', () => {
    expect(SCORING.getScoreGrade(40)).toBe('warning')
    expect(SCORING.getScoreGrade(50)).toBe('warning')
    expect(SCORING.getScoreGrade(59)).toBe('warning')
  })

  it('should return "critical" for scores 0-39', () => {
    expect(SCORING.getScoreGrade(0)).toBe('critical')
    expect(SCORING.getScoreGrade(20)).toBe('critical')
    expect(SCORING.getScoreGrade(39)).toBe('critical')
  })

  it('should clamp negative scores to 0 (critical)', () => {
    expect(SCORING.getScoreGrade(-10)).toBe('critical')
    expect(SCORING.getScoreGrade(-1)).toBe('critical')
  })

  it('should clamp scores above 100 to 100 (excellent)', () => {
    expect(SCORING.getScoreGrade(101)).toBe('excellent')
    expect(SCORING.getScoreGrade(999)).toBe('excellent')
  })

  it('should handle boundary values correctly', () => {
    expect(SCORING.getScoreGrade(39)).toBe('critical')
    expect(SCORING.getScoreGrade(40)).toBe('warning')
    expect(SCORING.getScoreGrade(59)).toBe('warning')
    expect(SCORING.getScoreGrade(60)).toBe('good')
    expect(SCORING.getScoreGrade(79)).toBe('good')
    expect(SCORING.getScoreGrade(80)).toBe('excellent')
  })
})

describe('SCORING.getScoreLabel', () => {
  it('should return "양호" for excellent scores', () => {
    expect(SCORING.getScoreLabel(85)).toBe('양호')
  })

  it('should return "보통" for good scores', () => {
    expect(SCORING.getScoreLabel(65)).toBe('보통')
  })

  it('should return "주의" for warning scores', () => {
    expect(SCORING.getScoreLabel(45)).toBe('주의')
  })

  it('should return "심각" for critical scores', () => {
    expect(SCORING.getScoreLabel(20)).toBe('심각')
  })

  it('should handle boundary values', () => {
    expect(SCORING.getScoreLabel(80)).toBe('양호')
    expect(SCORING.getScoreLabel(79)).toBe('보통')
    expect(SCORING.getScoreLabel(60)).toBe('보통')
    expect(SCORING.getScoreLabel(59)).toBe('주의')
    expect(SCORING.getScoreLabel(40)).toBe('주의')
    expect(SCORING.getScoreLabel(39)).toBe('심각')
  })
})

describe('SCORING.getScoreColor', () => {
  it('should return success colors for excellent scores', () => {
    const color = SCORING.getScoreColor(85)
    expect(color.text).toBe('text-success-600')
    expect(color.bg).toBe('bg-success-50')
    expect(color.stroke).toBe('stroke-success-500')
    expect(color.border).toBe('border-success-500')
    expect(color.bar).toBe('bg-success-500')
  })

  it('should return primary colors for good scores', () => {
    const color = SCORING.getScoreColor(65)
    expect(color.text).toBe('text-primary-600')
    expect(color.bg).toBe('bg-primary-50')
  })

  it('should return warning colors for warning scores', () => {
    const color = SCORING.getScoreColor(45)
    expect(color.text).toBe('text-warning-600')
    expect(color.bg).toBe('bg-warning-50')
  })

  it('should return danger colors for critical scores', () => {
    const color = SCORING.getScoreColor(15)
    expect(color.text).toBe('text-danger-600')
    expect(color.bg).toBe('bg-danger-50')
  })

  it('should return all 5 color properties', () => {
    const color = SCORING.getScoreColor(50)
    expect(color).toHaveProperty('text')
    expect(color).toHaveProperty('bg')
    expect(color).toHaveProperty('stroke')
    expect(color).toHaveProperty('border')
    expect(color).toHaveProperty('bar')
  })
})

describe('SCORING constants', () => {
  it('PERFORMANCE_WEIGHTS should sum to 1.0', () => {
    const sum = Object.values(SCORING.PERFORMANCE_WEIGHTS).reduce(
      (a, b) => a + b,
      0
    )
    expect(sum).toBeCloseTo(1.0)
  })

  it('MACRO_SCORE_WEIGHTS should sum to 1.0', () => {
    const sum = Object.values(SCORING.MACRO_SCORE_WEIGHTS).reduce(
      (a, b) => a + b,
      0
    )
    expect(sum).toBeCloseTo(1.0)
  })

  it('MACRO_SCORE_WEIGHTS_NO_AI should sum to 1.0', () => {
    const sum = Object.values(SCORING.MACRO_SCORE_WEIGHTS_NO_AI).reduce(
      (a, b) => a + b,
      0
    )
    expect(sum).toBeCloseTo(1.0)
  })

  it('SECURITY_MAX_SCORES should sum to 100', () => {
    const sum = Object.values(SCORING.SECURITY_MAX_SCORES).reduce(
      (a, b) => a + b,
      0
    )
    expect(sum).toBe(100)
  })

  it('GEO_MAX_SCORES should sum to 100', () => {
    const sum = Object.values(SCORING.GEO_MAX_SCORES).reduce((a, b) => a + b, 0)
    expect(sum).toBe(100)
  })

  it('GRADE_THRESHOLDS should be in descending order', () => {
    for (let i = 0; i < SCORING.GRADE_THRESHOLDS.length - 1; i++) {
      const current = SCORING.GRADE_THRESHOLDS[i]
      const next = SCORING.GRADE_THRESHOLDS[i + 1]
      if (current && next) {
        expect(current.min).toBeGreaterThan(next.min)
      }
    }
  })

  it('CERT_EXPIRY_THRESHOLDS should be in descending order by minDays', () => {
    for (let i = 0; i < SCORING.CERT_EXPIRY_THRESHOLDS.length - 1; i++) {
      const current = SCORING.CERT_EXPIRY_THRESHOLDS[i]
      const next = SCORING.CERT_EXPIRY_THRESHOLDS[i + 1]
      if (current && next) {
        expect(current.minDays).toBeGreaterThan(next.minDays)
      }
    }
  })

  it('SSL_GRADE_SCORES should have all standard grades', () => {
    const expectedGrades = ['A+', 'A', 'A-', 'B', 'C', 'D', 'E', 'F', 'T', 'M']
    for (const grade of expectedGrades) {
      expect(SCORING.SSL_GRADE_SCORES).toHaveProperty(grade)
    }
  })

  it('GEO_OG_REQUIRED_FIELDS should include essential OG tags', () => {
    expect(SCORING.GEO_OG_REQUIRED_FIELDS).toContain('og:title')
    expect(SCORING.GEO_OG_REQUIRED_FIELDS).toContain('og:description')
    expect(SCORING.GEO_OG_REQUIRED_FIELDS).toContain('og:image')
  })
})
