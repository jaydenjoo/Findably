'use client'

import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { LANDING } from '@/config/landing'

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number): void => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section
      id="faq"
      aria-labelledby="heading-faq"
      className="py-24 px-6 bg-background"
    >
      <div className="max-w-[720px] mx-auto">
        <div className="text-center mb-16">
          <h2
            id="heading-faq"
            className="text-3xl font-bold tracking-tight mb-4 text-foreground"
          >
            {LANDING.faq.title}
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {LANDING.faq.items.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="rounded-lg border border-border bg-white shadow-sm"
              >
                <button
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="text-sm font-semibold text-foreground">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FaqSection
