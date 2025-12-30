export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square bg-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent animate-shimmer" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonProductPage() {
  return (
    <div className="animate-pulse">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-muted relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-transparent animate-shimmer" />
        </div>
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="space-y-2 mt-6">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-5/6" />
            <div className="h-3 bg-muted rounded w-4/6" />
          </div>
          <div className="flex gap-2 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 w-20 bg-muted rounded" />
            ))}
          </div>
          <div className="h-12 bg-muted rounded mt-6" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTestimonials() {
  return (
    <div className="grid md:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 bg-muted/30 rounded">
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="w-4 h-4 bg-muted rounded" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-4/5" />
          </div>
          <div className="h-3 bg-muted rounded w-1/3 mt-4" />
        </div>
      ))}
    </div>
  );
}
