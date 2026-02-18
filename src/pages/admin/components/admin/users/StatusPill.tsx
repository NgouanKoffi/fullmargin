// src/pages/admin/components/users/StatusPill.tsx
export default function StatusPill({
    status,
    lastPingAt,
  }: {
    status: "online" | "away" | "offline";
    lastPingAt?: string;
  }) {
    const color =
      status === "online"
        ? "bg-green-100 text-green-700 border-green-200"
        : status === "away"
        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
        : "bg-slate-100 text-slate-700 border-slate-200";
  
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${color}`}>
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            status === "online" ? "bg-green-500" : status === "away" ? "bg-yellow-500" : "bg-slate-400"
          }`}
        />
        <span className="capitalize">{status}</span>
        {lastPingAt ? (
          <span className="text-slate-400">· vu {new Date(lastPingAt).toLocaleTimeString("fr-FR")}</span>
        ) : null}
      </span>
    );
  }
  