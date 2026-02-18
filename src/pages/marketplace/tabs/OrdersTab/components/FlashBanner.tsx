// src/pages/marketplace/tabs/OrdersTab/components/FlashBanner.tsx
export default function FlashBanner({
  flash,
}: {
  flash: { kind: "error" | "info"; text: string } | null;
}) {
  if (!flash) return null;
  return (
    <div
      aria-live="polite"
      className={`mb-3 rounded-lg px-3 py-2 text-sm ring-1 ${
        flash.kind === "error"
          ? "bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-900/60"
          : "bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-900/60"
      }`}
    >
      {flash.text}
    </div>
  );
}
