import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Toast = {
  id: number;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
};

type ToastCtx = {
  push: (t: Omit<Toast, "id">) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const toast: Toast = { id, durationMs: 2500, ...t };
    setItems((xs) => [...xs, toast]);

    if (toast.durationMs && toast.durationMs > 0) {
      window.setTimeout(() => {
        setItems((xs) => xs.filter((x) => x.id !== id));
      }, toast.durationMs);
    }
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <ToastViewport
        items={items}
        onClose={(id) => setItems((xs) => xs.filter((x) => x.id !== id))}
      />
    </Ctx.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

function ToastViewport({
  items,
  onClose,
}: {
  items: Toast[];
  onClose: (id: number) => void;
}) {
  useEffect(() => {
    // iOS: évite le flash bleu lors des taps
    try {
      document.body.style.setProperty(
        "-webkit-tap-highlight-color",
        "transparent"
      );
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[70] space-y-2 w-[min(90vw,360px)]">
      {items.map((t) => (
        <div
          key={t.id}
          className="rounded-xl bg-skin-surface ring-1 ring-skin-border/20 shadow-lg p-3 flex items-center gap-3"
        >
          <div className="text-sm font-medium">{t.title}</div>
          <div className="ml-auto flex items-center gap-2">
            {t.actionLabel && t.onAction && (
              <button
                onClick={() => {
                  t.onAction?.();
                  onClose(t.id);
                }}
                className="text-sm font-semibold px-2.5 py-1 rounded-lg bg-fm-primary/15 text-fm-primary hover:bg-fm-primary/20"
              >
                {t.actionLabel}
              </button>
            )}
            <button
              onClick={() => onClose(t.id)}
              aria-label="Fermer"
              className="text-xs text-skin-muted hover:text-skin-base"
            >
              Fermer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
