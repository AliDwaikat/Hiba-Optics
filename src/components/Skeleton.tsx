/**
 * Shared skeleton primitives. `Skeleton` is a single muted block with a gentle
 * shimmer (see `.skeleton` in global.css) that respects prefers-reduced-motion.
 * Compose them to mirror real content dimensions so nothing shifts on load.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

/**
 * A product-card skeleton that matches ProductCard's shape exactly (4:3 image
 * tile + brand / 2-line name / price body with the same padding), so the grid
 * reserves identical space and never jumps when products arrive.
 */
export function SkeletonProductCard() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <div className="px-4 pb-4 pt-3">
        <Skeleton className="h-3 w-1/2 rounded" />
        <div className="mt-1 min-h-[2.5rem] space-y-1.5 sm:min-h-[3rem]">
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-4 w-3/5 rounded" />
        </div>
        <Skeleton className="mt-2 h-4 w-1/3 rounded" />
      </div>
    </div>
  )
}

/**
 * A responsive grid of product-card skeletons, matching the storefront grid
 * (2 / 3 / 4 columns). `count` controls how many placeholders to show.
 */
export function SkeletonProductGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  )
}
