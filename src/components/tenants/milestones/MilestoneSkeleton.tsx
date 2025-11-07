
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export function MilestoneSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1">
      {[1, 2, 3].map(i => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="h-5 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
