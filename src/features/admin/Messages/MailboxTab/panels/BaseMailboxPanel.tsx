// src/pages/admin/Messages/MailboxTab/panels/BaseMailboxPanel.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCw,
  Search as SearchIcon,
  Star,
  StarOff,
  CheckSquare,
  Square,
  Send,
} from "lucide-react";
import MailSearchDialog from "./MailSearchDialog";

import MailReadScreen from "./MailReadScreen";
import type { ComposerResult, SenderOption } from "./MailerComposer/types";
import MailerComposer from "./MailerComposer";
import { api, ApiError } from "@core/api/client";
import { useAuth } from "@core/auth/AuthContext";
import { notifyError, notifySuccess } from "@shared/components/Notification";


/* ============================ Types ============================ */

type Folder = "inbox" | "sent" | "draft" | "trash";

type ApiRow = {
  id: string;
  folder: Folder;
  fromName?: string;
  fromEmail?: string;
  toEmails?: string[];
  subject?: string;
  snippet?: string;
  date?: string;
  unread?: boolean;
  starred?: boolean;
};

type Mail = {
  id: string;
  folder: Folder;
  fromName: string;
  fromEmail: string;
  toEmails?: string[];
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
  starred: boolean;
};

type Attachment = {
  name?: string;
  type?: string;
  size?: number;
  url?: string;
};

