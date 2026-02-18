import { ShimmerStyle } from "./Shimmer";

export default function CommunityCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/90 dark:bg-slate-900/60 ring-1 ring-black/10 dark:ring-white/10 overflow-hidden relative">
      {/* style injector (1er rendu suffit) */}
      <ShimmerStyle />

      {/* Cover */}
      <div className="h-40 sm:h-44 md:h-48 fm-shimmer" />

      {/* Logo round, posé sur le bas de la cover */}
      <div className="absolute -bottom-6 left-4">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full ring-4 ring-white dark:ring-slate-900 fm-shimmer" />
      </div>

      {/* Body */}
      <div className="pt-8 px-4 pb-4 sm:px-5">
        {/* Titre */}
        <div className="h-4 w-2/3 rounded fm-shimmer" />
        {/* Description courtes lignes */}
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full rounded fm-shimmer" />
          <div className="h-3 w-5/6 rounded fm-shimmer" />
        </div>

        {/* Badges rating / users */}
        <div className="mt-4 flex items-center gap-2">
          <div className="h-6 w-16 rounded-full fm-shimmer" />
          <div className="h-6 w-20 rounded-full fm-shimmer" />
        </div>
      </div>
    </div>
  );
}
