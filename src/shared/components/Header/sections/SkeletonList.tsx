// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\sections\SkeletonList.tsx
// Fond adaptatif clair/sombre pour les placeholders (plus de gris sale en dark)
export default function SkeletonList({
  revealOnHover = false,
}: {
  revealOnHover?: boolean;
}) {
  const tileBase =
    "bg-black/5 dark:bg-white/[0.06] ring-1 ring-black/5 dark:ring-white/10 text-skin-base";
  const tileHover = "hover:bg-black/10 dark:hover:bg-white/10";

  const Row = () => (
    <div
      className={
        `${tileBase} ${tileHover} animate-pulse transition-all flex items-center ` +
        (revealOnHover
          ? [
              "h-10 justify-center rounded-full w-full",
              "group-hover/dock:w-full group-hover/dock:h-auto group-hover/dock:rounded-xl group-hover/dock:px-3 group-hover/dock:py-2 group-hover/dock:justify-start group-hover/dock:gap-3",
              "group-focus-within/dock:w-full group-focus-within/dock:h-auto group-focus-within/dock:rounded-xl group-focus-within/dock:px-3 group-focus-within/dock:py-2 group-focus-within/dock:justify-start group-focus-within/dock:gap-3",
            ].join(" ")
          : "rounded-xl p-2 justify-start gap-3 w-full")
      }
    >
      <span className="shrink-0 w-6 h-6 rounded-full bg-skin-border/40 dark:bg-white/15" />
      <span
        className={
          revealOnHover
            ? [
                "hidden",
                "group-hover/dock:inline-flex group-hover/dock:opacity-100 group-hover/dock:max-w-[220px]",
                "group-focus-within/dock:inline-flex group-focus-within/dock:opacity-100 group-focus-within/dock:max-w-[220px]",
              ].join(" ")
            : "opacity-100 max-w-[220px] h-3 rounded bg-skin-border/40 dark:bg-white/15"
        }
      />
    </div>
  );

  return (
    <div className="px-3 pt-2 pb-1 space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Row key={i} />
      ))}
    </div>
  );
}