type ReadMail = {
  id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  date: string;
  toEmails?: string[];
  bodyHtml?: string;
  bodyText?: string;
  attachments?: Attachment[];
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const isHexObjectId = (s: string) => /^[0-9a-fA-F]{24}$/.test(s);

/* ======================== API: mailbox ======================== */

async function apiList(folder: Folder): Promise<Mail[]> {
  const data = await api.get<{ items: ApiRow[] }>("/admin/mailbox/messages", {
    query: { folder, limit: 100 },
  });
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map((m) => ({
    id: String(m.id),
    folder: m.folder,
    fromName: m.fromName?.trim() || m.fromEmail?.trim() || "inconnu",
    fromEmail: m.fromEmail || "",
    toEmails: m.toEmails || [],
    subject: m.subject || "(Sans objet)",
    snippet: m.snippet || "",
    date: m.date || new Date().toISOString(),
    unread: !!m.unread,
    starred: !!m.starred,
  }));
}

async function apiGetDetail(id: string): Promise<ReadMail> {
  return api.get<ReadMail>(`/admin/mailbox/messages/${encodeURIComponent(id)}`);
}

async function apiPatchRead(id: string) {
  if (!isHexObjectId(id)) return;
  await api.patch(`/admin/mailbox/messages/${id}/read`);
}

async function apiPatchStar(id: string) {
  if (!isHexObjectId(id)) return;
  await api.patch(`/admin/mailbox/messages/${id}/star`);
}

/* ======================== Envoi (broadcast) ======================== */

function buildBroadcastFormData(payload: ComposerResult): FormData {
  const fd = new FormData();
  const { attachments, ...rest } = payload;
  fd.append("payload", JSON.stringify(rest));
  for (const f of attachments || []) fd.append("attachments", f, f.name);
  return fd;
}

async function postBroadcast(payload: ComposerResult) {
  const form = buildBroadcastFormData(payload);
  // Pas de Content-Type manuel: boundary géré par le navigateur
  await api(`/admin/mailer/broadcasts`, { method: "POST", body: form });
}

/* ======================== Expéditeurs ======================= */
const SENDERS: SenderOption[] = [
  { id: "noreply", name: "Équipe FullMargin", email: "noreply@fullmargin.net" },
  {
    id: "podcast",
    name: "FullMargin Podcast",
    email: "podcast@fullmargin.net",
  },
];

/* ====================== Filtre noreply / podcast ====================== */
type SenderFilter = "all" | "noreply" | "podcast";
const SENDER_EMAIL: Record<Exclude<SenderFilter, "all">, string> = {
  noreply: "noreply@fullmargin.net",
  podcast: "podcast@fullmargin.net",
};

function mailMatchesSenderFilter(
  m: Mail,
  folder: Folder,
  filter: SenderFilter
): boolean {
  if (filter === "all") return true;
  const alias = SENDER_EMAIL[filter];

  if (folder === "sent") {
    return (m.fromEmail || "").toLowerCase() === alias;
  }
  const toList = (m.toEmails || []).map((s) => s.toLowerCase());
  if (toList.includes(alias)) return true;
  return (m.fromEmail || "").toLowerCase() === alias;
}

/* =============================== Composant ============================ */

type ComposerSeed = {
  to?: string[];
  subject?: string;
  html?: string;
  senderId?: string;
};

export default function BaseMailboxPanel({ folder }: { folder: Folder }) {
  const { status, user } = useAuth();
  const roles = user?.roles ?? [];
  const isAgent = status === "authenticated" && roles.includes("agent");

  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  const [reading, setReading] = useState<ReadMail | null>(null);
  const [items, setItems] = useState<Mail[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [senderFilter, setSenderFilter] = useState<SenderFilter>(
    isAgent ? "podcast" : "all"
  );
  useEffect(() => {
    if (isAgent) setSenderFilter("podcast");
  }, [isAgent]);

  const [seed, setSeed] = useState<ComposerSeed | null>(null);

  useEffect(() => {
    let abort = false;
    async function run() {
      try {
        setLoading(true);
        const rows = await apiList(folder);
        if (!abort) {
          setItems(rows);
          setReading(null);
          setSelectedIds(new Set());
        }
      } catch (e: unknown) {
        let msg = e instanceof Error ? e.message : "Chargement impossible.";
        if (e instanceof ApiError) {
          if (e.status === 401) msg = "Accès refusé (401). Vérifie ta session.";
          else if (e.status === 403)
            msg = "Accès refusé (403). Rôle admin requis.";
        }
        notifyError(msg);
        if (!abort) {
          setItems([]);
          setSelectedIds(new Set());
        }
      } finally {
        if (!abort) setLoading(false);
      }
    }
    run();
    return () => {
      abort = true;
    };
  }, [folder]);

  const counts = useMemo(() => {
    const base = { all: items.length, noreply: 0, podcast: 0 };
    for (const m of items) {
      if (mailMatchesSenderFilter(m, folder, "noreply")) base.noreply++;
      if (mailMatchesSenderFilter(m, folder, "podcast")) base.podcast++;
    }
    return base;
  }, [items, folder]);

  const list = useMemo(() => {
    const arr =
      senderFilter === "all"
        ? items
        : items.filter((m) => mailMatchesSenderFilter(m, folder, senderFilter));
    if (!q.trim()) return arr;
    const n = q.toLowerCase();
    return arr.filter(
      (m) =>
        m.subject.toLowerCase().includes(n) ||
        m.snippet.toLowerCase().includes(n) ||
        m.fromName.toLowerCase().includes(n) ||
        m.fromEmail.toLowerCase().includes(n)
    );
  }, [items, q, senderFilter, folder]);

  const allVisibleSelected =
    list.length > 0 && list.every((m) => selectedIds.has(m.id));
  const someVisibleSelected = list.some((m) => selectedIds.has(m.id));

  const masterRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.indeterminate =
        !allVisibleSelected && someVisibleSelected;
    }
  }, [allVisibleSelected, someVisibleSelected]);

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set<string>(prev);
      if (allVisibleSelected) list.forEach((m) => next.delete(m.id));
      else list.forEach((m) => next.add(m.id));
      return next;
    });
  }

  async function toggleStar(id: string) {
    if (!isHexObjectId(id)) return;
    setItems((arr) =>
      arr.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m))
    );
    try {
      await apiPatchStar(id);
    } catch {
      setItems((arr) =>
        arr.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m))
      );
    }
  }

  async function markAllRead() {
    const targetIds = list.map((m) => m.id).filter(isHexObjectId);
    setItems((arr) =>
      arr.map((m) => (targetIds.includes(m.id) ? { ...m, unread: false } : m))
    );
    setSelectedIds(new Set());
    for (const id of targetIds) {
      try {
        await apiPatchRead(id);
      } catch {
        // noop
      }
    }
  }

  async function refresh() {
    try {
      setLoading(true);
      const rows = await apiList(folder);
      setItems(rows);
      setSelectedIds(new Set());
    } catch (e: unknown) {
      let msg = e instanceof Error ? e.message : "Rafraîchissement impossible.";
      if (e instanceof ApiError) {
        if (e.status === 401) msg = "Accès refusé (401). Vérifie ta session.";
        else if (e.status === 403)
          msg = "Accès refusé (403). Rôle admin requis.";
      }
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function openRead(row: Mail) {
    if (isHexObjectId(row.id)) {
      setItems((arr) =>
        arr.map((x) => (x.id === row.id ? { ...x, unread: false } : x))
      );
      apiPatchRead(row.id).catch(() => {});
    }
    try {
      const full = await apiGetDetail(row.id);
      setReading(full);
    } catch {
      setReading({
        id: row.id,
        subject: row.subject,
        fromName: row.fromName?.trim() || row.fromEmail?.trim() || "inconnu",
        fromEmail: row.fromEmail,
        date: row.date,
        bodyText: row.snippet,
      });
    }
  }

  function mailboxBadge(m: Mail) {
    const isSent = folder === "sent";
    const to = (m.toEmails || []).map((s) => s.toLowerCase());
    const noreplyHit = isSent
      ? (m.fromEmail || "").toLowerCase() === SENDER_EMAIL.noreply
      : to.includes(SENDER_EMAIL.noreply);
    const podcastHit = isSent
      ? (m.fromEmail || "").toLowerCase() === SENDER_EMAIL.podcast
      : to.includes(SENDER_EMAIL.podcast);

    if (noreplyHit)
      return (
        <span className="ml-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 ring-1 ring-fuchsia-500/25">
          noreply
        </span>
      );
    if (podcastHit)
      return (
        <span className="ml-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/25">
          podcast
        </span>
      );
    return null;
  }

  const composerSenders = isAgent
    ? SENDERS.filter((s) => s.id === "podcast")
    : SENDERS;
  const composerDefaultSenderId = isAgent ? "podcast" : SENDERS[0]?.id;

  return (
    <>
      {reading ? (
        <MailReadScreen
          mail={reading}
          onBack={() => setReading(null)}
          onReply={(draft) => {
            const enforced = isAgent
              ? { ...draft, senderId: "podcast" }
              : draft;
            setSeed(enforced);
            setComposerOpen(true);
            setReading(null);
          }}
        />
      ) : (
        <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 border-b border-skin-border/15">
            <label className="inline-flex items-center gap-2 rounded-xl px-1.5 py-1">
              <input
                ref={masterRef}
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-skin-border/50"
                aria-label="Sélectionner tout"
                title="Sélectionner tout"
              />
              <span className="sr-only">Tout</span>
            </label>

            <button
              onClick={() => setComposerOpen(true)}
              className="inline-flex items-center rounded-xl p-2 ring-1 ring-skin-border/20 hover:bg-skin-tile"
              title="Nouveau message"
              aria-label="Nouveau message"
            >
              <Send className="w-4 h-4" />
            </button>

            <button
              onClick={refresh}
              className="inline-flex items-center rounded-xl p-2 ring-1 ring-skin-border/20 hover:bg-skin-tile"
              title="Rafraîchir"
              aria-label="Rafraîchir"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </button>

            {folder !== "sent" && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center rounded-xl p-2 ring-1 ring-skin-border/20 hover:bg-skin-tile"
                title="Tout marquer comme lu"
                aria-label="Tout marquer comme lu"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
            )}

            {!isAgent && (
              <div className="ml-auto flex items-center gap-1 rounded-xl ring-1 ring-skin-border/20 p-1 bg-skin-surface">
                {(
                  [
                    { id: "all", label: "Tous", count: counts.all },
                    { id: "noreply", label: "noreply", count: counts.noreply },
                    { id: "podcast", label: "podcast", count: counts.podcast },
                  ] as Array<{ id: SenderFilter; label: string; count: number }>
                ).map(({ id, label, count }) => {
                  const active = senderFilter === id;
                  return (
                    <button
                      key={id}
                      aria-pressed={active}
                      onClick={() => setSenderFilter(id)}
                      className={[
                        "px-2.5 py-1 text-xs rounded-lg transition whitespace-nowrap",
                        active
                          ? "bg-skin-tile font-semibold"
                          : "hover:bg-skin-tile/70 text-skin-muted",
                      ].join(" ")}
                      title={`Afficher ${label}`}
                    >
                      <span className="align-middle">{label}</span>
                      <span className="ml-1 text-[10px] opacity-75 tabular-nums">
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setSearchOpen(true)}
              className="ml-auto inline-flex items-center rounded-xl p-2 ring-1 ring-skin-border/20 hover:bg-skin-tile"
              title="Rechercher"
              aria-label="Rechercher"
            >
              <SearchIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Liste */}
          <div className="max-h-[72vh] overflow-y-auto">
            {list.length === 0 ? (
              <div className="p-6 text-sm text-skin-muted">Aucun message.</div>
            ) : (
              list.map((m) => {
                const unread = !!m.unread;
                const chosen = selectedIds.has(m.id);
                const isBroadcast = !isHexObjectId(m.id);

                return (
                  <div
                    key={m.id}
                    className={[
                      "border-b border-skin-border/10 transition",
                      unread
                        ? "bg-violet-50/70 dark:bg-violet-900/15"
                        : "bg-transparent",
                      chosen ? "ring-1 ring-[#7c3aed]/30 bg-[#7c3aed]/10" : "",
                      "hover:bg-skin-tile",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3 px-3 py-2">
                      <div className="shrink-0 flex items-center gap-3 pt-1">
                        <button
                          aria-label={
                            chosen ? "Désélectionner" : "Sélectionner"
                          }
                          onClick={() =>
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(m.id)) next.delete(m.id);
                              else next.add(m.id);
                              return next;
                            })
                          }
                          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                        >
                          {chosen ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4 text-skin-muted" />
                          )}
                        </button>

                        <button
                          onClick={
                            isBroadcast ? undefined : () => toggleStar(m.id)
                          }
                          disabled={isBroadcast}
                          className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 ${
                            isBroadcast ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                          aria-label={
                            m.starred
                              ? "Retirer des suivis"
                              : "Marquer comme suivi"
                          }
                          title={
                            isBroadcast
                              ? "Indisponible pour les envois"
                              : m.starred
                              ? "Retirer des suivis"
                              : "Marquer comme suivi"
                          }
                        >
                          {m.starred ? (
                            <Star className="w-4 h-4 text-amber-400" />
                          ) : (
                            <StarOff className="w-4 h-4 text-skin-muted" />
                          )}
                        </button>
                      </div>

                      <button
                        className="min-w-0 flex-1 text-start"
                        dir="auto"
                        onClick={() => openRead(m)}
                      >
                        <div
                          className={`truncate ${
                            unread ? "font-semibold" : "font-medium"
                          }`}
                        >
                          {m.fromName}
                          {mailboxBadge(m)}
                        </div>
                        <div className="text-sm truncate">
                          <span
                            className={unread ? "font-semibold" : "font-medium"}
                          >
                            {m.subject}
                          </span>
                          <span className="text-skin-muted">
                            {" "}
                            — {m.snippet}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-skin-muted tabular-nums">
                          {fmtDate(m.date)}
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <MailSearchDialog
        open={searchOpen}
        value={q}
        onChange={setQ}
        onClose={() => setSearchOpen(false)}
      />

      <MailerComposer
        open={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setSeed(null);
        }}
        onSend={async (payload) => {
          try {
            await postBroadcast(payload);
            notifySuccess(
              payload.sendAt
                ? `Message programmé pour le ${fmtDate(payload.sendAt)}.`
                : `Message envoyé.`
            );
            setComposerOpen(false);
            if (folder === "sent") refresh();
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Échec d’envoi.";
            notifyError(msg);
          }
        }}
        groupsOptions={[]}
        sendersOptions={composerSenders}
        defaultSenderId={composerDefaultSenderId}
        seed={seed || undefined}
      />
    </>
  );
}
