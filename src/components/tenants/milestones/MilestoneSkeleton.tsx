import { Card, CardHeader, CardContent } from '@/components/ui/card';

export function MilestoneSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-5 w-3/4 rounded bg-gray-200"></div>
            <div className="mt-2 h-4 w-1/2 rounded bg-gray-200"></div>
          </CardHeader>
          <CardContent>
            <div className="mb-2 h-4 w-full rounded bg-gray-200"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
