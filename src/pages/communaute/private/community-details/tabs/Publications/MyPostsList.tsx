// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\tabs\Publications\MyPostsList.tsx
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Fragment,
} from "react";
import {
  parseJsonSafe,
  getAuthHeader,
  dispatchFM,
  isRecord,
  getStr,
  getOptionalStr,
  getNum,
  cx,
} from "./helpers";
import type { ApiOk, MineItem, MineItemMedia } from "./types";
import { CheckCircle2, Clock, Pencil, PlayCircle, Trash2 } from "lucide-react";
import { API_BASE } from "../../../../../../lib/api";

/** petit modal local */
function ConfirmModal(props: {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const {
    open,
    title = "Confirmation",
    message = "Voulez-vous confirmer ?",
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    onConfirm,
    onCancel,
  } = props;
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/10 dark:bg-slate-900 dark:ring-white/10">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {message}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl px-3 py-1.5 text-sm ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* utils locaux */
function detectMediaKind(x: unknown): "image" | "video" {
  if (!isRecord(x)) return "image";
  const asStr =
    getStr(x, "kind") ??
    getStr(x, "type") ??
    (() => {
      const mime = getStr(x, "mime");
      if (mime?.startsWith("image/")) return "image";
      if (mime?.startsWith("video/")) return "video";
      return null;
    })() ??
    null;

  if (asStr === "image" || asStr === "video") return asStr;

  const url = getStr(x, "url") ?? getStr(x, "src") ?? "";
  const clean = url.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  if (/\.(png|jpg|jpeg|webp|gif|avif|svg)$/.test(clean)) return "image";
  if (/\.(mp4|webm|ogg|mov|m4v)$/.test(clean)) return "video";
  return "image";
}

function normalizeMineItem(raw: unknown): MineItem | null {
  if (!isRecord(raw)) return null;

  const id = getStr(raw, "id") ?? getStr(raw, "_id");
  const communityId = getStr(raw, "communityId");
  const createdAt = getStr(raw, "createdAt") ?? new Date().toISOString() ?? "";
  if (!id || !communityId) return null;

  let authorId = getStr(raw, "authorId") ?? "";
  const authorRaw = raw["author"];
  if (!authorId && isRecord(authorRaw)) {
    authorId =
      getStr(authorRaw, "id") ??
      getStr(authorRaw, "_id") ??
      getStr(authorRaw, "userId") ??
      "";
  }
  if (!authorId) authorId = "";

  const mediaRaw = Array.isArray(raw["media"]) ? raw["media"] : [];
  const media: MineItemMedia[] = mediaRaw
    .map((m): MineItemMedia | null => {
      if (!isRecord(m)) return null;
      const url = getStr(m, "url") ?? getStr(m, "src");
      if (!url) return null;
      const kind = detectMediaKind(m);
      return {
        kind,
        type: kind,
        url,
        thumbnail: getStr(m, "thumbnail") ?? undefined,
        width: getNum(m, "width") ?? undefined,
        height: getNum(m, "height") ?? undefined,
        duration: getNum(m, "duration") ?? undefined,
        publicId: getStr(m, "publicId") ?? undefined,
      };
    })
    .filter((m): m is MineItemMedia => m !== null);

  const isPublishedVal = raw["isPublished"];
  const publishedAtRaw = raw["publishedAt"];
  const scheduledAtRaw = raw["scheduledAt"];

  return {
    id,
    communityId,
    authorId,
    content: getStr(raw, "content") ?? "",
    media,
    isPublished:
      typeof isPublishedVal === "boolean" ? isPublishedVal : undefined,
    publishedAt:
      typeof publishedAtRaw === "string"
        ? publishedAtRaw
        : publishedAtRaw
        ? String(publishedAtRaw)
        : null,
    scheduledAt:
      typeof scheduledAtRaw === "string"
        ? scheduledAtRaw
        : scheduledAtRaw
        ? String(scheduledAtRaw)
        : null,
    createdAt,
    updatedAt: getOptionalStr(raw, "updatedAt") ?? undefined,
  };
}

function extractArrayFromResponse(j: unknown): unknown[] {
  if (Array.isArray(j)) return j;
  if (!isRecord(j)) return [];
  const data = j["data"];
  if (Array.isArray(data)) return data;
  const items = j["items"];
  if (Array.isArray(items)) return items;
  if (isRecord(data) && Array.isArray(data["items"])) {
    return data["items"] as unknown[];
  }
  return [];
}

function isPublishedLike(p: MineItem): boolean {
  return typeof p.isPublished !== "boolean" ? true : !!p.isPublished;
}

function formatDT(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

function statusPill(p: MineItem) {
  const published = isPublishedLike(p);
  if (published) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" /> Publié
      </span>
    );
  }
  const txt = p.scheduledAt ? formatDT(p.scheduledAt) : null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
      <Clock className="h-3.5 w-3.5" />
      {txt ? `Programmé pour ${txt}` : "En attente de publication"}
    </span>
  );
}

