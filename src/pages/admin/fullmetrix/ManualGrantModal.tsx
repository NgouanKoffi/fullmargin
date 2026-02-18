// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\fullmetrix\ManualGrantModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../../lib/api";
import { notifyError, notifySuccess } from "../../../components/Notification";
import { loadSession } from "../../../auth/lib/storage";
import { Loader2, X } from "lucide-react";

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

type ApiUsersRes = {
  users?: {
    _id: string;
    email?: string;
    profile?: { fullName?: string; name?: string };
  }[];
};

type Suggestion = {
  id: string;
  email: string;
  label: string;
};

type MeInfo = {
  id: string | null;
  email: string | null;
};

function ManualGrantModalInner({ onClose, onSaved }: Props) {
  const [email, setEmail] = useState("");
  const [months, setMonths] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const [sugs, setSugs] = useState<Suggestion[]>([]);
  const [openSug, setOpenSug] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const meInfo: MeInfo | null = useMemo(() => {
    try {
      const sess: any = loadSession?.();
      const rawUser = (sess?.user || {}) as {
        email?: string;
        _id?: string;
        id?: string;
      };

      const emailRaw = rawUser.email;
      const idRaw = rawUser._id ?? rawUser.id;

      const cleanEmail =
        typeof emailRaw === "string" && emailRaw.trim().length > 0
          ? emailRaw.trim()
          : null;
      const cleanId =
        typeof idRaw === "string" && idRaw.trim().length > 0
          ? idRaw.trim()
          : null;

      if (!cleanEmail) return null;
      return { id: cleanId, email: cleanEmail };
    } catch {
      return null;
    }
  }, []);

  /* ------------------ Recherche d'utilisateurs par email ------------------ */

  useEffect(() => {
    const q = email.trim();
    setOpenSug(false);

    if (!q || q.length < 2) {
      setSugs([]);
      setSearching(false);
      return;
    }

    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        setSearching(true);

        const data = await api.get<ApiUsersRes>("/admin/users", {
          query: { q },
          signal: ctrl.signal,
        });

        const fromApi: Suggestion[] = Array.isArray(data?.users)
          ? (data.users
              .map((u) => {
                const mail = typeof u.email === "string" ? u.email.trim() : "";
                if (!mail) return null;
                const p = u.profile || {};
                const name = p.fullName || p.name || undefined;
                return {
                  id: String(u._id),
                  email: mail,
                  label: name ? `${name} — ${mail}` : mail,
                } as Suggestion;
              })
              .filter(Boolean) as Suggestion[])
          : [];

        const lowerQ = q.toLowerCase();

        const own: Suggestion[] =
          meInfo && meInfo.email && meInfo.email.toLowerCase().includes(lowerQ)
            ? [
                {
                  id: meInfo.id ?? "me",
                  email: meInfo.email,
                  label: `${meInfo.email} (moi)`,
                },
              ]
            : [];

        const all: Suggestion[] = [];
        const seen = new Set<string>();
        for (const s of [...own, ...fromApi]) {
          const key = s.email.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          all.push(s);
        }

        setSugs(all);
        setOpenSug(all.length > 0);
        setActiveIndex(0);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("[ManualGrantModal] search error:", err);
        setSugs([]);
        setOpenSug(false);
      } finally {
        setSearching(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [email, meInfo]);

  function pickSuggestion(idx: number) {
    const chosen = sugs[idx];
    if (!chosen) return;
    setEmail(chosen.email);
    setOpenSug(false);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const key = e.key.toLowerCase();

    if (
      openSug &&
      (key === "arrowdown" ||
        key === "arrowup" ||
        key === "enter" ||
        key === "escape")
    ) {
      e.preventDefault();
      if (key === "arrowdown") {
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, sugs.length - 1)));
      } else if (key === "arrowup") {
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (key === "enter") {
        pickSuggestion(activeIndex);
      } else if (key === "escape") {
        setOpenSug(false);
      }
      return;
    }
  }

  /* --------------------------- Submit access --------------------------- */

  async function submit() {
    const typed = email.trim().toLowerCase();
    if (!typed) {
      notifyError("Renseigne un email d’utilisateur.");
      return;
    }

    if (months <= 0) {
      notifyError("La durée doit être d’au moins 1 mois.");
      return;
    }

    try {
      setLoading(true);

      let userId: string | null = null;

      const fromSugs = sugs.find((s) => s.email.toLowerCase() === typed);
      if (fromSugs) {
        userId = fromSugs.id;
      } else if (
        meInfo &&
        meInfo.email &&
        meInfo.email.toLowerCase() === typed &&
        meInfo.id
      ) {
        userId = meInfo.id;
      }

      if (!userId) {
        const data = await api.get<ApiUsersRes>("/admin/users", {
          query: { q: typed },
        });

        const found =
          Array.isArray(data?.users) &&
          data.users.find(
            (u) =>
              typeof u.email === "string" &&
              u.email.trim().toLowerCase() === typed,
          );

        if (!found) {
          notifyError(
            "Utilisateur introuvable. Choisis un email dans la liste des suggestions.",
          );
          setLoading(false);
          return;
        }

        userId = String(found._id);
      }

      await api.post("/payments/admin/fm-metrix/grant", {
        userId,
        months,
      });

      notifySuccess("Accès manuel ajouté.");
      onSaved();
      onClose();
    } catch (err) {
      console.error("[ManualGrantModal] submit error:", err);
      notifyError("Erreur lors de l'ajout d'accès.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      {/* ⚪️ Carte s'adapte au dark mode */}
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
        {/* Bouton fermer */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Ajouter un accès FM-Metrix
        </h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Choisis un utilisateur par email puis définis la durée d&apos;accès en
          mois. Un enregistrement sera créé dans FM-Metrix et dans
          l&apos;historique.
        </p>

        {/* Email + suggestions */}
        <div className="mb-4 space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Email utilisateur
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onInputKeyDown}
              onBlur={() => setTimeout(() => setOpenSug(false), 120)}
              placeholder="ex: user@gmail.com"
            />
            {searching && (
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}

            {openSug && sugs.length > 0 && (
              <div className="absolute left-0 top-[calc(100%+4px)] z-[110] max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl">
                {sugs.map((s, i) => (
                  <button
                    key={`${s.id}-${s.email}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickSuggestion(i)}
                    className={[
                      "w-full px-3 py-2 text-left text-sm",
                      i === activeIndex
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-300",
                    ].join(" ")}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Durée */}
        <div className="mb-6 space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Durée d&apos;accès (en mois)
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1} mois
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ▼
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-xl px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading || !email.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "En cours..." : "Ajouter l’accès"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManualGrantModal(props: Props) {
  if (typeof document === "undefined") return null;
  const target = document.getElementById("root") ?? document.body;
  return createPortal(<ManualGrantModalInner {...props} />, target);
}
