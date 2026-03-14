import { describe, it, expect } from 'vitest'
import { checkMobile } from '../mobile'

describe('checkMobile', () => {
  // ─── 기본 동작 ───

  describe('기본 동작', () => {
    it('null 입력 → viewport_configured: false, issues 포함', () => {
      const result = checkMobile(null)

      expect(result.viewport_configured).toBe(false)
      expect(result.touch_friendly).toBe(false)
      expect(result.issues).toContain('viewport_missing')
    })

    it('빈 HTML → viewport_configured: false', () => {
      const result = checkMobile('')

      expect(result.viewport_configured).toBe(false)
      expect(result.touch_friendly).toBe(false)
      expect(result.issues).toContain('viewport_missing')
    })

    it('viewport 없는 순수 HTML → viewport_configured: false', () => {
      const html = `<!DOCTYPE html>
<html><head><title>Test</title></head>
<body><h1>Hello</h1></body></html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(false)
      expect(result.issues).toContain('viewport_missing')
    })
  })

  // ─── viewport 감지 ───

  describe('viewport 감지', () => {
    it('width=device-width + initial-scale=1 → viewport_configured: true', () => {
      const html = `<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head><body></body></html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(true)
      expect(result.issues).not.toContain('viewport_missing')
      expect(result.issues).not.toContain('viewport_no_device_width')
    })

    it('width=device-width만 → viewport_configured: true', () => {
      const html = `<html><head>
<meta name="viewport" content="width=device-width">
</head><body></body></html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(true)
    })

    it('viewport 있지만 width 미설정 → issue 추가', () => {
      const html = `<html><head>
<meta name="viewport" content="initial-scale=1">
</head><body></body></html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(false)
      expect(result.issues).toContain('viewport_no_device_width')
    })

    it('user-scalable=no → issue: zoom_disabled', () => {
      const html = `<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
</head><body></body></html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(true)
      expect(result.issues).toContain('zoom_disabled')
    })

    it('maximum-scale=1 → issue: zoom_limited', () => {
      const html = `<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
</head><body></body></html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(true)
      expect(result.issues).toContain('zoom_limited')
    })
  })

  // ─── 터치 친화성 ───

  describe('터치 친화성', () => {
    it('적절한 viewport → touch_friendly: true', () => {
      const html = `<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head><body></body></html>`

      const result = checkMobile(html)

      expect(result.touch_friendly).toBe(true)
    })

    it('viewport 미설정 → touch_friendly: false', () => {
      const html = `<html><head><title>No viewport</title></head>
<body></body></html>`

      const result = checkMobile(html)

      expect(result.touch_friendly).toBe(false)
    })

    it('고정 너비 body → touch_friendly: false, issue 추가', () => {
      const html = `<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head><body style="width: 960px;"></body></html>`

      const result = checkMobile(html)

      expect(result.touch_friendly).toBe(false)
      expect(result.issues).toContain('fixed_width_layout')
    })

    it('고정 너비 html → touch_friendly: false', () => {
      const html = `<html style="width: 1024px;"><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head><body></body></html>`

      const result = checkMobile(html)

      expect(result.touch_friendly).toBe(false)
      expect(result.issues).toContain('fixed_width_layout')
    })
  })

  // ─── 복합 케이스 ───

  describe('복합 케이스', () => {
    it('모든 신호 긍정 → issues 빈 배열', () => {
      const html = `<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#3B82F6">
<link rel="manifest" href="/manifest.json">
</head><body></body></html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(true)
      expect(result.touch_friendly).toBe(true)
      expect(result.issues).toEqual([])
    })

    it('viewport + 확대차단 + 고정너비 → issues 복수', () => {
      const html = `<html><head>
<meta name="viewport" content="width=device-width, user-scalable=no, maximum-scale=1">
</head><body style="width: 960px;"></body></html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(true)
      expect(result.touch_friendly).toBe(false)
      expect(result.issues).toContain('zoom_disabled')
      expect(result.issues).toContain('zoom_limited')
      expect(result.issues).toContain('fixed_width_layout')
    })

    it('실제 WordPress 모바일 최적화 HTML → 정상 감지', () => {
      const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
<meta name="theme-color" content="#ffffff">
<link rel="manifest" href="/wp-content/themes/starter/manifest.json">
<title>테스트 사이트</title>
</head>
<body class="home page-template"></body>
</html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(true)
      expect(result.touch_friendly).toBe(true)
      expect(result.issues).toEqual([])
    })
  })

  // ─── 엣지 케이스 ───

  describe('엣지 케이스', () => {
    it('BOM 포함 HTML → 정상 감지', () => {
      const html = `\uFEFF<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1">
</head><body></body></html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(true)
      expect(result.touch_friendly).toBe(true)
    })

    it('대소문자 혼합 meta 태그 → 정상 감지', () => {
      const html = `<html><head>
<META NAME="Viewport" CONTENT="Width=Device-Width, Initial-Scale=1">
</head><body></body></html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(true)
    })

    it('viewport content 비어있음 → viewport_configured: false', () => {
      const html = `<html><head>
<meta name="viewport" content="">
</head><body></body></html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(false)
      expect(result.issues).toContain('viewport_missing')
    })

    it('content 속성이 name보다 앞에 있는 meta 태그', () => {
      const html = `<html><head>
<meta content="width=device-width, initial-scale=1" name="viewport">
</head><body></body></html>`

      const result = checkMobile(html)

      expect(result.viewport_configured).toBe(true)
      expect(result.touch_friendly).toBe(true)
    })

    it('공백만 있는 HTML → viewport_configured: false', () => {
      const result = checkMobile('   \n\t  ')

      expect(result.viewport_configured).toBe(false)
      expect(result.issues).toContain('viewport_missing')
    })
  })
})
