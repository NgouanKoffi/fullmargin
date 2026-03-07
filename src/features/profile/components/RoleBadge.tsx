import cx from "../utils/cx";

export default function RoleBadge({ role }: { role: string }) {
  const tone =
    role === "admin"
      ? "bg-red-500/10 text-red-600 ring-red-500/30"
      : role === "agent"
      ? "bg-amber-500/10 text-amber-700 ring-amber-500/30"
      : "bg-emerald-500/10 text-emerald-700 ring-emerald-500/30";

  return (
    <span className={cx("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1", tone)}>
      {role}
    </span>
  );
}