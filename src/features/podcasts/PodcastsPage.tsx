// src/features/podcasts/PodcastsPage.tsx
import { ToastProvider, useToast } from "./components/Toast";
import type { Podcast } from "./types";
import { CATEGORIES, CATEGORY_META, PRIMARY } from "./utils/data";

import GlobalStyles from "./components/GlobalStyles";
import LeftSidebar from "./components/LeftSidebar";
import DetailView from "./components/DetailView";
import SectionMix from "./components/SectionMix";
import CardDailyMix from "./components/CardDailyMix";

import { usePodcastsFilter } from "./hooks/usePodcastsFilter";
import { usePodcastsData } from "./hooks/usePodcastsData";
import { usePodcastsPlayer } from "./hooks/usePodcastsPlayer";

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

  const {
    query, setQuery,
    active, setActive,
    language, setLanguage,
    showOnlyNew, setShowOnlyNew,
  } = usePodcastsFilter();

  const {
    items,
    detail, setDetail,
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
  } = usePodcastsData(language, active, query, showOnlyNew, notify);

  const { playPodcast, isPlaying, currentId } = usePodcastsPlayer(
    active,
    items,
    playlistVersion,
    incrementViewOnce
  );

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
                        Votre playlist est vide. Ouvrez un podcast et cliquez sur
                        “Ajouter à ma playlist”.
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
                        onLike={() => void toggleLike(p.id)}
                        onDislike={() => void toggleDislike(p.id)}
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
