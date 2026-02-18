// src/pages/communaute/private/community-details/tabs/Publications/SubscribersPostsList.tsx
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
import { CheckCircle2, Clock, Trash2 } from "lucide-react";
import { API_BASE } from "../../../../../../lib/api";

// ---------- petits utilitaires (mêmes patterns que MyPostsList) ----------
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

function normalizeItem(raw: unknown): MineItem | null {
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

function looksLikeHtml(str: string | null | undefined): boolean {
  if (!str) return false;
  return /<\/?[a-z][\s\S]*>/i.test(str);
}

function getAuthorLabel(raw: unknown): string | null {
  if (!isRecord(raw)) return null;
  const author = raw["author"];
  if (isRecord(author)) {
    const full =
      getStr(author, "fullName") ??
      getStr(author, "name") ??
      getStr(author, "username");
    if (full) return full;
  }
  return null;
}

// ------------------ composant principal ------------------
export function SubscribersPostsList({
  communityId,
  ownerId,
}: {
  communityId: string;
  ownerId: string;
}) {
  const [items, setItems] = useState<Array<
    MineItem & { authorName: string | null }
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const base = useMemo(() => API_BASE.replace(/\/+$/, ""), []);

  const load = useCallback(
    async (mode: "hard" | "silent" = "hard") => {
      if (mode === "hard") {
        setLoading(true);
        setErr(null);
      }

      const headers: HeadersInit = {
        Accept: "application/json",
        ...getAuthHeader(),
      };

      // ⚠️ on essaie plusieurs formes, comme dans ton MyPostsList
      const urls: string[] = [
        `${base}/communaute/posts?communityId=${encodeURIComponent(
          communityId
        )}&all=1&page=1&limit=200`,
        `${base}/communaute/posts?communityId=${encodeURIComponent(
          communityId
        )}&page=1&limit=200`,
        `${base}/communaute/posts?communityId=${encodeURIComponent(
          communityId
        )}`,
      ];

      const ctrl = new AbortController();
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = ctrl;

      try {
        const settled = await Promise.all(
          urls.map((u) =>
            fetch(u, {
              headers,
              cache: "no-store",
              signal: ctrl.signal,
            }).catch(() => null)
          )
        );

        const allRaw: unknown[] = [];
        for (const r of settled) {
          if (!r || !r.ok) continue;
          const j = await parseJsonSafe<unknown>(r);
          if (!j) continue;
          allRaw.push(...extractArrayFromResponse(j));
        }

        // si VRAIMENT rien ne marche
        if (allRaw.length === 0) {
          setErr("Impossible de charger les publications des abonnés.");
          setItems((prev) => prev ?? []);
          return;
        }

        const normalized = allRaw
          .map((x) => {
            const n = normalizeItem(x);
            if (!n) return null;
            const authorName = getAuthorLabel(x) ?? null;
            return { ...n, authorName };
          })
          // on garde seulement les posts dont l’auteur n’est pas le propriétaire
          .filter(
            (x): x is MineItem & { authorName: string | null } =>
              x !== null && x.authorId !== ownerId
          );

        // tri récents d'abord
        normalized.sort((a, b) => {
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

        setItems(normalized);
      } catch {
        setErr("Impossible de charger les publications des abonnés.");
        setItems((prev) => prev ?? []);
      } finally {
        if (mode === "hard") setLoading(false);
      }
    },
    [base, communityId, ownerId]
  );

  // init + events
  useEffect(() => {
    void load("hard");
    const onNew = () => void load("silent");
    const onUpdate = () => void load("silent");
    window.addEventListener(
      "fm:community:post:created",
      onNew as EventListener
    );
    window.addEventListener(
      "fm:community:post:updated",
      onUpdate as EventListener
    );
    return () => {
      window.removeEventListener(
        "fm:community:post:created",
        onNew as EventListener
      );
      window.removeEventListener(
        "fm:community:post:updated",
        onUpdate as EventListener
      );
      if (abortRef.current) abortRef.current.abort();
    };
  }, [load]);

  // moderation : supprimer
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
            text: "La publication de l’abonné a été supprimée.",
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

  // ---------- rendu ----------
  if (loading)
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white/5 p-6 text-slate-100">
        Chargement des publications d’abonnés…
      </div>
    );
  if (err)
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/5 p-6 text-rose-200">
        {err}
      </div>
    );
  if (!items || items.length === 0)
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white/5 p-6 text-slate-100">
        Aucun contenu publié par les abonnés pour le moment.
      </div>
    );

  return (
    <div className="space-y-4">
      {items.map((p) => {
        const published = isPublishedLike(p);
        const createdTxt = formatDT(p.createdAt);
        const publishedTxt = formatDT(p.publishedAt ?? null);
        const isBusy = busyId === p.id;

        return (
          <article
            key={p.id}
            className="rounded-2xl border border-slate-200/10 bg-slate-950/20 p-4 shadow-sm"
          >
            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {published ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Publié
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-100">
                      <Clock className="h-3 w-3" />
                      En attente / programmé
                    </span>
                  )}

                  <span className="whitespace-nowrap text-xs text-slate-400">
                    •{" "}
                    {publishedTxt
                      ? `Publié le ${publishedTxt}`
                      : `Créé le ${createdTxt}`}
                  </span>

                  {p.authorName ? (
                    <span className="text-xs text-slate-200">
                      • par {p.authorName}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                <button
                  onClick={() => void removePost(p)}
                  disabled={isBusy}
                  className={cx(
                    "inline-flex items-center gap-1 rounded-xl border border-rose-400/40 px-3 py-1.5 text-sm font-medium text-rose-100 hover:bg-rose-500/10 whitespace-nowrap",
                    isBusy && "cursor-not-allowed opacity-60"
                  )}
                  type="button"
                >
                  <Trash2 className="h-4 w-4" /> Supprimer
                </button>
              </div>
            </div>

            {p.content ? (
              looksLikeHtml(p.content) ? (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert [&_*]:text-slate-100 [&_p]:mb-2"
                  dangerouslySetInnerHTML={{ __html: p.content }}
                />
              ) : (
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-100">
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
  );
}
