import { useMemo, useState, useEffect } from "react";
import type { Podcast } from "./podcasts/types";
import {
  listPublicPodcasts,
  type PublicPodcast,
  reactPublicPodcast,
  viewPublicPodcast,
  getPublicPodcast,
  getPublicPodcastNewCounts,
} from "./podcasts/publicApi";
import { CATEGORIES, CATEGORY_META, PRIMARY } from "./podcasts/data";
import GlobalStyles from "./podcasts/GlobalStyles";
import LeftSidebar from "./podcasts/LeftSidebar";
import DetailView from "./podcasts/DetailView";
import SectionMix from "./podcasts/SectionMix";
import CardDailyMix from "./podcasts/CardDailyMix";
import { playlist } from "./podcasts/playlist";
import { ToastProvider, useToast } from "./podcasts/Toast";
import { usePlayer } from "../player/PlayerContext";

function stripHtml(html: string): string {
  try {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return (tmp.textContent || tmp.innerText || "").trim();
  } catch {
    return "";
  }
}
function normalizeForPlayer(p: PublicPodcast): PublicPodcast {
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

function getUrlPodcastId(): string | null {
  try {
    const u = new URL(window.location.href);
    const id = u.searchParams.get("podcast");
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
}
function setUrlPodcastId(id: string | null) {
  try {
    const u = new URL(window.location.href);
    if (!id) u.searchParams.delete("podcast");
    else u.searchParams.set("podcast", id);
    window.history.replaceState({}, "", u.toString());
  } catch {
    /* ignore */
  }
}
type LangFilter = "all" | "fr" | "en";
function getUrlLang(): LangFilter {
  try {
    const u = new URL(window.location.href);
    const v = (u.searchParams.get("lang") || "").toLowerCase();
    return v === "fr" || v === "en" ? (v as LangFilter) : "all";
  } catch {
    return "all";
  }
}
function setUrlLang(lang: LangFilter) {
  try {
    const u = new URL(window.location.href);
    if (lang === "all") u.searchParams.delete("lang");
    else u.searchParams.set("lang", lang);
    window.history.replaceState({}, "", u.toString());
  } catch {
    /* ignore */
  }
}

function PodcastsInner() {
  const { push } = useToast();
  const notify = (opts: {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
  }) =>
    push({
      title: opts.title,
      actionLabel: opts.actionLabel,
      onAction: opts.onAction,
      durationMs: 2500,
    });

  const player = usePlayer();

  // fonctions venant du PlayerContext (avec fallback si non définies)
  const play = useMemo(
    () =>
      (player as unknown as { play?: (p: Podcast) => void }).play ??
      (() => undefined),
    [player]
  );

  const setQueueFn = useMemo(
    () =>
      (player as unknown as { setQueue?: (items: Podcast[]) => void })
        .setQueue ?? (() => undefined),
    [player]
  );

  const currentPodcast =
    (player as unknown as { current?: Podcast | null }).current ?? null;
  const isPlaying =
    (player as unknown as { isPlaying?: boolean }).isPlaying ?? false;

  const currentId =
    (currentPodcast && (currentPodcast as any).id
      ? String((currentPodcast as any).id)
      : null) ?? null;

  const defaultCategory = (CATEGORIES[0] && CATEGORIES[0].label) || "Playlist";

  const [query, setQuery] = useState<string>("");
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [dislikes, setDislikes] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<string>(defaultCategory);
  const [detail, setDetail] = useState<PublicPodcast | null>(null);

  const [language, setLanguage] = useState<LangFilter>(() => getUrlLang());
  useEffect(() => {
    setUrlLang(language);
  }, [language]);

  const [items, setItems] = useState<PublicPodcast[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {}
  );

  const [showOnlyNew, setShowOnlyNew] = useState<boolean>(false);

  // 👉 on garde une petite version de la playlist pour déclencher le render
  const [playlistVersion, setPlaylistVersion] = useState(0);
  useEffect(() => {
    // on s'abonne au store playlist pour savoir quand ça change
    const unsub = playlist.subscribe(() => {
      // on force un petit tick
      setPlaylistVersion((v) => v + 1);
    });
    return () => {
      unsub?.();
    };
  }, []);

  const playlistCount =
    typeof (playlist as unknown as { size?: number }).size === "number"
      ? (playlist as unknown as { size: number }).size
      : // si pas de .size(), on prend la liste
        playlist.list().length;

  // charger les compteurs par catégorie
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

  // charger les podcasts de la catégorie active
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

  // 👉 ICI on pousse dans le player la BONNE liste
  useEffect(() => {
    // si on est sur la playlist, on ne prend que ce qui est vraiment dans la playlist
    let list: PublicPodcast[] = [];
    if (active === "Playlist") {
      list = items.filter((p) => playlist.has(String(p.id)));
    } else {
      list = items;
    }
    if (list.length) {
      setQueueFn(list as unknown as Podcast[]);
    }
  }, [active, items, playlistVersion, setQueueFn]);

  // synchronisation URL ↔ détail
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

  // liste de base (ce qu’on affiche)
  const baseList: PublicPodcast[] = useMemo(() => {
    if (active === "Playlist")
      return items.filter((p) => playlist.has(String(p.id)));
    return items;
  }, [active, items, playlistVersion]);

  // filtre "nouveaux"
  const listAfterNewFilter: PublicPodcast[] = useMemo(() => {
    if (!showOnlyNew) return baseList;
    return baseList.filter((p) => p.isNew);
  }, [baseList, showOnlyNew]);

  // recherche locale
  const filtered: PublicPodcast[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listAfterNewFilter;
    return listAfterNewFilter.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.artist || "").toLowerCase().includes(q)
    );
  }, [listAfterNewFilter, query]);

  // vue -> MAJ backend + MAJ frontend + décrément compteur (une seule fois)
  async function incrementViewOnce(id: string) {
    // est-ce que ce podcast est encore marqué "Nouveau" côté front ?
    const wasNew =
      items.some((x) => x.id === id && x.isNew) ||
      (detail && detail.id === id && detail.isNew);

    // si ce n’était déjà plus "Nouveau", on ne touche pas aux compteurs
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

      // maj dans la liste
      setItems((arr) =>
        arr.map((x) =>
          x.id === id
            ? {
                ...x,
                viewsCount: nextViews,
                isNew: false,
              }
            : x
        )
      );
      // maj dans le détail
      setDetail((p) =>
        p && p.id === id
          ? {
              ...p,
              viewsCount: nextViews,
              isNew: false,
            }
          : p
      );

      // décrémenter le badge de la catégorie en cours UNE SEULE FOIS
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

  // ⚡️ TOGGLE PLAY / PAUSE SUR LE MÊME PODCAST
  function playPodcast(p: PublicPodcast) {
    const isSame =
      currentId !== null && String(p.id) === String(currentId ?? "");

    if (isSame && isPlaying) {
      const anyPlayer = player as any;

      // 1) si le player expose pause()
      if (typeof anyPlayer.pause === "function") {
        anyPlayer.pause();
        return;
      }

      // 2) sinon, si le player expose togglePlay() / toggle()
      if (typeof anyPlayer.togglePlay === "function") {
        anyPlayer.togglePlay();
        return;
      }
      if (typeof anyPlayer.toggle === "function") {
        anyPlayer.toggle();
        return;
      }

      // 3) sinon on retombe sur le comportement d’avant (rejouer)
      // (au moins on ne casse rien)
    }

    // lecture “normale”
    play(p as unknown as Podcast);
    void incrementViewOnce(p.id);
  }

  async function toggleLike(id: string) {
    const isLiked = !!likes[id];
    try {
      const data = await reactPublicPodcast(
        id,
        "like",
        isLiked ? "unset" : "set"
      );
      setItems((arr) =>
        arr.map((x) =>
          x.id === id
            ? {
                ...x,
                likesCount: data.likesCount,
                dislikesCount: data.dislikesCount,
              }
            : x
        )
      );
      setDetail((p) =>
        p && p.id === id
          ? {
              ...p,
              likesCount: data.likesCount,
              dislikesCount: data.dislikesCount,
            }
          : p
      );
      setLikes((prev) => ({ ...prev, [id]: !isLiked }));
      if (!isLiked && dislikes[id]) setDislikes((d) => ({ ...d, [id]: false }));
      push({
        title: isLiked ? "Like retiré" : "Ajouté aux likes",
        actionLabel: "Annuler",
        onAction: () => toggleLike(id),
        durationMs: 2500,
      });
    } catch {
      /* ignore */
    }
  }

  async function toggleDislike(id: string) {
    const isDisliked = !!dislikes[id];
    try {
      const data = await reactPublicPodcast(
        id,
        "dislike",
        isDisliked ? "unset" : "set"
      );
      setItems((arr) =>
        arr.map((x) =>
          x.id === id
            ? {
                ...x,
                dislikesCount: data.dislikesCount,
                likesCount: data.likesCount,
              }
            : x
        )
      );
      setDetail((p) =>
        p && p.id === id
          ? {
              ...p,
              dislikesCount: data.dislikesCount,
              likesCount: data.likesCount,
            }
          : p
      );
      setDislikes((prev) => ({ ...prev, [id]: !isDisliked }));
      if (!isDisliked && likes[id]) setLikes((l) => ({ ...l, [id]: false }));
      push({
        title: isDisliked ? "Dislike retiré" : "Ajouté aux dislikes",
        actionLabel: "Annuler",
        onAction: () => toggleDislike(id),
        durationMs: 2500,
      });
    } catch {
      /* ignore */
    }
  }

  const meta = CATEGORY_META[active] ?? { desc: "" };

  return (
    <main
      id="podcasts-root"
      className="overflow-x-hidden bg-skin-surface text-skin-base min-h-screen"
    >
      <GlobalStyles />

      <section className="w-full pb-28 md:pb-24">
        <div className="mx-auto w-full max-w-[1200px] xl:max-w-[1500px] 2xl:max-w-[1800px] px-4 sm:px-6 lg:px-8 pb-12 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[17rem,minmax(0,1fr)] gap-6">
            <div className="space-y-4">
              <LeftSidebar
                active={active}
                onSelect={(label: string) => {
                  setActive(label);
                  setDetail(null);
                  setUrlPodcastId(null);
                  setShowOnlyNew(false);
                }}
                primary={PRIMARY}
                categories={CATEGORIES}
                categoryCounts={categoryCounts}
                playlistCount={playlistCount}
              />
            </div>

            <div className="space-y-6">
              {loading && (
                <div className="text-sm text-skin-muted">
                  Chargement des podcasts…
                </div>
              )}
              {err && !loading && (
                <div className="text-sm text-red-600">{err}</div>
              )}

              {detail ? (
                <DetailView
                  podcast={detail as Podcast}
                  onBack={closeDetail}
                  onPlay={() => playPodcast(detail)}
                  notify={notify}
                />
              ) : (
                <SectionMix
                  title={active}
                  subtitle={meta.desc}
                  query={query}
                  setQuery={setQuery}
                  language={language}
                  setLanguage={setLanguage}
                  showOnlyNew={showOnlyNew}
                  setShowOnlyNew={
                    active === "Playlist" ? undefined : setShowOnlyNew
                  }
                >
                  {active === "Playlist" &&
                    !loading &&
                    filtered.length === 0 && (
                      <div className="text-sm text-skin-muted">
                        Votre playlist est vide. Ouvrez un podcast et cliquez
                        sur “Ajouter à ma playlist”.
                      </div>
                    )}
                  {active !== "Playlist" &&
                    !loading &&
                    filtered.length === 0 && (
                      <div className="text-sm text-skin-muted">
                        Aucun résultat dans “{active}”.
                      </div>
                    )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                    {filtered.map((p, i) => (
                      <CardDailyMix
                        key={p.id}
                        index={i + 1}
                        podcast={p as Podcast}
                        onOpen={() => openDetail(p)}
                        onPlay={() => playPodcast(p)}
                        onLike={() => toggleLike(p.id)}
                        onDislike={() => toggleDislike(p.id)}
                        liked={likes[p.id] ?? false}
                        disliked={dislikes[p.id] ?? false}
                        isActive={
                          currentId !== null &&
                          String(p.id) === String(currentId ?? "")
                        }
                        isPlaying={isPlaying}
                      />
                    ))}
                  </div>
                </SectionMix>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function PodcastsPage() {
  return (
    <ToastProvider>
      <PodcastsInner />
    </ToastProvider>
  );
}
