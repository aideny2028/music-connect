'use client';

/** Skeleton screen cards — shimmer placeholders for loading states. */

export function ListingCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 border border-white/20">
      <div className="flex justify-between mb-4">
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton h-5 w-16 rounded" />
      </div>
      <div className="skeleton h-5 w-4/5 rounded mb-2" />
      <div className="skeleton h-4 w-full rounded mb-1" />
      <div className="skeleton h-4 w-3/4 rounded mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-5 w-18 rounded-full" />
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-white/18">
        <div className="skeleton h-6 w-6 rounded-full" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="skeleton h-20 w-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-6 w-40 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
      </div>
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-5/6 rounded" />
      <div className="skeleton h-4 w-3/4 rounded" />
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="glass rounded-xl p-4 flex items-center gap-3 border border-white/20">
          <div className="skeleton h-11 w-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-3 w-48 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
