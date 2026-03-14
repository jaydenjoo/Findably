import { describe, it, expect } from 'vitest'
import { parseLlmsTxt } from '../llms-txt'

describe('parseLlmsTxt', () => {
  it('파일 미존재 시 exists: false, content: null', () => {
    const result = parseLlmsTxt(null)

    expect(result.exists).toBe(false)
    expect(result.content).toBeNull()
  })

  it('빈 파일 시 exists: true, content: null', () => {
    const result = parseLlmsTxt('')

    expect(result.exists).toBe(true)
    expect(result.content).toBeNull()
  })

  it('공백만 있는 파일 시 exists: true, content: null', () => {
    const result = parseLlmsTxt('  \n  ')

    expect(result.exists).toBe(true)
    expect(result.content).toBeNull()
  })

  it('일반 내용 시 trimmed content 반환', () => {
    const raw = '  # Findably\n\nAI marketing diagnosis SaaS.  '
    const result = parseLlmsTxt(raw)

    expect(result.exists).toBe(true)
    expect(result.content).toBe('# Findably\n\nAI marketing diagnosis SaaS.')
  })

  it('여러 줄 내용 시 전체 내용 보존', () => {
    const raw = [
      '# Findably',
      '',
      '> AI marketing diagnosis',
      '',
      '## Features',
      '- SEO analysis',
      '- GEO analysis',
    ].join('\n')
    const result = parseLlmsTxt(raw)

    expect(result.exists).toBe(true)
    expect(result.content).toBe(raw)
  })

  it('BOM 포함 시 BOM 제거 후 정상 반환', () => {
    const raw = '\uFEFF# Findably'
    const result = parseLlmsTxt(raw)

    expect(result.exists).toBe(true)
    expect(result.content).toBe('# Findably')
  })
})
