// src/pages/admin/Messages/DiffusionTab.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Loader2, Plus, X } from "lucide-react";
import { api } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";
import { notifyError, notifySuccess } from "../../../components/Notification";

/* ------------------------------------------------------------------ */
/* Types simples                                                       */
/* ------------------------------------------------------------------ */

type UserCounts = {
  totalUsers: number;
  usersWithEmail: number;
  uniqueEmails: number;
};

type Segments = {
  everyone: boolean;
  agents: boolean;
  communityOwners: boolean;
  shopOwners: boolean;
  custom: boolean;
  customEmails: string[];
};

type ApiUsersRes = {
  users?: { email?: string }[];
};

type ApiAllEmailsRes = {
  totalUsers?: number;
  emails?: string[];
  agentEmails?: string[];
  communityOwnerEmails?: string[];
  shopOwnerEmails?: string[];
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function unionEmails(...lists: string[][]): string[] {
  const s = new Set<string>();
  for (const arr of lists) for (const e of arr) s.add(e.toLowerCase());
  return Array.from(s);
}

function getMeEmail(): string | null {
  try {
    const sess = loadSession?.();
    const email = sess?.user?.email;
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Composant principal                                                 */
/* ------------------------------------------------------------------ */

export default function DiffusionTab() {
  // segments sélectionnés
  const [segments, setSegments] = useState<Segments>({
    everyone: false,
    agents: false,
    communityOwners: false,
    shopOwners: false,
    custom: false,
    customEmails: [],
  });

  const meEmail = getMeEmail();

  // stats globales
  const [userCounts, setUserCounts] = useState<UserCounts | null>(null);

  // caches d’emails par segment
  const [emailsAll, setEmailsAll] = useState<string[] | null>(null);
  const [emailsAgents, setEmailsAgents] = useState<string[] | null>(null);
  const [emailsCommunityOwners, setEmailsCommunityOwners] = useState<
    string[] | null
  >(null);
  const [emailsShopOwners, setEmailsShopOwners] = useState<string[] | null>(
    null,
  );

  const [loadingEmails, setLoadingEmails] = useState(false);
  const [errEmails, setErrEmails] = useState<string | null>(null);

  // saisie pour "Personnaliser"
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [invalid, setInvalid] = useState<string | null>(null);

  // suggestions
  const [openSug, setOpenSug] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sugEmails, setSugEmails] = useState<string[]>([]);

  // chargement stats globales (debug)
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<UserCounts>("/admin/debug/email-counts");
        setUserCounts(data);
      } catch (e) {
        console.warn("Unable to load user counts", e);
      }
    })();
  }, []);

  // maj segments
  const patchSegments = useCallback((next: Partial<Segments>) => {
    setSegments((prev) => ({ ...prev, ...next }));
  }, []);

  // --------------------- Chargement des emails serveur ---------------------

  const ensureAllLoaded = useCallback(async () => {
    if (
      (emailsAll &&
        emailsAgents &&
        emailsCommunityOwners &&
        emailsShopOwners) ||
      loadingEmails
    ) {
      return;
    }

    setLoadingEmails(true);
    setErrEmails(null);

    try {
      const data = await api.get<ApiAllEmailsRes>("/admin/users/all-emails");

      const all = Array.isArray(data.emails) ? data.emails : [];
      const agents = Array.isArray(data.agentEmails) ? data.agentEmails : [];
      const comm = Array.isArray(data.communityOwnerEmails)
        ? data.communityOwnerEmails
        : [];
      const shops = Array.isArray(data.shopOwnerEmails)
        ? data.shopOwnerEmails
        : [];

      const mergedAll = meEmail
        ? unionEmails(all, [meEmail])
        : unionEmails(all);

      setEmailsAll(mergedAll);
      setEmailsAgents(unionEmails(agents));
      setEmailsCommunityOwners(unionEmails(comm));
      setEmailsShopOwners(unionEmails(shops));
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Erreur de chargement des emails";
      console.error("[DiffusionTab] ensureAllLoaded error:", e);
      setErrEmails(msg);
      setEmailsAll([]);
      setEmailsAgents([]);
      setEmailsCommunityOwners([]);
      setEmailsShopOwners([]);
    } finally {
      setLoadingEmails(false);
    }
  }, [
    emailsAll,
    emailsAgents,
    emailsCommunityOwners,
    emailsShopOwners,
    loadingEmails,
    meEmail,
  ]);

  useEffect(() => {
    if (
      segments.everyone ||
      segments.agents ||
      segments.communityOwners ||
      segments.shopOwners
    ) {
      void ensureAllLoaded();
    }
  }, [segments, ensureAllLoaded]);

  // -------------------------- Suggestions custom --------------------------

  useEffect(() => {
    const q = inputVal.trim();
    setOpenSug(false);
    if (!q || q.length < 2) {
      setSugEmails([]);
      return;
    }

    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const data = await api.get<ApiUsersRes>("/admin/users", {
          query: { q, limit: 8 },
          signal: ctrl.signal,
        });

        const emails = Array.isArray(data?.users)
          ? data.users
              .map((u) => (typeof u.email === "string" ? u.email : ""))
              .filter(Boolean)
          : [];
        const dedup = unionEmails(emails);
        const existingLower = segments.customEmails.map((x) => x.toLowerCase());
        const filtered = dedup.filter((e) => !existingLower.includes(e));
        setSugEmails(filtered);
        setOpenSug(filtered.length > 0);
        setActiveIndex(0);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("[DiffusionTab] search users error:", err);
        setSugEmails([]);
        setOpenSug(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [inputVal, segments.customEmails]);

  function tryAddEmail(raw: string) {
    const email = raw.trim();
    if (!email) return;
    if (!isEmail(email)) {
      setInvalid(`Adresse invalide : ${raw}`);
      return;
    }
    setInvalid(null);
    const listLower = segments.customEmails.map((e) => e.toLowerCase());
    if (listLower.includes(email.toLowerCase())) return;
    patchSegments({ customEmails: [...segments.customEmails, email] });
  }

  function removeChip(email: string) {
    patchSegments({
      customEmails: segments.customEmails.filter(
        (e) => e.toLowerCase() !== email.toLowerCase(),
      ),
    });
  }

  function pickSuggestion(idx: number) {
    const chosen = sugEmails[idx];
    if (!chosen) return;
    tryAddEmail(chosen);
    setInputVal("");
    setOpenSug(false);
    inputRef.current?.focus();
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
      if (key === "arrowdown")
        setActiveIndex((i) =>
          Math.min(i + 1, Math.max(0, sugEmails.length - 1)),
        );
      else if (key === "arrowup") setActiveIndex((i) => Math.max(i - 1, 0));
      else if (key === "enter") pickSuggestion(activeIndex);
      else if (key === "escape") setOpenSug(false);
      return;
    }
    const val = e.currentTarget.value;
    if (key === "enter" || key === "," || key === " ") {
      e.preventDefault();
      tryAddEmail(val);
      setInputVal("");
    }
  }

  // ----------------------------- Aperçu local -----------------------------

  const preview = useMemo(() => {
    const pools: string[][] = [];
    if (segments.everyone && emailsAll) pools.push(emailsAll);
    if (segments.agents && emailsAgents) pools.push(emailsAgents);
    if (segments.communityOwners && emailsCommunityOwners)
      pools.push(emailsCommunityOwners);
    if (segments.shopOwners && emailsShopOwners) pools.push(emailsShopOwners);
    if (segments.custom && segments.customEmails.length)
      pools.push(segments.customEmails);
    return unionEmails(...pools);
  }, [
    segments,
    emailsAll,
    emailsAgents,
    emailsCommunityOwners,
    emailsShopOwners,
  ]);

  // ----------------------------- Export actions ---------------------------

  const handleCopy = () => {
    if (!preview.length) {
      notifyError("Aucun email à copier.");
      return;
    }
    navigator.clipboard
      .writeText(preview.join(", "))
      .then(() => notifySuccess("Emails copiés dans le presse-papier."))
      .catch(() => notifyError("Impossible de copier les emails."));
  };

  const handleExportCsv = () => {
    if (!preview.length) {
      notifyError("Aucun email à exporter.");
      return;
    }

    const header = "email\n";
    const rows = preview.join("\n");
    const blob = new Blob([header + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "destinataires_emails.csv";
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess("Export CSV généré.");
  };

  // ------------------------------- Rendu UI --------------------------------

  return (
    <div className="space-y-4">
      {userCounts && (
        <div className="text-xs text-skin-muted">
          Utilisateurs en base : <strong>{userCounts.totalUsers}</strong> — avec
          email : <strong>{userCounts.usersWithEmail}</strong> — emails uniques
          : <strong>{userCounts.uniqueEmails}</strong>
        </div>
      )}

      {/* Header d’actions */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="text-sm text-skin-muted">
          Sélectionne un ou plusieurs segments puis copie / exporte les emails
          pour les utiliser dans Gmail.
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs ring-1 ring-skin-border/30 hover:bg-skin-tile"
          >
            <Copy className="w-3.5 h-3.5" />
            Copier les emails
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter CSV
          </button>
        </div>
      </div>

      <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface overflow-hidden">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Bloc Inclure */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Inclure</div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <ToggleRow
                label="Tout le monde"
                checked={segments.everyone}
                onChange={() => patchSegments({ everyone: !segments.everyone })}
                loading={loadingEmails}
                error={errEmails || undefined}
              />
              <ToggleRow
                label="Agents"
                checked={segments.agents}
                onChange={() => patchSegments({ agents: !segments.agents })}
                loading={loadingEmails}
                error={errEmails || undefined}
              />
              <ToggleRow
                label="Propriétaire de communauté"
                checked={segments.communityOwners}
                onChange={() =>
                  patchSegments({
                    communityOwners: !segments.communityOwners,
                  })
                }
                loading={loadingEmails}
                error={errEmails || undefined}
              />
              <ToggleRow
                label="Propriétaire de boutique"
                checked={segments.shopOwners}
                onChange={() =>
                  patchSegments({ shopOwners: !segments.shopOwners })
                }
                loading={loadingEmails}
                error={errEmails || undefined}
              />
              <ToggleRow
                label="Personnaliser"
                checked={segments.custom}
                onChange={() => patchSegments({ custom: !segments.custom })}
              />
            </div>
            <p className="text-xs text-skin-muted">
              Les segments sont calculés dynamiquement à partir des utilisateurs
              en base. Les doublons sont automatiquement supprimés.
            </p>
          </div>

          {/* Personnaliser */}
          {segments.custom && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Ajouter des emails</div>

              <div
                className={[
                  "relative",
                  "rounded-xl border border-skin-border/30 bg-transparent px-2 py-2 min-h-[46px]",
                  "flex flex-wrap items-center gap-2",
                ].join(" ")}
                onClick={() => inputRef.current?.focus()}
              >
                {segments.customEmails.map((email) => (
                  <Chip
                    key={email}
                    text={email}
                    onRemove={() => removeChip(email)}
                  />
                ))}

                <input
                  ref={inputRef}
                  type="email"
                  value={inputVal}
                  onChange={(e) => {
                    setInvalid(null);
                    setInputVal(e.target.value);
                  }}
                  onKeyDown={onInputKeyDown}
                  onBlur={() => setTimeout(() => setOpenSug(false), 120)}
                  className="min-w-[140px] flex-1 bg-transparent outline-none text-sm px-1 py-1"
                  placeholder={
                    segments.customEmails.length
                      ? ""
                      : "Tapez un email — suggestions automatiques"
                  }
                />

                <button
                  type="button"
                  onClick={() => {
                    const v = inputVal.trim();
                    if (!v) return;
                    tryAddEmail(v);
                    setInputVal("");
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ring-1 ring-skin-border/30 hover:bg-skin-tile"
                  title="Ajouter l’email saisi"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter
                </button>

                {openSug && sugEmails.length > 0 && (
                  <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-full rounded-xl border border-skin-border/30 bg-skin-surface shadow-xl overflow-hidden">
                    {sugEmails.map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickSuggestion(i)}
                        className={[
                          "w-full text-left px-3 py-2 text-sm hover:bg-skin-tile",
                          i === activeIndex ? "bg-skin-tile" : "",
                        ].join(" ")}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {invalid && <div className="text-xs text-red-600">{invalid}</div>}
            </div>
          )}

          {/* Aperçu */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Aperçu des destinataires ({preview.length})
              {loadingEmails &&
                (segments.everyone ||
                  segments.agents ||
                  segments.communityOwners ||
                  segments.shopOwners) && (
                  <span className="inline-flex items-center gap-1 ml-2 text-skin-muted">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> chargement…
                  </span>
                )}
            </div>
            <div className="rounded-xl border border-skin-border/30 bg-transparent max-h-[260px] overflow-y-auto">
              {preview.length === 0 ? (
                <div className="p-4 text-sm text-skin-muted">
                  Aucun destinataire pour le moment.
                </div>
              ) : (
                <ul className="p-2 text-sm">
                  {preview.map((e) => (
                    <li
                      key={e}
                      className="px-2 py-1 rounded-lg hover:bg-skin-tile tabular-nums"
                    >
                      {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-skin-muted">
              Les doublons sont retirés automatiquement (union de tous les
              ensembles sélectionnés).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Petits composants UI                                               */
/* ------------------------------------------------------------------ */

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
  note,
  loading,
  error,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  note?: string;
  loading?: boolean;
  error?: string;
}) {
  return (
    <label
      aria-disabled={disabled ? true : undefined}
      title={disabled && note ? note : undefined}
      className={[
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-skin-border/20 cursor-pointer select-none",
        checked ? "bg-[#7c3aed]/10 ring-[#7c3aed]/30" : "hover:bg-skin-tile",
        disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : "",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span>{label}</span>
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {disabled && note && !loading && (
        <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full ring-1 ring-skin-border/30 text-skin-muted">
          {note}
        </span>
      )}
      {!disabled && error && !loading && (
        <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full ring-1 ring-red-300 text-red-600">
          Erreur
        </span>
      )}
    </label>
  );
}

function Chip({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ring-1 ring-skin-border/30">
      {text}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Retirer"
        title="Retirer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}
