// src/pages/admin/components/admin/users/UserModal.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import InfoRow from "./InfoRow";
import StatusPill from "./StatusPill";

/* ========= Constantes images ========= */
const DEFAULT_AVATAR =
  "https://fullmargin-cdn.b-cdn.net/WhatsApp%20Image%202025-12-02%20%C3%A0%2008.45.46_8b1f7d0a.jpg";

/* ========= Types ========= */
export type UserDetail = {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string;
    coverUrl: string;
    roles: string[];
    isActive: boolean;
    createdAt: string;
  };
  extra: {
    fullName?: string;
    phone?: string;
    country?: string;
    city?: string;
    bio?: string;
  } | null;
  presence: {
    status: "online" | "away" | "offline";
    lastPingAt?: string;
    lastOnlineAt?: string;
    totalOnlineMs?: number;
    sessionStartAt?: string;
  } | null;
  stats: {
    totalSessions: number;
    totalDurationSec: number;
    lastSeenAt: string | null;
  };
};
export type SessionItem = {
  _id: string;
  status: "online" | "offline";
  startedAt: string;
  lastSeenAt: string;
  endedAt?: string | null;
  durationSec: number;
  email: string;
  method: string;
  success: boolean;
  ipHash: string;
  ua: string;
};
export type AuditItem = {
  _id: string;
  type: string;
  ipHash: string;
  ua: string;
  meta: unknown; // ✅ plus de any
  createdAt: string;
};

/* ========= Utils ========= */
const nf = new Intl.NumberFormat("fr-FR");
const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("fr-FR") : "—";

function fmtDuration(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h === 0 && m === 0) return `${r} s`;
  if (h === 0) return `${m} min ${String(r).padStart(2, "0")} s`;
  return `${h} h ${String(m).padStart(2, "0")} min ${String(r).padStart(
    2,
    "0"
  )} s`;
}
function computeSessionSeconds(s: SessionItem) {
  if (s.durationSec && s.durationSec > 0) return s.durationSec;
  const start = new Date(s.startedAt).getTime();
  const last = new Date(s.lastSeenAt).getTime();
  const end = s.endedAt ? new Date(s.endedAt).getTime() : NaN;
  if (!Number.isNaN(end) && end >= start)
    return Math.round((end - start) / 1000);
  if (!Number.isNaN(last) && last >= start)
    return Math.round((last - start) / 1000);
  return 0;
}

/** stringify sûr pour meta (unknown) */
function prettyMeta(meta: unknown): string {
  try {
    if (meta === null || meta === undefined) return "—";
    if (typeof meta === "string") return meta;
    return JSON.stringify(meta, null, 2);
  } catch {
    return String(meta);
  }
}

/* ========= Props ========= */
type Props = {
  userId: string;
  onClose: () => void;
  fetchJSON: (url: string) => Promise<UserDetail>;
  fetchSessions: (
    url: string
  ) => Promise<{ sessions: SessionItem[]; nextCursor: string | null }>;
  fetchAudits: (
    url: string
  ) => Promise<{ audits: AuditItem[]; nextCursor: string | null }>;
};

export default function UserModal(props: Props) {
  // monte dans un portal -> body
  if (typeof document === "undefined") return null;
  return createPortal(<ModalInner {...props} />, document.body);
}

