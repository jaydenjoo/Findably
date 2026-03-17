'use client'

import { motion } from 'framer-motion'

const rows = [
  ['비용', '수천만 원~', '월 수백만 원 (대행료)', '0원 (첫 진단 무료)'],
  ['소요 기간', '4~12주', '1~2주', '약 5분'],
  ['투입 인력', '컨설턴트 3~5명', 'AE 및 실무자 2명', 'AI 자동화'],
  ['리포트 주기', '일회성 프로젝트', '매월 (수동)', '실시간/상시'],
  ['GEO (AI 검색)', '미포함 (별도)', '제한적', '핵심 진단 포함'],
  [
    '실행 가능성',
    '매우 낮음 (전문용어)',
    '낮음 (데이터 위주)',
    '즉시 실행 가능 (우선순위+로드맵)',
  ],
]

const ComparisonTable = () => (
  <section
    id="compare"
    aria-labelledby="heading-compare"
    className="py-24 px-6 bg-background"
  >
    <div className="max-w-[1120px] mx-auto">
      <div className="text-center mb-16">
        <h2
          id="heading-compare"
          className="text-3xl font-bold tracking-tight mb-4 text-foreground"
        >
          마케팅 진단, 어디서 받으시나요?
        </h2>
        <p className="text-muted-foreground">
          같은 &ldquo;마케팅 감사&rdquo;도 범위와 방식이 다릅니다
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="text-sm font-bold text-slate-400 border-b border-border">
              <th className="py-6 px-4 text-left font-medium">항목</th>
              <th className="py-6 px-4 text-left font-medium">
                대형 컨설팅펌*
              </th>
              <th className="py-6 px-4 text-left font-medium">
                마케팅 에이전시*
              </th>
              <th className="py-6 px-4 text-left bg-findably-cyan text-findably-cyan-foreground rounded-t-2xl font-medium">
                Findably
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.map((row, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-border/50 hover:bg-findably-light/50 transition-colors"
              >
                <td className="py-5 px-4 font-bold text-foreground">
                  {row[0]}
                </td>
                <td className="py-5 px-4 text-muted-foreground">{row[1]}</td>
                <td className="py-5 px-4 text-muted-foreground">{row[2]}</td>
                <td className="py-5 px-4 bg-findably-cyan/[0.06] text-findably-cyan font-bold">
                  {row[3]}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 space-y-2">
        <p className="text-[11px] text-muted-foreground">
          * 컨설팅펌 및 에이전시 수치는 업계 일반적 사례 기준이며, 개별 업체에
          따라 다를 수 있습니다.
        </p>
        <p className="text-[11px] text-muted-foreground">
          * 컨설팅펌은 종합 전략 수립·조직 변화 관리 포함, 에이전시는 실행 대행
          포함. Findably는 자동화된 진단 및 개선 가이드를 제공하며, 서비스
          범위가 다릅니다.
        </p>
      </div>
    </div>
  </section>
)

export default ComparisonTable
