import { Loader2, Send, X } from "lucide-react";
import type { SenderOption } from "../types";

type Props = {
  onClose: () => void;
  senderId: string;
  setSenderId: (v: string) => void;
  sendersOptions: SenderOption[];
  canSend: boolean;
  sending: boolean;
  onSend: () => void;
  /** ⬅️ Si true, on verrouille le select "De :" (cas agent → podcast only) */
  disableSenderSelect?: boolean;
};

export default function Topbar({
  onClose,
  senderId,
  setSenderId,
  sendersOptions,
  canSend,
  sending,
  onSend,
  disableSenderSelect = false,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-2 sm:px-3 py-2 border-b border-skin-border/15">
      <button
        onClick={onClose}
        className="rounded-xl p-2 hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Fermer"
        title="Fermer"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate">Nouveau message</div>
      </div>

      <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
        <label className="text-xs text-skin-muted shrink-0">
          {disableSenderSelect ? "De (restreint) :" : "De :"}
        </label>
        <select
          value={senderId}
          onChange={(e) => setSenderId(e.target.value)}
          disabled={disableSenderSelect}
          className="w-full sm:w-72 rounded-xl border border-skin-border/30 bg-transparent px-3 py-1.5 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          title={disableSenderSelect ? "Expéditeur imposé par votre rôle" : "Choisir l’expéditeur"}
        >
          {sendersOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} &lt;{s.email}&gt;
            </option>
          ))}
        </select>
      </div>

      <div className="ml-auto">
        <button
          onClick={onSend}
          disabled={!canSend || sending}
          className={[
            "inline-flex items-center gap-2 rounded-xl px-3 py-1.5",
            canSend && !sending ? "bg-[#7c3aed] text-white hover:bg-[#6d28d9]" : "bg-skin-tile text-skin-muted",
          ].join(" ")}
          title="Envoyer"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Envoyer
        </button>
      </div>
    </div>
  );
}