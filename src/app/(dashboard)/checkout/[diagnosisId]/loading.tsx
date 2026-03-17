import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function CheckoutLoading(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-lg py-10">
      <Skeleton className="mx-auto mb-8 h-8 w-48" />
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  )
}
