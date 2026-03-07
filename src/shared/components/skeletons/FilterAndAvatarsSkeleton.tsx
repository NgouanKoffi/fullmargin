import { ShimmerStyle } from "./Shimmer";

export function FilterBarSkeleton() {
  return (
    <>
      <ShimmerStyle />
      <div className="mt-2 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="inline-block h-8 w-24 rounded-full fm-shimmer"
          />
        ))}
      </div>
    </>
  );
}

export function AvatarsScrollerSkeleton() {
  return (
    <>
      <ShimmerStyle />
      <div className="mt-5">
        <div className="h-5 w-40 fm-shimmer rounded mb-3" />
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shrink-0 flex flex-col items-center gap-2">
              <div className="h-16 w-16 rounded-full fm-shimmer" />
              <div className="h-3 w-14 fm-shimmer rounded" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