/* ========= Inner (réel contenu du modal) ========= */
function ModalInner({
  userId,
  onClose,
  fetchJSON,
  fetchSessions,
  fetchAudits,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<UserDetail | null>(null);

  const [sess, setSess] = useState<SessionItem[]>([]);
  const [sessCursor, setSessCursor] = useState<string | null>(null);
  const [sessHasMore, setSessHasMore] = useState(false);

  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [auditCursor, setAuditCursor] = useState<string | null>(null);
  const [auditHasMore, setAuditHasMore] = useState(false);

  // lock du scroll de la page derrière
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      setLoading(true);
      try {
        const [d, s, a] = await Promise.all([
          fetchJSON(`/api/admin/users/${userId}/details`),
          fetchSessions(`/api/admin/users/${userId}/sessions?limit=20`),
          fetchAudits(`/api/admin/users/${userId}/audit?limit=20`),
        ]);
        if (cancel) return;
        setDetail(d);
        setSess(s.sessions);
        setSessCursor(s.nextCursor);
        setSessHasMore(!!s.nextCursor);
        setAudits(a.audits);
        setAuditCursor(a.nextCursor);
        setAuditHasMore(!!a.nextCursor);
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    load();
    return () => {
      cancel = true;
    };
    // ✅ déps complètes pour react-hooks/exhaustive-deps
  }, [userId, fetchJSON, fetchSessions, fetchAudits]);

  const totalDurationFromSessions = sess.reduce(
    (sum, s) => sum + computeSessionSeconds(s),
    0
  );
  const totalDurSec =
    (detail?.stats.totalDurationSec ?? 0) > 0
      ? detail!.stats.totalDurationSec
      : totalDurationFromSessions;

  return (
    // z mega haut + inset-0 -> FULLSCREEN réel (plus d’espace en haut)
    <div className="fixed inset-0 z-[2147483647] m-0 p-0">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* contenu plein écran */}
      <div className="relative z-10 flex h-[100dvh] w-[100dvw] flex-col bg-white dark:bg-slate-900">
        {/* header sticky, collé en haut */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
          <button
            onClick={onClose}
            className="h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 text-sm"
          >
            Fermer
          </button>
          <h2 className="text-base sm:text-lg font-semibold">
            Fiche utilisateur
          </h2>
        </div>

        {/* body scrollable dans tout l’écran */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-6">
          {loading || !detail ? (
            <div className="h-40 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : (
            <>
              {/* Profil */}
              <section className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 sm:p-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <img
                    src={detail.user.avatarUrl || DEFAULT_AVATAR}
                    alt=""
                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-base sm:text-lg font-semibold truncate">
                      {detail.user.fullName}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 truncate">
                      {detail.user.email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StatusPill
                        status={detail.presence?.status || "offline"}
                        lastPingAt={detail.presence?.lastPingAt}
                      />
                      <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        Rôles: {detail.user.roles.join(", ")}
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-500">
                        Créé: {fmtDateTime(detail.user.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <InfoRow
                    label="Total sessions"
                    value={nf.format(detail.stats.totalSessions)}
                  />
                  <InfoRow
                    label="Temps cumulé"
                    value={fmtDuration(totalDurSec)}
                  />
                  <InfoRow
                    label="Dernière activité"
                    value={fmtDateTime(detail.stats.lastSeenAt)}
                  />
                </div>
              </section>

              {/* Connexions */}
              <section>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Historique de connexion
                </h3>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 sm:p-3 overflow-x-auto">
                  <table className="min-w-full text-xs sm:text-sm">
                    <thead className="text-left text-[11px] sm:text-xs text-slate-500">
                      <tr>
                        <th className="py-2 pr-3">Statut</th>
                        <th className="py-2 pr-3">Début</th>
                        <th className="py-2 pr-3">Dernier vu</th>
                        <th className="py-2 pr-3">Fin</th>
                        <th className="py-2 pr-3">Durée</th>
                        <th className="py-2 pr-3">Méthode</th>
                        <th className="py-2 pr-3">Succès</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sess.map((s) => {
                        const durSec = computeSessionSeconds(s);
                        return (
                          <tr
                            key={s._id}
                            className="border-t border-slate-100 dark:border-slate-800"
                          >
                            <td className="py-2 pr-3 capitalize">{s.status}</td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {fmtDateTime(s.startedAt)}
                            </td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {fmtDateTime(s.lastSeenAt)}
                            </td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {fmtDateTime(s.endedAt || null)}
                            </td>
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {fmtDuration(durSec)}
                            </td>
                            <td className="py-2 pr-3">{s.method || "—"}</td>
                            <td className="py-2 pr-3">
                              {s.success ? "✅" : "❌"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {sessHasMore && detail && (
                    <div className="mt-3">
                      <button
                        className="h-9 px-3 rounded border border-slate-300 dark:border-slate-700 text-sm"
                        onClick={async () => {
                          const r = await fetchSessions(
                            `/api/admin/users/${
                              detail.user.id
                            }/sessions?limit=20${
                              sessCursor
                                ? `&before=${encodeURIComponent(sessCursor)}`
                                : ""
                            }`
                          );
                          setSess((p) => [...p, ...r.sessions]);
                          setSessCursor(r.nextCursor);
                          setSessHasMore(!!r.nextCursor);
                        }}
                      >
                        Charger plus
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Audit */}
              <section className="max-w-full">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Historique des modifications
                </h3>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 sm:p-3 max-w-full">
                  <ul className="space-y-2 text-xs sm:text-sm">
                    {audits.map((a) => (
                      <li
                        key={a._id}
                        className="border-b border-slate-100 dark:border-slate-800 pb-2 max-w-full"
                      >
                        <p className="font-medium break-words">{a.type}</p>
                        <p className="text-[11px] sm:text-xs text-slate-500 break-all">
                          {fmtDateTime(a.createdAt)} · IP:&nbsp;
                          <code className="font-mono break-all">
                            {a.ipHash || "—"}
                          </code>
                        </p>
                        {a.meta !== undefined && a.meta !== null && (
                          <pre className="mt-1 text-[11px] sm:text-xs bg-slate-50 dark:bg-slate-800/60 p-2 rounded max-w-full overflow-x-auto whitespace-pre break-words">
                            {prettyMeta(a.meta)}
                          </pre>
                        )}
                      </li>
                    ))}
                  </ul>

                  {auditHasMore && detail && (
                    <div className="mt-3">
                      <button
                        className="h-9 px-3 rounded border border-slate-300 dark:border-slate-700 text-sm"
                        onClick={async () => {
                          const r = await fetchAudits(
                            `/api/admin/users/${detail.user.id}/audit?limit=20${
                              auditCursor
                                ? `&before=${encodeURIComponent(auditCursor)}`
                                : ""
                            }`
                          );
                          setAudits((p) => [...p, ...r.audits]);
                          setAuditCursor(r.nextCursor);
                          setAuditHasMore(!!r.nextCursor);
                        }}
                      >
                        Charger plus
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
