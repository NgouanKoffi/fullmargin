// src/pages/admin/Messages/DiffusionTab/DiffusionEditor.tsx
import { ArrowLeft, Save, X, Plus, Loader2 } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";
import type { DiffusionGroup } from "./types";
import { loadSession } from "../../../../auth/lib/storage";
import { api } from "../../../../lib/api";

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

type ApiUserLite = { email?: string; roles?: string[] };
type ApiUsersRes = { users?: ApiUserLite[] };

type ApiAllEmailsRes = {
  totalUsers?: number;
  emails?: string[];
  agentEmails?: string[];
  communityOwnerEmails?: string[];
  shopOwnerEmails?: string[];
};

type Props = {
  value: DiffusionGroup;
  onChange: (next: DiffusionGroup) => void;
  onSave: (next: DiffusionGroup) => Promise<void> | void;
  onBack: () => void;
};

export default function DiffusionEditor({
  value,
  onChange,
  onSave,
  onBack,
}: Props) {
  const [invalid, setInvalid] = useState<string | null>(null);

  // Emails en cache
  const [emailsAll, setEmailsAll] = useState<string[] | null>(null);
  const [emailsAgents, setEmailsAgents] = useState<string[] | null>(null);
  const [emailsCommunityOwners, setEmailsCommunityOwners] = useState<
    string[] | null
  >(null);
  const [emailsShopOwners, setEmailsShopOwners] = useState<string[] | null>(
    null
  );
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [errEmails, setErrEmails] = useState<string | null>(null);

  // Suggestions "Personnaliser"
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [openSug, setOpenSug] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sugEmails, setSugEmails] = useState<string[]>([]);
  const meEmail = getMeEmail();

  // Shape des segments
  type SegShape = {
    everyone: boolean;
    agents: boolean;
    communityOwners: boolean;
    shopOwners: boolean;
    custom: boolean;
    customEmails: string[];
  };

  const seg: SegShape = useMemo(() => {
    const s = value.segments as Partial<SegShape> | undefined;
    const customEmails = Array.isArray(s?.customEmails) ? s!.customEmails : [];
    return {
      everyone: !!s?.everyone,
      agents: !!s?.agents,
      communityOwners: !!s?.communityOwners,
      shopOwners: !!s?.shopOwners,
      custom: !!s?.custom,
      customEmails,
    };
  }, [value.segments]);

  function patch<K extends keyof DiffusionGroup>(k: K, v: DiffusionGroup[K]) {
    onChange({ ...value, [k]: v, updatedAt: new Date().toISOString() });
  }
  function patchSeg(next: Partial<SegShape>) {
    const base: SegShape = seg;
    const merged: SegShape = { ...base, ...next };
    patch("segments", merged as unknown as DiffusionGroup["segments"]);
  }

  const canSave = useMemo(
    () => (value.name || "").trim().length >= 2,
    [value.name]
  );

  // --------------------- Chargement des emails serveur ---------------------
  const ensureAllLoaded = async () => {
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
      // ⚠️ On passe maintenant par le helper `api` (comme partout ailleurs)
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
      console.error("[DiffusionEditor] ensureAllLoaded error:", e);
      setErrEmails(msg);
      setEmailsAll([]);
      setEmailsAgents([]);
      setEmailsCommunityOwners([]);
      setEmailsShopOwners([]);
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    if (seg.everyone) void ensureAllLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg.everyone]);

  useEffect(() => {
    if (seg.agents) void ensureAllLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg.agents]);

  useEffect(() => {
    if (seg.communityOwners) void ensureAllLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg.communityOwners]);

  useEffect(() => {
    if (seg.shopOwners) void ensureAllLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seg.shopOwners]);

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
        // Ici aussi, on passe par `api` pour respecter API_BASE + Auth
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
        const existingLower = seg.customEmails.map((x) => x.toLowerCase());
        const filtered = dedup.filter((e) => !existingLower.includes(e));
        setSugEmails(filtered);
        setOpenSug(filtered.length > 0);
        setActiveIndex(0);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("[DiffusionEditor] search users error:", err);
        setSugEmails([]);
        setOpenSug(false);
      }
    }, 220);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [inputVal, seg.customEmails]);

  function tryAddEmail(raw: string) {
    const email = raw.trim();
    if (!email) return;
    if (!isEmail(email)) {
      setInvalid(`Adresse invalide: ${raw}`);
      return;
    }
    setInvalid(null);
    const listLower = seg.customEmails.map((e) => e.toLowerCase());
    if (listLower.includes(email.toLowerCase())) return;
    patchSeg({ customEmails: [...seg.customEmails, email] });
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
          Math.min(i + 1, Math.max(0, sugEmails.length - 1))
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

  function removeChip(email: string) {
    patchSeg({
      customEmails: seg.customEmails.filter(
        (e) => e.toLowerCase() !== email.toLowerCase()
      ),
    });
  }

  // ----------------------------- Aperçu local -----------------------------
  const preview = useMemo(() => {
    const pools: string[][] = [];
    if (seg.everyone && emailsAll) pools.push(emailsAll);
    if (seg.agents && emailsAgents) pools.push(emailsAgents);
    if (seg.communityOwners && emailsCommunityOwners)
      pools.push(emailsCommunityOwners);
    if (seg.shopOwners && emailsShopOwners) pools.push(emailsShopOwners);
    if (seg.custom && seg.customEmails.length) pools.push(seg.customEmails);
    return unionEmails(...pools);
  }, [seg, emailsAll, emailsAgents, emailsCommunityOwners, emailsShopOwners]);

  async function handleSave() {
    if (!canSave) return;
    await onSave({
      ...value,
      segments: seg as unknown as DiffusionGroup["segments"],
    });
  }

  // ------------------------------- Rendu UI -------------------------------
  return (
    <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-skin-border/15">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ring-1 ring-skin-border/20 hover:bg-skin-tile text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm",
              canSave
                ? "bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                : "bg-skin-tile text-skin-muted",
            ].join(" ")}
          >
            <Save className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* Titre / description */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Nom du groupe</label>
            <input
              value={value.name}
              onChange={(e) => patch("name", e.target.value)}
              className="mt-1 w-full rounded-xl border border-skin-border/30 bg-transparent px-3 py-2"
              placeholder="Ex: Les nouveaux"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Description (facultatif)
            </label>
            <input
              value={value.description || ""}
              onChange={(e) => patch("description", e.target.value)}
              className="mt-1 w-full rounded-xl border border-skin-border/30 bg-transparent px-3 py-2"
              placeholder="Aide-mémoire interne"
            />
          </div>
        </div>

        {/* Inclure */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Inclure</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <ToggleRow
              label="Tout le monde"
              checked={seg.everyone}
              onChange={() => patchSeg({ everyone: !seg.everyone })}
              loading={loadingEmails}
              error={errEmails || undefined}
            />
            <ToggleRow
              label="Agents"
              checked={seg.agents}
              onChange={() => patchSeg({ agents: !seg.agents })}
              loading={loadingEmails}
              error={errEmails || undefined}
            />
            <ToggleRow
              label="Propriétaire de communauté"
              checked={seg.communityOwners}
              onChange={() =>
                patchSeg({ communityOwners: !seg.communityOwners })
              }
              loading={loadingEmails}
              error={errEmails || undefined}
            />
            <ToggleRow
              label="Propriétaire de boutique"
              checked={seg.shopOwners}
              onChange={() => patchSeg({ shopOwners: !seg.shopOwners })}
              loading={loadingEmails}
              error={errEmails || undefined}
            />
            <ToggleRow
              label="Personnaliser"
              checked={seg.custom}
              onChange={() => patchSeg({ custom: !seg.custom })}
            />
          </div>
          <p className="text-xs text-skin-muted">
            Les segments dynamiques sont résolus côté serveur. Le snapshot est
            recalculé lors de la sauvegarde.
          </p>
        </div>

        {/* Personnaliser */}
        {seg.custom && (
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
              {seg.customEmails.map((email) => (
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
                  seg.customEmails.length
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
              (seg.everyone ||
                seg.agents ||
                seg.communityOwners ||
                seg.shopOwners) && (
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
  );
}

// ---------------------------------------------------------------------------
// UI bits
// ---------------------------------------------------------------------------
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
