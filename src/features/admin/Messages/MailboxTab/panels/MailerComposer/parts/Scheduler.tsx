import { CalendarClock } from "lucide-react";

type Props = {
  sendAt: string;
  setSendAt: (v: string) => void;
};

export default function Scheduler({ sendAt, setSendAt }: Props) {
  return (
    <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-3">
      <label className="text-xs font-medium text-skin-muted">Planifier l’envoi</label>
      <div className="mt-2">
        <div className="relative">
          <CalendarClock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-skin-muted" />
          <input
            type="datetime-local"
            value={sendAt}
            onChange={(e) => setSendAt(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-skin-border/30 bg-transparent"
          />
        </div>
        <p className="mt-2 text-xs text-skin-muted">Laisser vide pour un envoi immédiat.</p>
      </div>
    </div>
  );
}