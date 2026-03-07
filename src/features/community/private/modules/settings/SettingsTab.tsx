// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\tabs\SettingsTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";

/* -------------------- Types -------------------- */
type CommunitySettings = {
  allowSubscribersPosts: boolean;
};

type SettingsOk = { ok: true; data: CommunitySettings };
type SettingsErr = { ok: false; error: string };
type SettingsResponse = SettingsOk | SettingsErr;

/* -------------------- Utils -------------------- */
const LS_SETTINGS_KEY = "fm:community:settings";

function loadSettingsLocal(): CommunitySettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY);
    if (!raw) return { allowSubscribersPosts: false };
    const parsed = JSON.parse(raw) as Partial<CommunitySettings>;
    return { allowSubscribersPosts: Boolean(parsed.allowSubscribersPosts) };
  } catch {
    return { allowSubscribersPosts: false };
  }
}

function saveSettingsLocal(s: CommunitySettings) {
  try {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (
    err &&
    typeof err === "object" &&
    "error" in (err as Record<string, unknown>)
  ) {
    const e = err as { error?: unknown };
    if (typeof e.error === "string") return e.error;
  }
  return "Une erreur est survenue.";
}

// 👉 à partir de maintenant, on ignore ce type d’erreur
function isAbortError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === "AbortError" || err.message.toLowerCase().includes("abort"))
  );
}

/* -------------------- UI helpers -------------------- */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1
        ${
          active
            ? "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/40"
            : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
        }`}
    >
      {active ? "Activé" : "Désactivé"}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition
        ${disabled ? "opacity-60 cursor-not-allowed" : ""}
        ${checked ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-700"}`}
    >
      <span
        className={`pointer-events-none absolute top-0.5 inline-block h-6 w-6 transform rounded-full bg-white shadow transition
          ${checked ? "translate-x-6" : "translate-x-0.5"}`}
      />
    </button>
  );
}

