// src/components/admin/users/InfoRow.tsx
export default function InfoRow({ label, value }: { label: string; value: string | number }) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
    );
  }
  