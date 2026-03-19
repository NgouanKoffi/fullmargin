// src/pages/admin/Messages/MailboxTab/panels/ActionBar.tsx
import { useEffect, useRef } from "react";
import { RefreshCw, Search as SearchIcon, CheckSquare, Trash2 } from "lucide-react";

type Props = {
  totalVisible: number;
  selectedVisible: number;
  loading?: boolean;
  onToggleAll: () => void;
  onRefresh: () => void;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
  onOpenSearch: () => void;
};

export default function ActionBar({
  totalVisible,
  selectedVisible,
  loading,
  onToggleAll,
  onRefresh,
  onMarkAllRead,
  onDeleteAll,
  onOpenSearch,
}: Props) {
  const masterRef = useRef<HTMLInputElement | null>(null);
  const all = totalVisible > 0 && selectedVisible === totalVisible;
  const some = selectedVisible > 0 && selectedVisible < totalVisible;

  useEffect(() => {
    if (masterRef.current) masterRef.current.indeterminate = some;
  }, [some]);

  const disabled = totalVisible === 0;

  return (
    <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 border-b border-skin-border/15">
      <label className="inline-flex items-center gap-2 rounded-xl px-1.5 py-1">
        <input
          ref={masterRef}
          type="checkbox"
          checked={all}
          onChange={onToggleAll}
          className="h-4 w-4 rounded border-skin-border/50"
          aria-label="Sélectionner tout"
          title="Sélectionner tout"
        />
        <span className="sr-only">Tout</span>
      </label>

      <button
        onClick={onRefresh}
        className="inline-flex items-center rounded-xl p-2 ring-1 ring-skin-border/20 hover:bg-skin-tile"
        title="Rafraîchir"
        aria-label="Rafraîchir"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      </button>

      <button
        onClick={onMarkAllRead}
        disabled={disabled}
        className={[
          "inline-flex items-center rounded-xl p-2",
          disabled
            ? "bg-skin-tile text-skin-muted cursor-not-allowed"
            : "ring-1 ring-skin-border/20 hover:bg-skin-tile",
        ].join(" ")}
        title="Tout marquer comme lu"
        aria-label="Tout marquer comme lu"
      >
        <CheckSquare className="w-4 h-4" />
      </button>

      <button
        onClick={onDeleteAll}
        disabled={disabled}
        className={[
          "inline-flex items-center rounded-xl p-2",
          disabled
            ? "bg-skin-tile text-skin-muted cursor-not-allowed"
            : "ring-1 ring-red-300/30 text-red-600 hover:bg-red-50/60 dark:hover:bg-red-500/10",
        ].join(" ")}
        title="Tout supprimer"
        aria-label="Tout supprimer"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <button
        onClick={onOpenSearch}
        className="ml-auto inline-flex items-center rounded-xl p-2 ring-1 ring-skin-border/20 hover:bg-skin-tile"
        title="Rechercher"
        aria-label="Rechercher"
      >
        <SearchIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