/* -------------------- Component -------------------- */
export default function SettingsTab({ communityId }: { communityId?: string }) {
  const hasBackend = Boolean(communityId);

  const [settings, setSettings] = useState<CommunitySettings>(() =>
    hasBackend ? { allowSubscribersPosts: false } : loadSettingsLocal()
  );
  const [loading, setLoading] = useState<boolean>(hasBackend);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const authHeader = useMemo<Record<string, string>>(() => {
    const token = loadSession()?.token;
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, []);

  const base = useMemo(() => API_BASE.replace(/\/+$/, ""), []);

  async function safeJson<T>(res: Response): Promise<T | null> {
    try {
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  /* --------- INITIAL LOAD (backend) --------- */
  useEffect(() => {
    if (!hasBackend) return;
    setLoading(true);
    setErr(null);

    // on annule la précédente
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    (async () => {
      try {
        const res = await fetch(
          `${base}/communaute/communities/${encodeURIComponent(
            communityId!
          )}/settings`,
          {
            headers: { ...authHeader, Accept: "application/json" },
            signal: ac.signal,
          }
        );

        if (res.status === 401)
          throw new Error("Non autorisé. Veuillez vous reconnecter.");
        if (res.status === 403) throw new Error("Accès interdit.");
        if (!res.ok) throw new Error(`Lecture impossible (HTTP ${res.status})`);

        const json = await safeJson<SettingsResponse>(res);
        if (!json || json.ok !== true) {
          throw new Error(
            (json as SettingsErr | null)?.error ?? "Lecture impossible"
          );
        }

        setSettings({
          allowSubscribersPosts: Boolean(json.data.allowSubscribersPosts),
        });
        setSavedAt(Date.now());
      } catch (e: unknown) {
        // 👉 si c'est juste un abort, on ne montre rien
        if (isAbortError(e)) return;
        setErr(getErrorMessage(e) || "Connexion au serveur impossible.");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      ac.abort();
    };
  }, [hasBackend, communityId, authHeader, base]);

  /* --------- FALLBACK LOCAL (pas de backend) --------- */
  useEffect(() => {
    if (hasBackend) return;
    saveSettingsLocal(settings);
    setSavedAt(Date.now());
  }, [hasBackend, settings]);

  /* --------- SAVE (backend) — optimiste avec rollback --------- */
  const setAllow = async (next: boolean) => {
    if (!hasBackend) {
      setSettings((s) => ({ ...s, allowSubscribersPosts: next }));
      return;
    }

    setErr(null);
    setSaving(true);

    const prev = settings.allowSubscribersPosts;
    // UI optimiste
    setSettings((s) => ({ ...s, allowSubscribersPosts: next }));

    try {
      const res = await fetch(
        `${base}/communaute/communities/${encodeURIComponent(
          communityId!
        )}/settings`,
        {
          method: "PATCH",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ allowSubscribersPosts: next }),
        }
      );

      if (res.status === 401)
        throw new Error("Votre session a expiré. Veuillez vous reconnecter.");
      if (res.status === 403)
        throw new Error("Interdit : seuls les propriétaires peuvent modifier.");

      const json = await safeJson<SettingsResponse>(res);
      if (!res.ok || !json || json.ok !== true) {
        throw new Error(
          (json as SettingsErr | null)?.error ||
            `Échec de l’enregistrement (HTTP ${res.status})`
        );
      }

      setSavedAt(Date.now());

      // notifier le reste de l’app
      window.dispatchEvent(
        new CustomEvent("fm:community:settings:updated", {
          detail: { communityId, settings: { allowSubscribersPosts: next } },
        })
      );
    } catch (e: unknown) {
      // si c'est un abort → ne pas afficher l'erreur
      if (!isAbortError(e)) {
        setErr(getErrorMessage(e) || "Connexion au serveur impossible.");
      }
      setSettings((s) => ({ ...s, allowSubscribersPosts: prev }));
    } finally {
      setSaving(false);
    }
  };

  /* --------- DEMANDE DE SUPPRESSION --------- */
  const requestDeletion = async () => {
    if (!hasBackend) return alert("Mode déconnecté !");
    if (!window.confirm("Êtes-vous sûr de vouloir demander la suppression de votre communauté ? Vos membres n'y auront plus accès.")) {
      return;
    }

    setSaving(true);
    setErr(null);

    try {
      const res = await fetch(
        `${base}/communaute/communities/${encodeURIComponent(communityId!)}/request-deletion`,
        {
          method: "POST",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ reason: "Demande depuis les paramètres" }),
        }
      );

      const json = await safeJson<{ ok: boolean; error?: string; message?: string }>(res);
      if (!res.ok || !json || !json.ok) {
        throw new Error(json?.error || "Échec de la demande");
      }

      alert(json.message || "Demande envoyée avec succès.");
      // Optionnel : refresh la page ou le composant parent pour afficher le nouveau status
      window.location.reload();
    } catch (e: unknown) {
      setErr(getErrorMessage(e) || "Erreur lors de la demande de suppression.");
    } finally {
      setSaving(false);
    }
  };

  const savedLabel = useMemo(() => {
    if (!savedAt) return "—";
    const d = new Date(savedAt);
    return d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [savedAt]);

  return (
    <div className="w-full">
      <section className="space-y-4 sm:space-y-5">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Paramètres</h2>
            <div className="text-xs text-slate-500">
              {loading
                ? "Chargement…"
                : saving
                ? "Enregistrement…"
                : `Enregistré à ${savedLabel}`}
            </div>
          </div>

          {/* on ne montre plus les erreurs d’abort */}
          {err && (
            <div className="mt-3 text-sm text-red-600 dark:text-red-400">
              {err}
            </div>
          )}

          <div className="mt-4 divide-y divide-slate-200 dark:divide-white/10">
            <div className="py-4 first:pt-0 last:pb-0">
              <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] items-start gap-3 md:gap-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">
                      Autoriser les abonnés à publier sur la page
                    </div>
                    <StatusBadge active={settings.allowSubscribersPosts} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Si activé, les membres abonnés pourront créer des
                    publications visibles sur cette page. Sinon, seuls les
                    administrateurs et modérateurs peuvent publier.
                  </p>
                </div>

                <div className="md:justify-self-end">
                  <Toggle
                    checked={settings.allowSubscribersPosts}
                    onChange={setAllow}
                    label="Autoriser les abonnés à publier sur la page"
                    disabled={loading || saving}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- ZONE DANGER --- */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-red-500/20 dark:bg-slate-900 dark:ring-red-500/30 p-5 sm:p-6 mt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-red-600 dark:text-red-400">Zone dangereuse</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Demander la suppression de cette communauté. Cela la rendra invisible aux nouveaux utilisateurs. Les membres existants garderont accès à leurs formations achetées.
              </p>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={requestDeletion}
                disabled={loading || saving}
                className="inline-flex justify-center rounded-xl bg-red-50/50 dark:bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 ring-1 ring-inset ring-red-600/20 hover:bg-red-50 dark:hover:bg-red-500/20 disabled:opacity-50 transition"
              >
                {saving ? "Envoi..." : "Demander la suppression"}
              </button>
            </div>
          </div>
        </div>

        {!hasBackend && (
          <div className="rounded-2xl bg-white/70 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 p-4 text-sm text-slate-600 dark:text-slate-300">
            Mode déconnecté : l’état est stocké localement dans{" "}
            <code className="mx-1 rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">
              {LS_SETTINGS_KEY}
            </code>
            . Connecte et fournis <code>communityId</code> pour synchroniser sur
            le serveur.
          </div>
        )}
      </section>
    </div>
  );
}
