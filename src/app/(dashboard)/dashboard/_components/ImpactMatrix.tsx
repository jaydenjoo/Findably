import type { QuickWin } from '@/features/diagnosis-free/types'

interface ImpactMatrixProps {
  quickWins: QuickWin[]
}

/** severity → effort 매핑 */
function getEffort(qw: QuickWin): 'easy' | 'medium' | 'hard' {
  // Quick Win은 기본적으로 쉬운 항목이므로 severity 기반 추정
  if (qw.severity === 'info') return 'easy'
  if (qw.severity === 'warning') return 'medium'
  return 'hard'
}

/** impact 숫자 → 레벨 */
function getImpactLevel(qw: QuickWin): 'high' | 'medium' | 'low' {
  if (qw.impact >= 10) return 'high'
  if (qw.impact >= 5) return 'medium'
  return 'low'
}

interface MatrixCell {
  label: string
  description: string
  items: QuickWin[]
  bg: string
  border: string
  text: string
}

const MATRIX: MatrixCell[][] = [
  // Row: High Impact
  [
    {
      label: '바로 시작',
      description: '효과 크고 쉬움',
      items: [],
      bg: 'bg-success-50',
      border: 'border-success-200',
      text: 'text-success-700',
    },
    {
      label: '계획 후 실행',
      description: '효과 크지만 시간 필요',
      items: [],
      bg: 'bg-primary-50',
      border: 'border-primary-200',
      text: 'text-primary-700',
    },
    {
      label: '전문가 의뢰',
      description: '효과 크지만 복잡',
      items: [],
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      text: 'text-warning-700',
    },
  ],
  // Row: Medium Impact
  [
    {
      label: '틈날 때',
      description: '쉽지만 효과 보통',
      items: [],
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-600',
    },
    {
      label: '여유 있을 때',
      description: '보통 난이도·보통 효과',
      items: [],
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-600',
    },
    {
      label: '나중에',
      description: '어렵고 효과 보통',
      items: [],
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-500',
    },
  ],
]

const EFFORT_LABELS = ['쉬움', '보통', '어려움']
const IMPACT_LABELS = ['효과 높음', '효과 보통']

function MatrixCell({ cell }: { cell: MatrixCell }): React.JSX.Element {
  return (
    <div
      className={`rounded-lg border ${cell.border} ${cell.bg} p-3 min-h-[60px] md:min-h-[80px]`}
    >
      <p className={`text-xs font-semibold ${cell.text} mb-1`}>
        {cell.label}
        <span className="font-normal text-slate-400 ml-1">
          {cell.description}
        </span>
      </p>
      {cell.items.length > 0 ? (
        <ul className="space-y-1">
          {cell.items.slice(0, 3).map((qw) => (
            <li
              key={qw.ruleId}
              className="text-xs text-slate-700 truncate"
              title={qw.ruleName}
            >
              • {qw.ruleName}
            </li>
          ))}
          {cell.items.length > 3 && (
            <li className="text-xs text-slate-400">
              +{cell.items.length - 3}건 더
            </li>
          )}
        </ul>
      ) : (
        <p className="text-xs text-slate-300">—</p>
      )}
    </div>
  )
}

/**
 * Quick Win을 Impact(높/보통) × Effort(쉬움/보통/어려움) 매트릭스로 시각화
 * 고객이 "뭘 먼저 해야 하나?" 즉시 판단 가능
 */
export function ImpactMatrix({
  quickWins,
}: ImpactMatrixProps): React.JSX.Element {
  // 매트릭스에 Quick Win 배치
  const matrix = MATRIX.map((row) =>
    row.map((cell) => ({ ...cell, items: [] as QuickWin[] }))
  )

  for (const qw of quickWins) {
    const effort = getEffort(qw)
    const impact = getImpactLevel(qw)

    const row = impact === 'high' ? 0 : 1
    const col = effort === 'easy' ? 0 : effort === 'medium' ? 1 : 2

    matrix[row]![col]!.items.push(qw)
  }

  return (
    <section className="flex flex-col gap-3" aria-label="영향도 매트릭스">
      <h2 className="text-lg font-semibold text-slate-900">
        영향도 매트릭스 — 뭘 먼저 할까?
      </h2>
      <p className="text-sm text-slate-500">
        효과가 크고 쉬운 항목(좌상단)부터 시작하세요.
      </p>

      {/* 데스크톱: 테이블 매트릭스 */}
      <div className="hidden md:block">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 text-right text-slate-400 font-normal w-20" />
              {EFFORT_LABELS.map((label) => (
                <th
                  key={label}
                  className="p-2 text-center text-slate-500 font-semibold"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td className="p-2 text-right text-slate-500 font-semibold whitespace-nowrap">
                  {IMPACT_LABELS[rowIdx]}
                </td>
                {row.map((cell, colIdx) => (
                  <td key={colIdx} className="p-1">
                    <MatrixCell cell={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일: 카드형 리스트 (비어있지 않은 셀만) */}
      <div className="flex flex-col gap-2 md:hidden">
        {matrix
          .flat()
          .filter((cell) => cell.items.length > 0)
          .map((cell, idx) => (
            <MatrixCell key={idx} cell={cell} />
          ))}
      </div>
    </section>
  )
}
