'use client'

import { motion } from 'framer-motion'
import { Search, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const Hero = () => {
  const router = useRouter()
  const [url, setUrl] = useState('')

  const handleSubmit = () => {
    if (!url.trim()) {
      toast.error('URL을 입력해주세요.')
      return
    }
    try {
      const validUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
      localStorage.setItem('findably_pending_url', validUrl.toString())
      toast.success('진단을 시작합니다! 잠시만 기다려주세요.')
      router.push('/signup')
    } catch {
      toast.error('올바른 URL 형식을 입력해주세요.')
    }
  }

  return (
    <section
      id="diagnose"
      aria-label="히어로 — 무료 진단 시작"
      className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden bg-findably-dark"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 40%, hsla(187, 92%, 43%, 0.06), transparent 50%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-[1120px] mx-auto">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-block px-4 py-1.5 rounded-full text-xs font-medium border border-findably-cyan/25 text-findably-cyan bg-findably-cyan/[0.08] mb-8"
        >
          마케팅 진단부터 실행 우선순위까지, 한 번에 끝내는 마케팅 진단
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl md:text-5xl lg:text-[52px] font-bold tracking-hero leading-[1.1] mb-6 bg-linear-to-b from-findably-light to-slate-400 bg-clip-text text-transparent"
        >
          마케팅에 돈 쓰는데
          <br />뭘 먼저 고쳐야 하는지 모르겠다면
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base md:text-lg text-slate-400 max-w-2xl mb-12 leading-[1.7]"
        >
          SEO, GEO, 콘텐츠, 기술 — 60초 만에 진단하고,
          <br className="hidden md:block" />뭘 먼저 고쳐야 ROI가 올라가는지
          우선순위로 알려드립니다.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="w-full max-w-md flex flex-col md:flex-row gap-3 p-2 bg-findably-light/[0.06] border border-findably-light/20 rounded-2xl md:rounded-full backdrop-blur-sm transition-all duration-300 focus-within:border-findably-cyan/50 focus-within:[box-shadow:0_0_0_3px_rgba(6,182,212,0.15),0_0_30px_rgba(6,182,212,0.15)]"
        >
          <div className="flex-1 flex items-center px-4 gap-3">
            <Search className="w-5 h-5 text-slate-500 shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="웹사이트 URL을 입력하세요"
              aria-label="웹사이트 URL 입력"
              className="bg-transparent border-none outline-none text-findably-light w-full text-sm placeholder:text-slate-500 min-h-[44px]"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="bg-findably-cyan text-findably-cyan-foreground px-8 py-3 rounded-full font-bold flex items-center justify-center gap-2 min-w-[160px] min-h-[44px] w-full md:w-auto text-sm transition-all duration-200 hover:-translate-y-px hover:[box-shadow:0_8px_25px_rgba(6,182,212,0.3)]"
          >
            무료 진단 시작 <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-[13px] text-slate-500 font-medium tracking-wide"
        >
          가입 불필요 · 약 60초 안에 결과 · 100% 무료
        </motion.p>
      </div>
    </section>
  )
}

export default Hero
