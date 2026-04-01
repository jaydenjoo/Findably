import { defineConfig } from '@playwright/test'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env.local → 테스트 프로세스에 환경변수 로딩 (dotenv 없이)
try {
  const envPath = resolve(__dirname, '../.env.local')
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // .env.local 없으면 무시 (CI 등)
}

export default defineConfig({
  testDir: './flows',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3600',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev --port 3600',
    port: 3600,
    reuseExistingServer: true,
  },
})
