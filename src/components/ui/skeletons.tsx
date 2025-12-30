import { Skeleton } from '@/components/ui/skeleton';

interface ProductSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4;
}

export function ProductSkeleton({ count = 4, columns = 4 }: ProductSkeletonProps) {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${gridClass} gap-4 md:gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <Skeleton className="aspect-square rounded-sm" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TestimonialSkeleton() {
  return (
    <div 
      className="max-w-3xl mx-auto text-center rounded-lg animate-pulse"
      style={{
        backgroundColor: '#FFFFFF',
        padding: '60px 40px',
        boxShadow: '0 2px 20px rgba(0,0,0,0.05)'
      }}
    >
      <Skeleton className="h-16 w-16 mx-auto mb-4" />
      <Skeleton className="h-8 w-full max-w-lg mx-auto mb-4" />
      <Skeleton className="h-8 w-3/4 mx-auto mb-8" />
      <Skeleton className="h-4 w-32 mx-auto" />
    </div>
  );
}

export function OrderSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-border p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-20 rounded" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CartItemSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <Skeleton className="w-20 h-20 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="animate-pulse space-y-4 mb-8">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}