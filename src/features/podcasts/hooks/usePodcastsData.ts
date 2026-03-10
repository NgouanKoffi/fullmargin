import { useState, useEffect, useMemo } from "react";
import { getUrlPodcastId, setUrlPodcastId } from "./usePodcastsFilter";
import type { LangFilter } from "./usePodcastsFilter";
import { getPublicPodcast, getPublicPodcastNewCounts, listPublicPodcasts, reactPublicPodcast, viewPublicPodcast, type PublicPodcast } from "../services/publicApi";
import { playlist } from "../utils/playlist";
import { CATEGORIES } from "../utils/data";

export function stripHtml(html: string): string {
  try {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return (tmp.textContent || tmp.innerText || "").trim();
  } catch {
    return "";
  }
}

export function normalizeForPlayer(p: PublicPodcast): PublicPodcast {
  const audio = p.streamUrl ? p.streamUrl : p.audioUrl;
  return {
    ...p,
    audioUrl: audio,
    description:
      (p.description && String(p.description)) ||
      (p as unknown as { html?: string })?.html
        ? stripHtml(String((p as unknown as { html?: string }).html))
        : "",
  };
}

export function usePodcastsData(
  language: LangFilter,
  active: string,
  query: string,
  showOnlyNew: boolean,
  notify: (opts: { title: string; actionLabel?: string; onAction?: () => void }) => void
) {
  const [items, setItems] = useState<PublicPodcast[]>([]);
  const [detail, setDetail] = useState<PublicPodcast | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [dislikes, setDislikes] = useState<Record<string, boolean>>({});

  // Playlist synchronization
  const [playlistVersion, setPlaylistVersion] = useState(0);
  useEffect(() => {
    const unsub = playlist.subscribe(() => setPlaylistVersion((v) => v + 1));
    return () => unsub?.();
  }, []);

  const playlistCount =
    typeof (playlist as unknown as { size?: number }).size === "number"
      ? (playlist as unknown as { size: number }).size
      : playlist.list().length;

  // Load category counts
  useEffect(() => {
    const cats = CATEGORIES.map((c) => c.label);
    (async () => {
      try {
        const counts = await getPublicPodcastNewCounts({
          categories: cats,
          language: language === "all" ? undefined : language,
        });
        setCategoryCounts(counts);
      } catch {
        setCategoryCounts({});
      }
    })();
  }, [language]);

  // Load items for active category
  useEffect(() => {
    let abort = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const params: {
          language?: "fr" | "en";
          category?: string;
          limit?: number;
        } = { limit: 200 };

        if (language === "fr" || language === "en") params.language = language;
        if (active !== "Playlist") params.category = active;

        const { items } = await listPublicPodcasts(params);
        if (!abort) setItems(items.map(normalizeForPlayer));
      } catch (e) {
        if (!abort) {
          setItems([]);
          setErr(e instanceof Error ? e.message : "Erreur de chargement");
        }
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [language, active]);

  // Sync URL with detailed podcast view (open/close)
  useEffect(() => {
    let ignore = false;
    async function openFromUrl() {
      const id = getUrlPodcastId();
      if (!id) return;
      if (detail?.id === id) return;
      const found = items.find((x) => String(x.id) === id);
      if (found) {
        if (!ignore) setDetail(found);
        return;
      }
      try {
        const p = await getPublicPodcast(id);
        if (!ignore) setDetail(normalizeForPlayer(p));
      } catch {
        if (!ignore) setUrlPodcastId(null);
      }
    }
    openFromUrl();

    const onPop = () => {
      const id = getUrlPodcastId();
      if (!id) {
        setDetail(null);
        return;
      }
      const found = items.find((x) => String(x.id) === id);
      if (found) setDetail(found);
      else {
        getPublicPodcast(id)
          .then((p) => setDetail(normalizeForPlayer(p)))
          .catch(() => setDetail(null));
      }
    };
    window.addEventListener("popstate", onPop);

    return () => {
      ignore = true;
      window.removeEventListener("popstate", onPop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  function openDetail(p: PublicPodcast) {
    setDetail(p);
    setUrlPodcastId(String(p.id));
  }
  function closeDetail() {
    setDetail(null);
    setUrlPodcastId(null);
  }

  // Frontend list formatting (Base -> New filter -> Search filter)
  const baseList: PublicPodcast[] = useMemo(() => {
    if (active === "Playlist") return items.filter((p) => playlist.has(String(p.id)));
    return items;
  }, [active, items, playlistVersion]);

  const listAfterNewFilter: PublicPodcast[] = useMemo(() => {
    if (!showOnlyNew) return baseList;
    return baseList.filter((p) => p.isNew);
  }, [baseList, showOnlyNew]);

  const filtered: PublicPodcast[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listAfterNewFilter;
    return listAfterNewFilter.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.artist || "").toLowerCase().includes(q)
    );
  }, [listAfterNewFilter, query]);

  // Increment views
  async function incrementViewOnce(id: string) {
    const wasNew =
      items.some((x) => x.id === id && x.isNew) ||
      (detail && detail.id === id && detail.isNew);

    if (!wasNew) {
      try {
        await viewPublicPodcast(id);
      } catch {
        /* ignore */
      }
      return;
    }

    try {
      const nextViews = await viewPublicPodcast(id);

      setItems((arr) =>
        arr.map((x) =>
          x.id === id
            ? { ...x, viewsCount: nextViews, isNew: false }
            : x
        )
      );
      setDetail((p) =>
        p && p.id === id
          ? { ...p, viewsCount: nextViews, isNew: false }
          : p
      );

      // Decrement badge only once
      if (active !== "Playlist") {
        setCategoryCounts((prev) => {
          const cur = prev[active] ?? 0;
          return { ...prev, [active]: cur > 0 ? cur - 1 : 0 };
        });
      }
    } catch {
      /* ignore */
    }
  }

  // Reactions
  async function toggleLike(id: string) {
    const isLiked = !!likes[id];
    try {
      const data = await reactPublicPodcast(id, "like", isLiked ? "unset" : "set");
      setItems((arr) =>
        arr.map((x) =>
          x.id === id
            ? { ...x, likesCount: data.likesCount, dislikesCount: data.dislikesCount }
            : x
        )
      );
      setDetail((p) =>
        p && p.id === id
          ? { ...p, likesCount: data.likesCount, dislikesCount: data.dislikesCount }
          : p
      );
      setLikes((prev) => ({ ...prev, [id]: !isLiked }));
      if (!isLiked && dislikes[id]) setDislikes((d) => ({ ...d, [id]: false }));
      
      notify({
        title: isLiked ? "Like retiré" : "Ajouté aux likes",
        actionLabel: "Annuler",
        onAction: () => void toggleLike(id),
      });
    } catch {
      /* ignore */
    }
  }

  async function toggleDislike(id: string) {
    const isDisliked = !!dislikes[id];
    try {
      const data = await reactPublicPodcast(id, "dislike", isDisliked ? "unset" : "set");
      setItems((arr) =>
        arr.map((x) =>
          x.id === id
            ? { ...x, dislikesCount: data.dislikesCount, likesCount: data.likesCount }
            : x
        )
      );
      setDetail((p) =>
        p && p.id === id
          ? { ...p, dislikesCount: data.dislikesCount, likesCount: data.likesCount }
          : p
      );
      setDislikes((prev) => ({ ...prev, [id]: !isDisliked }));
      if (!isDisliked && likes[id]) setLikes((l) => ({ ...l, [id]: false }));

      notify({
        title: isDisliked ? "Dislike retiré" : "Ajouté aux dislikes",
        actionLabel: "Annuler",
        onAction: () => void toggleDislike(id),
      });
    } catch {
      /* ignore */
    }
  }

  return {
    items,
    detail,
    setDetail,
    loading,
    err,
    categoryCounts,
    likes,
    dislikes,
    playlistCount,
    playlistVersion,
    filtered,
    openDetail,
    closeDetail,
    incrementViewOnce,
    toggleLike,
    toggleDislike,
  };
}
