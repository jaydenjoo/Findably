'use client'

import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const BottomCTA = () => {
  const [url, setUrl] = useState('')
  const router = useRouter()

  const handleSubmit = () => {
    if (!url.trim()) {
      toast.error('URL을 입력해주세요.')
      return
    }
    try {
      const validUrl = new URL(url.startsWith('http') ? url : `https://${url}`)
      localStorage.setItem('findably_pending_url', validUrl.toString())
      router.push('/signup')
    } catch {
      toast.error('올바른 URL 형식을 입력해주세요.')
    }
  }

  return (
    <section
      aria-labelledby="heading-cta"
      className="py-32 px-6 bg-findably-dark text-center"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 50%, hsla(187, 92%, 43%, 0.1), transparent 70%)',
      }}
    >
      <div className="max-w-[1120px] mx-auto">
        <motion.h2
          id="heading-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold tracking-hero mb-6 text-findably-light"
        >
          당신의 웹사이트 마케팅,
          <br />
          지금 어떤 상태인가요?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 mb-12"
        >
          약 60초 안에 확인하세요. 무료입니다.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto flex flex-col md:flex-row gap-3 p-2 bg-findably-light/[0.06] border border-findably-light/10 rounded-2xl md:rounded-full backdrop-blur-sm focus-within:border-findably-cyan/50 focus-within:[box-shadow:0_0_0_3px_rgba(6,182,212,0.15),0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300"
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
            className="bg-findably-cyan text-white px-8 py-3 rounded-full font-bold text-sm min-h-[44px] w-full md:w-auto transition-all duration-200 hover:-translate-y-px hover:[box-shadow:0_8px_25px_rgba(6,182,212,0.3)]"
          >
            무료 진단 시작
          </button>
        </motion.div>
      </div>
    </section>
  )
}

export default BottomCTA
