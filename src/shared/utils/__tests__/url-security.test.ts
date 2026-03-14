import { describe, expect, it } from 'vitest'
import { validateUrlSecurity } from '../url-security'

describe('validateUrlSecurity', () => {
  // ─── 정상 케이스 ───

  it('should accept valid HTTPS URL', () => {
    const result = validateUrlSecurity('https://example.com')
    expect(result).toEqual({ valid: true })
  })

  it('should accept valid HTTP URL', () => {
    const result = validateUrlSecurity('http://example.com')
    expect(result).toEqual({ valid: true })
  })

  it('should accept URL with path and query', () => {
    const result = validateUrlSecurity(
      'https://example.com/page?q=test&lang=ko'
    )
    expect(result).toEqual({ valid: true })
  })

  it('should accept public IP address', () => {
    const result = validateUrlSecurity('http://8.8.8.8')
    expect(result).toEqual({ valid: true })
  })

  it('should accept Korean domain (IDN)', () => {
    const result = validateUrlSecurity('https://xn--hq1bm8jm9l.xn--3e0b707e')
    expect(result).toEqual({ valid: true })
  })

  it('should accept URL at max length (2048)', () => {
    const base = 'https://example.com/'
    const url = base + 'a'.repeat(2048 - base.length)
    const result = validateUrlSecurity(url)
    expect(result).toEqual({ valid: true })
  })

  // ─── 길이 제한 ───

  it('should reject URL exceeding max length (2049)', () => {
    const base = 'https://example.com/'
    const url = base + 'a'.repeat(2049 - base.length)
    const result = validateUrlSecurity(url)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('2048')
  })

  // ─── 프로토콜 차단 ───

  it('should reject FTP protocol', () => {
    const result = validateUrlSecurity('ftp://example.com')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('http')
  })

  it('should reject javascript: protocol', () => {
    const result = validateUrlSecurity('javascript:alert(1)')
    expect(result.valid).toBe(false)
  })

  it('should reject data: protocol', () => {
    const result = validateUrlSecurity('data:text/html,<h1>test</h1>')
    expect(result.valid).toBe(false)
  })

  it('should reject file: protocol', () => {
    const result = validateUrlSecurity('file:///etc/passwd')
    expect(result.valid).toBe(false)
  })

  // ─── 잘못된 URL 형식 ───

  it('should reject invalid URL format', () => {
    const result = validateUrlSecurity('not-a-url')
    expect(result.valid).toBe(false)
  })

  it('should reject empty string', () => {
    const result = validateUrlSecurity('')
    expect(result.valid).toBe(false)
  })

  // ─── 호스트네임 블록리스트 ───

  it('should reject localhost', () => {
    const result = validateUrlSecurity('http://localhost:3000')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('내부 네트워크')
  })

  it('should reject 0.0.0.0', () => {
    const result = validateUrlSecurity('http://0.0.0.0')
    expect(result.valid).toBe(false)
  })

  it('should reject IPv6 loopback [::1]', () => {
    const result = validateUrlSecurity('http://[::1]:8080')
    expect(result.valid).toBe(false)
  })

  it('should reject metadata.google.internal', () => {
    const result = validateUrlSecurity(
      'http://metadata.google.internal/computeMetadata/v1/'
    )
    expect(result.valid).toBe(false)
  })

  it('should reject AWS metadata endpoint', () => {
    const result = validateUrlSecurity(
      'http://169.254.169.254/latest/meta-data/'
    )
    expect(result.valid).toBe(false)
  })

  // ─── Private IPv4 차단 ───

  it('should reject 127.0.0.1 (loopback)', () => {
    const result = validateUrlSecurity('http://127.0.0.1')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('비공개 IP')
  })

  it('should reject 127.x.x.x range', () => {
    const result = validateUrlSecurity('http://127.255.255.1')
    expect(result.valid).toBe(false)
  })

  it('should reject 10.x.x.x (Class A private)', () => {
    const result = validateUrlSecurity('http://10.0.0.1')
    expect(result.valid).toBe(false)
  })

  it('should reject 172.16.x.x (Class B private start)', () => {
    const result = validateUrlSecurity('http://172.16.0.1')
    expect(result.valid).toBe(false)
  })

  it('should reject 172.31.x.x (Class B private end)', () => {
    const result = validateUrlSecurity('http://172.31.255.255')
    expect(result.valid).toBe(false)
  })

  it('should accept 172.15.x.x (not private)', () => {
    const result = validateUrlSecurity('http://172.15.0.1')
    expect(result).toEqual({ valid: true })
  })

  it('should accept 172.32.x.x (not private)', () => {
    const result = validateUrlSecurity('http://172.32.0.1')
    expect(result).toEqual({ valid: true })
  })

  it('should reject 192.168.x.x (Class C private)', () => {
    const result = validateUrlSecurity('http://192.168.1.1')
    expect(result.valid).toBe(false)
  })

  it('should accept 192.167.x.x (not private)', () => {
    const result = validateUrlSecurity('http://192.167.1.1')
    expect(result).toEqual({ valid: true })
  })

  it('should reject 169.254.x.x (link-local)', () => {
    const result = validateUrlSecurity('http://169.254.1.1')
    expect(result.valid).toBe(false)
  })

  it('should reject 0.x.x.x (current network)', () => {
    const result = validateUrlSecurity('http://0.1.2.3')
    expect(result.valid).toBe(false)
  })

  // ─── Private IPv6 차단 ───

  it('should reject fe80:: (link-local IPv6)', () => {
    const result = validateUrlSecurity('http://[fe80::1]')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('비공개 IP')
  })

  it('should reject fc00:: (unique local IPv6)', () => {
    const result = validateUrlSecurity('http://[fc00::1]')
    expect(result.valid).toBe(false)
  })

  it('should reject fd00:: (unique local IPv6)', () => {
    const result = validateUrlSecurity('http://[fd00::1]')
    expect(result.valid).toBe(false)
  })

  it('should reject ::ffff:127.0.0.1 (IPv4-mapped loopback)', () => {
    const result = validateUrlSecurity('http://[::ffff:127.0.0.1]')
    expect(result.valid).toBe(false)
  })

  it('should reject ::ffff:10.0.0.1 (IPv4-mapped private)', () => {
    const result = validateUrlSecurity('http://[::ffff:10.0.0.1]')
    expect(result.valid).toBe(false)
  })

  it('should reject ::ffff:192.168.1.1 (IPv4-mapped Class C)', () => {
    const result = validateUrlSecurity('http://[::ffff:192.168.1.1]')
    expect(result.valid).toBe(false)
  })

  it('should accept public IPv6 address', () => {
    const result = validateUrlSecurity('http://[2607:f8b0:4004::1]')
    expect(result).toEqual({ valid: true })
  })
})