// 👇 utilitaire pour savoir si le contenu est du HTML
function looksLikeHtml(str: string | null | undefined): boolean {
  if (!str) return false;
  return /<\/?[a-z][\s\S]*>/i.test(str);
}

export function MyPostsList({
  communityId,
  currentUserId,
  canSchedule,
}: {
  communityId: string;
  currentUserId: string;
  canSchedule: boolean;
}) {
  const [items, setItems] = useState<MineItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<MineItem | null>(null);
  const firstLoadRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const base = useMemo(() => API_BASE.replace(/\/+$/, ""), []);

  const reconcile = useCallback(
    (curr: MineItem[] | null, next: MineItem[]): MineItem[] => {
      if (!curr || curr.length === 0) return next;
      const byId = new Map<string, MineItem>(curr.map((x) => [x.id, x]));
      for (const it of next) {
        const prev = byId.get(it.id);
        byId.set(it.id, prev ? { ...prev, ...it } : it);
      }
      const merged = Array.from(byId.values());
      merged.sort((a, b) => {
        const da =
          (a.publishedAt && Date.parse(a.publishedAt)) ||
          (a.scheduledAt && Date.parse(a.scheduledAt)) ||
          Date.parse(a.createdAt);
        const db =
          (b.publishedAt && Date.parse(b.publishedAt)) ||
          (b.scheduledAt && Date.parse(b.scheduledAt)) ||
          Date.parse(b.createdAt);
        return db - da;
      });
      return merged;
    },
    []
  );

  const fetchPage = useCallback(async (): Promise<MineItem[]> => {
    const headers: HeadersInit = {
      Accept: "application/json",
      ...getAuthHeader(),
    };
    const urls: string[] = [
      `${base}/communaute/posts?communityId=${encodeURIComponent(
        communityId
      )}&authorId=${encodeURIComponent(currentUserId)}&all=1&page=1&limit=100`,
      `${base}/communaute/posts/mine?communityId=${encodeURIComponent(
        communityId
      )}&page=1&limit=100`,
      `${base}/communaute/posts?communityId=${encodeURIComponent(
        communityId
      )}&authorId=${encodeURIComponent(currentUserId)}&page=1&limit=100`,
    ];

    const ctrl = new AbortController();
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = ctrl;

    const settled = await Promise.all(
      urls.map((u) =>
        fetch(u, { headers, cache: "no-store", signal: ctrl.signal }).catch(
          () => null
        )
      )
    );

    const allRaw: unknown[] = [];
    for (const r of settled) {
      if (!r || !r.ok) continue;
      const j = await parseJsonSafe<unknown>(r);
      if (!j) continue;
      allRaw.push(...extractArrayFromResponse(j));
    }

    const normalized = allRaw
      .map((x) => normalizeMineItem(x))
      .filter((x): x is MineItem => x !== null)
      .filter((p) => String(p.authorId) === String(currentUserId));

    const byId = new Map<string, MineItem>();
    for (const it of normalized) byId.set(it.id, it);
    const list = Array.from(byId.values()).sort((a, b) => {
      const da =
        (a.publishedAt && Date.parse(a.publishedAt)) ||
        (a.scheduledAt && Date.parse(a.scheduledAt)) ||
        Date.parse(a.createdAt);
      const db =
        (b.publishedAt && Date.parse(b.publishedAt)) ||
        (b.scheduledAt && Date.parse(b.scheduledAt)) ||
        Date.parse(b.createdAt);
      return db - da;
    });
    return list;
  }, [base, communityId, currentUserId]);

  const load = useCallback(
    async (mode: "hard" | "silent" = "hard") => {
      if (mode === "hard" && firstLoadRef.current) {
        setLoading(true);
        setErr(null);
      }
      try {
        const list = await fetchPage();
        setItems((cur) => (mode === "silent" ? reconcile(cur, list) : list));
      } catch {
        setErr("Impossible de charger vos publications.");
        setItems((prev) => prev ?? []);
      } finally {
        if (firstLoadRef.current) {
          setLoading(false);
          firstLoadRef.current = false;
        }
      }
    },
    [fetchPage, reconcile]
  );

  // initial + events
  useEffect(() => {
    void load("hard");
    const onFocus = () => void load("silent");
    const onOnline = () => void load("silent");
    const onNew = () => void load("silent");
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    window.addEventListener(
      "fm:community:post:created",
      onNew as EventListener
    );
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      window.removeEventListener(
        "fm:community:post:created",
        onNew as EventListener
      );
      if (abortRef.current) abortRef.current.abort();
    };
  }, [load]);

  // refresh discret toutes les 30s
  useEffect(() => {
    let timer: number | null = null;
    const tick = () => {
      if (document.visibilityState === "visible") void load("silent");
      timer = window.setTimeout(tick, 30000);
    };
    timer = window.setTimeout(tick, 30000);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [load]);

  const publishNow = useCallback(
    async (post: MineItem) => {
      if (!canSchedule) return;
      setBusyId(post.id);
      try {
        const r = await fetch(`${base}/communaute/posts/${post.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({ scheduledAt: "" }),
        });
        const j = await parseJsonSafe<ApiOk<unknown>>(r);
        if (!r.ok || (j && j.ok === false)) {
          const msg =
            (j && (j.error || j.message)) ||
            `Échec publication (HTTP ${r.status})`;
          dispatchFM({
            name: "fm:toast",
            detail: {
              type: "error",
              title: "Action échouée",
              text: msg,
              autoClose: 2500,
            },
          });
          return;
        }
        dispatchFM({
          name: "fm:toast",
          detail: {
            type: "success",
            title: "Publié",
            text: "La publication est maintenant en ligne.",
            autoClose: 2000,
          },
        });
        setItems((cur) =>
          (cur ?? []).map((it) =>
            it.id === post.id
              ? {
                  ...it,
                  isPublished: true,
                  publishedAt: new Date().toISOString(),
                  scheduledAt: null,
                }
              : it
          )
        );
      } catch {
        dispatchFM({
          name: "fm:toast",
          detail: {
            type: "error",
            title: "Erreur réseau",
            text: "Action impossible pour le moment.",
            autoClose: 2500,
          },
        });
      } finally {
        setBusyId(null);
      }
    },
    [base, canSchedule]
  );

  const removePost = useCallback(
    async (post: MineItem) => {
      setBusyId(post.id);
      try {
        const r = await fetch(`${base}/communaute/posts/${post.id}`, {
          method: "DELETE",
          headers: { Accept: "application/json", ...getAuthHeader() },
        });
        const j = await parseJsonSafe<ApiOk<unknown>>(r);
        if (!r.ok || (j && j.ok === false)) {
          const msg =
            (j && (j.error || j.message)) ||
            `Échec suppression (HTTP ${r.status})`;
          dispatchFM({
            name: "fm:toast",
            detail: {
              type: "error",
              title: "Suppression échouée",
              text: msg,
              autoClose: 2500,
            },
          });
          return;
        }
        setItems((cur) => (cur ?? []).filter((x) => x.id !== post.id));
        dispatchFM({
          name: "fm:toast",
          detail: {
            type: "success",
            title: "Supprimé",
            text: "La publication a été supprimée.",
            autoClose: 1800,
          },
        });
      } catch {
        dispatchFM({
          name: "fm:toast",
          detail: {
            type: "error",
            title: "Erreur réseau",
            text: "Suppression impossible pour le moment.",
            autoClose: 2500,
          },
        });
      } finally {
        setBusyId(null);
      }
    },
    [base]
  );

  if (loading)
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
        Chargement de vos publications…
      </div>
    );
  if (err)
    return (
      <div className="rounded-2xl border border-rose-200/70 bg-rose-50 p-6 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
        {err}
      </div>
    );
  if (!items || items.length === 0)
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
        Aucune publication pour le moment.
      </div>
    );

  return (
    <>
      <div className="space-y-4">
        {items.map((p) => {
          const published = isPublishedLike(p);
          const canShowPublishNow = !published && canSchedule;
          const isBusy = busyId === p.id;
          const createdTxt = formatDT(p.createdAt);
          const publishedTxt = formatDT(p.publishedAt ?? null);

          return (
            <article
              key={p.id}
              className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60"
            >
              <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {statusPill(p)}
                    {publishedTxt ? (
                      <span className="whitespace-nowrap text-xs text-slate-400">
                        • Publié le {publishedTxt}
                      </span>
                    ) : (
                      <span className="whitespace-nowrap text-xs text-slate-400">
                        • Créé le {createdTxt}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                  <button
                    onClick={() =>
                      dispatchFM({
                        name: "fm:community:post:edit",
                        detail: {
                          id: p.id,
                          content: p.content,
                          media: p.media.map((m) => ({
                            type: m.type,
                            url: m.url,
                            thumbnail: m.thumbnail || "",
                            publicId: m.publicId || "",
                          })),
                        },
                      })
                    }
                    disabled={isBusy}
                    className={cx(
                      "inline-flex items-center gap-1 rounded-xl border border-slate-200/70 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60 whitespace-nowrap",
                      isBusy && "cursor-not-allowed opacity-60"
                    )}
                    title="Modifier"
                    type="button"
                  >
                    <Pencil className="h-4 w-4" /> Modifier
                  </button>

                  {canShowPublishNow ? (
                    <button
                      onClick={() => void publishNow(p)}
                      disabled={isBusy}
                      className={cx(
                        "inline-flex items-center gap-1 rounded-xl border border-emerald-200/70 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-950/30 whitespace-nowrap",
                        isBusy && "cursor-not-allowed opacity-60"
                      )}
                      title="Publier maintenant"
                      type="button"
                    >
                      <PlayCircle className="h-4 w-4" /> Publier maintenant
                    </button>
                  ) : null}

                  <button
                    onClick={() => setToDelete(p)}
                    disabled={isBusy}
                    className={cx(
                      "inline-flex items-center gap-1 rounded-xl border border-rose-200/70 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-300 dark:hover:bg-rose-950/30 whitespace-nowrap",
                      isBusy && "cursor-not-allowed opacity-60"
                    )}
                    title="Supprimer"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" /> Supprimer
                  </button>
                </div>
              </div>

              {/* contenu : on affiche HTML si c'est du HTML */}
              {p.content ? (
                looksLikeHtml(p.content) ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert [&_*]:text-slate-800 dark:[&_*]:text-slate-100 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{ __html: p.content }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700 dark:text-slate-200">
                    {p.content}
                  </p>
                )
              ) : null}

              {p.media.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {p.media.slice(0, 6).map((m, i) => (
                    <Fragment key={p.id + "-media-" + i}>
                      {m.kind === "image" ? (
                        <img
                          src={m.url}
                          alt={`media-${i}`}
                          className="h-40 w-full rounded-xl object-cover sm:h-44 md:h-48"
                          loading="lazy"
                        />
                      ) : (
                        <video
                          src={m.url}
                          className="h-40 w-full rounded-xl sm:h-44 md:h-48"
                          controls
                        />
                      )}
                    </Fragment>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <ConfirmModal
        open={!!toDelete}
        title="Supprimer la publication ?"
        message="Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          const p = toDelete;
          if (!p) return;
          setToDelete(null);
          void removePost(p);
        }}
      />
    </>
  );
}
