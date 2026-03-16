import type { ComparisonMatrix } from '@/features/competitors'

interface ComparisonMatrixTableProps {
  matrix: ComparisonMatrix
}

function getScoreClasses(score: number): string {
  if (score >= 70) return 'bg-success-50 text-success-700'
  if (score >= 40) return 'bg-warning-50 text-warning-700'
  return 'bg-danger-50 text-danger-700'
}

function formatHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function ComparisonMatrixTable({
  matrix,
}: ComparisonMatrixTableProps): React.JSX.Element {
  const { competitors, categories, originalUrl } = matrix

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              카테고리
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-primary-600">
              내 사이트
            </th>
            {competitors.map((c) => (
              <th
                key={c.url}
                className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                {formatHostname(c.url)}
              </th>
            ))}
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              우위
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.map((cat) => {
            const isOriginalWinner = cat.winner === originalUrl

            return (
              <tr
                key={cat.id}
                className="transition-colors duration-150 hover:bg-slate-50/50"
              >
                <td className="px-4 py-3.5 font-medium text-slate-900">
                  {cat.label}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span
                    className={`inline-flex min-w-10 items-center justify-center rounded-lg px-2 py-0.5 font-display text-sm font-bold tabular-nums ${getScoreClasses(cat.originalScore)}`}
                  >
                    {cat.originalScore}
                  </span>
                </td>
                {competitors.map((comp) => {
                  const cs = cat.competitorScores.find(
                    (s) => s.url === comp.url
                  )

                  return (
                    <td key={comp.url} className="px-4 py-3.5 text-center">
                      {cs != null ? (
                        <span
                          className={`inline-flex min-w-10 items-center justify-center rounded-lg px-2 py-0.5 font-display text-sm font-bold tabular-nums ${getScoreClasses(cs.score)}`}
                        >
                          {cs.score}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  )
                })}
                <td className="px-4 py-3.5 text-center">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isOriginalWinner
                        ? 'bg-success-50 text-success-700'
                        : 'bg-danger-50 text-danger-700'
                    }`}
                  >
                    {isOriginalWinner ? '내 사이트' : '경쟁사'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
