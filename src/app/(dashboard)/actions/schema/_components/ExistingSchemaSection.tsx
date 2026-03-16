import type { ParsedSchema } from '@/features/actions'

interface ExistingSchemaSectionProps {
  schemas: ParsedSchema[]
}

export function ExistingSchemaSection({
  schemas,
}: ExistingSchemaSectionProps): React.JSX.Element {
  if (schemas.length === 0) {
    return (
      <section
        className="flex flex-col gap-3"
        aria-label="기존 Schema Markup 분석"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          기존 Schema Markup
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-100">
              <span className="text-lg text-slate-400" aria-hidden="true">
                /
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Schema Markup이 감지되지 않았습니다
              </p>
              <p className="mt-1 text-xs text-slate-500">
                구조화 데이터가 없으면 검색엔진과 AI가 사이트 정보를 정확히
                이해하기 어렵습니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className="flex flex-col gap-3"
      aria-label="기존 Schema Markup 분석"
    >
      <h2 className="text-lg font-semibold text-slate-900">
        기존 Schema Markup
      </h2>
      <div className="flex flex-col gap-3">
        {schemas.map((schema, index) => (
          <div
            key={`${schema.type}-${index}`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  {schema.type}
                </span>
                {schema.isValid ? (
                  <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                    유효
                  </span>
                ) : (
                  <span className="rounded-full bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-700">
                    문제 발견
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                속성 {schema.properties.length}개
              </span>
            </div>

            {schema.properties.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {schema.properties.map((prop) => (
                  <span
                    key={prop}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {prop}
                  </span>
                ))}
              </div>
            )}

            {schema.issues.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1">
                {schema.issues.map((issue) => (
                  <li
                    key={issue}
                    className="flex items-center gap-1.5 text-xs text-danger-600"
                  >
                    <span
                      className="size-1 shrink-0 rounded-full bg-danger-500"
                      aria-hidden="true"
                    />
                    {issue}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
