export default function DiagnosisLoading(): React.JSX.Element {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-slate-200" />
      <div className="h-4 w-64 rounded bg-slate-100" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="h-32 rounded-lg bg-slate-100" />
        <div className="h-32 rounded-lg bg-slate-100" />
        <div className="h-32 rounded-lg bg-slate-100" />
        <div className="h-32 rounded-lg bg-slate-100" />
      </div>
    </div>
  )
}
