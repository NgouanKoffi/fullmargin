import { MessageCircleOff } from "lucide-react";

type Props = {
  onRetry?: () => void;
};

export function FriendlyIssue({ onRetry }: Props) {
  return (
    <div className="px-4 py-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl ring-1 ring-black/10 dark:ring-white/10 bg-white/70 dark:bg-white/10 mb-3">
        <MessageCircleOff className="w-6 h-6 opacity-80" />
      </div>

      <div className="text-sm leading-relaxed">
        <p className="font-medium">Aucun message pour le moment.</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Lance la conversation en envoyant un premier message.
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center justify-center px-3.5 py-2 rounded-lg bg-violet-600 text-white text-sm hover:bg-violet-600/90"
        >
          Actualiser
        </button>
      )}
    </div>
  );
}
