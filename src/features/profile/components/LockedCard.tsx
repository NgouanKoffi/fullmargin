import { HiLockClosed } from "react-icons/hi2";

export default function LockedCard({ title, missing }: { title: string; missing: string }) {
  return (
    <div className="rounded-3xl border border-skin-border/60 ring-1 ring-skin-border/30 bg-white dark:bg-slate-900 p-4 shadow-xl opacity-80">
      <div className="flex items-center gap-2">
        <HiLockClosed className="w-5 h-5 text-slate-500" />
        <h3 className="font-semibold text-skin-base">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-skin-muted">{missing} ne sont pas encore disponibles.</p>
      <div className="mt-3">
        <button
          disabled
          className="cursor-not-allowed rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-skin-border/25 bg-slate-100 dark:bg-slate-800"
        >
          Bientôt disponible
        </button>
      </div>
    </div>
  );
}
