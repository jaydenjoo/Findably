import { beforeEach, describe, expect, it, vi } from 'vitest'

// vi.hoisted로 mock 함수를 먼저 생성 → vi.mock 팩토리에서 안전하게 참조 가능
const { mockResolve4, mockResolve6 } = vi.hoisted(() => ({
  mockResolve4: vi.fn(),
  mockResolve6: vi.fn(),
}))

vi.mock('node:dns/promises', () => {
  const mockModule = {
    resolve4: mockResolve4,
    resolve6: mockResolve6,
  }
  return {
    ...mockModule,
    default: mockModule,
  }
})

import { resolveHostname, resolveWithWwwFallback } from '../dns-resolve'

describe('resolveHostname', () => {
  beforeEach(() => {
    mockResolve4.mockReset()
    mockResolve6.mockReset()
  })

  it('A 레코드 성공 시 true 반환', async () => {
    mockResolve4.mockResolvedValue(['1.2.3.4'])
    mockResolve6.mockRejectedValue(new Error('ENODATA'))

    await expect(resolveHostname('example.com')).resolves.toBe(true)
  })

  it('AAAA 레코드만 성공해도 true 반환', async () => {
    mockResolve4.mockRejectedValue(new Error('ENODATA'))
    mockResolve6.mockResolvedValue(['::1'])

    await expect(resolveHostname('ipv6-only.test')).resolves.toBe(true)
  })

  it('A + AAAA 모두 실패 시 false 반환 (throw 없음)', async () => {
    mockResolve4.mockRejectedValue(new Error('ENOTFOUND'))
    mockResolve6.mockRejectedValue(new Error('ENOTFOUND'))

    await expect(resolveHostname('nonexistent.invalid')).resolves.toBe(false)
  })

  it('빈 배열 응답은 false로 취급', async () => {
    mockResolve4.mockResolvedValue([])
    mockResolve6.mockResolvedValue([])

    await expect(resolveHostname('empty.test')).resolves.toBe(false)
  })

  it('빈 hostname은 즉시 false 반환', async () => {
    await expect(resolveHostname('')).resolves.toBe(false)
    expect(mockResolve4).not.toHaveBeenCalled()
    expect(mockResolve6).not.toHaveBeenCalled()
  })
})

describe('resolveWithWwwFallback', () => {
  beforeEach(() => {
    mockResolve4.mockReset()
    mockResolve6.mockReset()
  })

  it('apex 도메인 성공 시 fallback=none 반환', async () => {
    mockResolve4.mockResolvedValue(['1.2.3.4'])
    mockResolve6.mockRejectedValue(new Error('ENODATA'))

    const result = await resolveWithWwwFallback('https://example.com/path')
    expect(result).toEqual({
      url: 'https://example.com/path',
      fallback: 'none',
    })
  })

  it('apex 실패 + www 성공 시 URL을 www로 교체 + fallback=www 반환', async () => {
    mockResolve4.mockImplementation(async (host: string) => {
      if (host === 'monthlycheck.kr') throw new Error('ENOTFOUND')
      if (host === 'www.monthlycheck.kr') return ['5.6.7.8']
      throw new Error('unexpected host')
    })
    mockResolve6.mockRejectedValue(new Error('ENODATA'))

    const result = await resolveWithWwwFallback('https://monthlycheck.kr/')
    expect(result).toEqual({
      url: 'https://www.monthlycheck.kr/',
      fallback: 'www',
    })
  })

  it('apex 실패 + www도 실패 시 null 반환', async () => {
    mockResolve4.mockRejectedValue(new Error('ENOTFOUND'))
    mockResolve6.mockRejectedValue(new Error('ENOTFOUND'))

    const result = await resolveWithWwwFallback('https://nowhere.invalid/')
    expect(result).toBeNull()
  })

  it('이미 www로 시작하는 URL은 실패 시 폴백 시도 없이 null', async () => {
    mockResolve4.mockRejectedValue(new Error('ENOTFOUND'))
    mockResolve6.mockRejectedValue(new Error('ENOTFOUND'))

    const result = await resolveWithWwwFallback('https://www.gone.invalid/')
    expect(result).toBeNull()
    // www.www.gone.invalid 시도가 없어야 함
    expect(mockResolve4).toHaveBeenCalledTimes(1)
    expect(mockResolve4).toHaveBeenCalledWith('www.gone.invalid')
  })

  it('path와 query 유지한 채 호스트만 교체', async () => {
    mockResolve4.mockImplementation(async (host: string) => {
      if (host === 'example.kr') throw new Error('ENOTFOUND')
      if (host === 'www.example.kr') return ['1.1.1.1']
      throw new Error('unexpected host')
    })
    mockResolve6.mockRejectedValue(new Error('ENODATA'))

    const result = await resolveWithWwwFallback(
      'https://example.kr/about?lang=ko'
    )
    expect(result?.url).toBe('https://www.example.kr/about?lang=ko')
    expect(result?.fallback).toBe('www')
  })

  it('잘못된 URL은 null 반환', async () => {
    const result = await resolveWithWwwFallback('not-a-url')
    expect(result).toBeNull()
    expect(mockResolve4).not.toHaveBeenCalled()
  })
})
