// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\marketplace\composants\ui\StatusPill.tsx
type StatusValue =
  | "pending"
  | "published"
  | "rejected"
  | "draft"
  | "suspended"
  | "deleted"
  | string;

export default function StatusPill({ status }: { status: StatusValue }) {
  const s = String(status || "").toLowerCase();

  let cls =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";
  let txt = s;

  if (s === "published") {
    cls +=
      " bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    txt = "Publié";
  } else if (s === "pending") {
    cls +=
      " bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    txt = "En attente";
  } else if (s === "rejected") {
    cls += " bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
    txt = "Rejeté";
  } else if (s === "draft") {
    cls +=
      " bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200";
    txt = "Brouillon";
  } else if (s === "suspended") {
    cls +=
      " bg-amber-200 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
    txt = "Suspendu";
  } else if (s === "deleted") {
    cls +=
      " bg-neutral-300 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";
    txt = "Supprimé";
  } else {
    cls +=
      " bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200";
    txt = s || "—";
  }

  return <span className={cls}>{txt}</span>;
}
