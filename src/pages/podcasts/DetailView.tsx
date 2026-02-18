// src/pages/podcasts/DetailView.tsx
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Play,
  Clock,
  Headphones,
  Languages,
  CalendarDays,
  ListPlus,
  ListMinus,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { fmtTime } from "./utils";
import type { Podcast } from "./types";
import ShadowHtml from "./ShadowHtml";
import { playlist } from "./playlist";
import { reactPublicPodcast, savePublicPodcast } from "./publicApi";

/** Type enrichi : on transporte le HTML riche depuis l’API publique */
type ExtraPodcast = Podcast &
  Partial<{
    id: string | number;
    publishedAt: string;
    language: string;
    chapters: { title: string; startSec: number }[];
    audioUrl: string;
    authorUrl: string;
    season: number;
    episode: number;
    html: string;
    description: string;
  }>;

export default function DetailView({
  podcast,
  onBack,
  onPlay,
  notify,
}: {
  podcast: ExtraPodcast;
  onBack: () => void;
  onPlay: () => void;
  notify?: (opts: {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => void;
}) {
  const [saved, setSaved] = useState<boolean>(() =>
    podcast?.id != null ? playlist.has(String(podcast.id)) : false
  );

  // Compteurs et états locaux réactifs
  const [likesCount, setLikesCount] = useState<number>(podcast.likesCount ?? 0);
  const [dislikesCount, setDislikesCount] = useState<number>(
    podcast.dislikesCount ?? 0
  );
  const [viewsCount] = useState<number>(podcast.viewsCount ?? 0);
  const [likedLocal, setLikedLocal] = useState<boolean>(false);
  const [dislikedLocal, setDislikedLocal] = useState<boolean>(false);

  const {
    cover,
    title,
    artist,
    description,
    html,
    durationSec = 0,
    publishedAt,
    language,
    chapters = [],
    authorUrl,
    season,
    episode,
  } = podcast || {};

  const prettyDate = useMemo(() => {
    if (!publishedAt) return null;
    try {
      const d = new Date(publishedAt);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return null;
    }
  }, [publishedAt]);

  const chapterSegments = useMemo(() => {
    if (!durationSec || !chapters?.length) return [];
    const starts = chapters.map((c) =>
      Math.max(0, Math.min(durationSec, c.startSec))
    );
    const ends = [...starts.slice(1), durationSec];
    return chapters.map((c, i) => {
      const length = Math.max(0, ends[i] - starts[i]);
      const widthPct = Math.max(2, (length / durationSec) * 100);
      return { title: c.title, start: starts[i], widthPct };
    });
  }, [chapters, durationSec]);

  const Chip = ({ children }: { children: ReactNode }) => (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-skin-inset ring-1 ring-skin-border/30 text-skin-muted">
      {children}
    </span>
  );

  const togglePlaylist = async () => {
    // 1. on toggle la playlist (async)
    const now = await playlist.toggle(String(podcast.id)); // now: boolean
    setSaved(now);

    try {
      // 2. on envoie au backend
      await savePublicPodcast(String(podcast.id), now ? "set" : "unset");
    } catch {
      // 3. rollback local si l'appel échoue
      const back = await playlist.toggle(String(podcast.id));
      setSaved(back);
    }

    // 4. notif
    if (notify) {
      if (now) {
        notify({
          title: "Ajouté à votre playlist",
          actionLabel: "Retirer",
          onAction: () => void togglePlaylist(),
        });
      } else {
        notify({
          title: "Retiré de votre playlist",
          actionLabel: "Annuler",
          onAction: () => void togglePlaylist(),
        });
      }
    }
  };

  // Exclusivité like/dislike (un seul actif à la fois)
  const react = async (kind: "like" | "dislike") => {
    if (kind === "like") {
      const action = likedLocal ? "unset" : "set";
      try {
        const data = await reactPublicPodcast(
          String(podcast.id),
          "like",
          action
        );
        setLikesCount(data.likesCount);
        setDislikesCount(data.dislikesCount);
        setLikedLocal(!likedLocal);
        if (!likedLocal && dislikedLocal) setDislikedLocal(false);
      } catch (err) {
        void err;
      }
    } else {
      const action = dislikedLocal ? "unset" : "set";
      try {
        const data = await reactPublicPodcast(
          String(podcast.id),
          "dislike",
          action
        );
        setDislikesCount(data.dislikesCount);
        setLikesCount(data.likesCount);
        setDislikedLocal(!dislikedLocal);
        if (!dislikedLocal && likedLocal) setLikedLocal(false);
      } catch (err) {
        void err;
      }
    }
  };

  return (
    <section className="space-y-6 md:space-y-8">
      {/* Retour */}
      <div className="flex items-center">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg hover:bg-skin-inset transition-colors duration-100"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
      </div>

      {/* Bloc principal */}
      <div className="relative rounded-[28px] p-[2px] bg-gradient-to-br from-fm-primary/70 via-fuchsia-500/60 to-blue-500/60">
        <div className="relative overflow-hidden rounded-[26px] ring-1 ring-skin-border/20 bg-gradient-to-b from-skin-surface/80 to-skin-surface supports-[backdrop-filter]:backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <img
              src={cover}
              alt=""
              className="h-full w-full object-cover blur-3xl scale-110 opacity-30"
            />
            <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_80%_0%,rgba(255,255,255,.30),transparent_60%)]" />
          </div>

          <div className="p-5 sm:p-7 md:p-9">
            {/* Cover + CTA */}
            <div className="w-full max-w-[18rem] mx-auto">
              <img
                src={cover}
                alt={`Couverture du podcast ${title}`}
                className="h-56 w-56 sm:h-64 sm:w-64 rounded-2xl object-cover shadow-2xl ring-1 ring-black/5 mx-auto"
              />

              {/* CTA : Écouter / Playlist */}
              <div className="mt-4 grid grid-cols-2 gap-2 items-stretch">
                <button
                  onClick={onPlay}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 bg-fm-primary text-skin-primary-foreground font-semibold shadow-md hover:shadow-lg transition-colors duration-100 whitespace-nowrap"
                >
                  <Play className="w-5 h-5" />
                  Écouter
                </button>

                <button
                  type="button"
                  onClick={togglePlaylist}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 ring-1 transition-colors duration-100 whitespace-nowrap truncate ${
                    saved
                      ? "bg-red-600 text-white ring-red-600/30 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
                      : "bg-skin-inset ring-skin-border/30 text-skin-base hover:bg-skin-tile-strong"
                  }`}
                  aria-pressed={saved}
                  title={
                    saved ? "Retirer de la playlist" : "Ajouter à ma playlist"
                  }
                >
                  {saved ? (
                    <>
                      <ListMinus className="w-5 h-5" />
                      Retirer
                    </>
                  ) : (
                    <>
                      <ListPlus className="w-5 h-5" />+ playlist
                    </>
                  )}
                </button>
              </div>

              {/* ➜ Réactions déplacées en HAUT (sous les CTA) */}
              <div className="mt-2 grid grid-cols-2 gap-2 items-stretch">
                <button
                  onClick={() => react("like")}
                  aria-pressed={likedLocal}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 ring-1 transition-colors duration-100 ${
                    likedLocal
                      ? "bg-fm-primary/15 text-fm-primary ring-fm-primary/30"
                      : "bg-skin-inset ring-skin-border/30 text-skin-base hover:bg-skin-tile-strong"
                  }`}
                  title="J'aime"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span> ({likesCount})</span>
                </button>

                <button
                  onClick={() => react("dislike")}
                  aria-pressed={dislikedLocal}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 ring-1 transition-colors duration-100 ${
                    dislikedLocal
                      ? "bg-fm-primary/15 text-fm-primary ring-fm-primary/30"
                      : "bg-skin-inset ring-skin-border/30 text-skin-base hover:bg-skin-tile-strong"
                  }`}
                  title="Je n'aime pas"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span> ({dislikesCount})</span>
                </button>
              </div>
            </div>

            {/* Meta / Titre */}
            <div className="mt-6 md:mt-8 max-w-3xl mx-auto">
              <div className="flex flex-wrap items-center gap-2 justify-center">
                <Chip>Podcast public</Chip>
                {typeof season === "number" && typeof episode === "number" && (
                  <Chip>
                    S{season} · E{episode}
                  </Chip>
                )}
                {language && (
                  <Chip>
                    <Languages className="w-3.5 h-3.5" />
                    {language.toUpperCase()}
                  </Chip>
                )}
                {durationSec > 0 && (
                  <Chip>
                    <Clock className="w-3.5 h-3.5" />
                    {fmtTime(durationSec)}
                  </Chip>
                )}
                {prettyDate && (
                  <Chip>
                    <CalendarDays className="w-3.5 h-3.5" />
                    {prettyDate}
                  </Chip>
                )}
                <Chip>
                  <Headphones className="w-3.5 h-3.5" />
                  {Intl.NumberFormat().format(viewsCount)} vues
                </Chip>
                <Chip>
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {Intl.NumberFormat().format(likesCount)}
                </Chip>
                <Chip>
                  <ThumbsDown className="w-3.5 h-3.5" />
                  {Intl.NumberFormat().format(dislikesCount)}
                </Chip>
              </div>

              <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-[-0.02em] text-skin-base text-center">
                {title}
              </h1>

              {/* auteur */}
              {artist && (
                <div className="mt-1 text-center text-sm text-skin-muted">
                  {authorUrl ? (
                    <a
                      href={authorUrl}
                      className="hover:text-skin-base underline-offset-4 hover:underline"
                    >
                      {artist}
                    </a>
                  ) : (
                    <span>{artist}</span>
                  )}
                </div>
              )}

              {/* DESCRIPTION */}
              {(html || description) && (
                <div className="mt-5 text-skin-muted leading-relaxed">
                  {html ? (
                    <div className="w-full rounded-xl ring-1 ring-skin-border/20 p-0">
                      <ShadowHtml html={html} />
                    </div>
                  ) : (
                    <p className="max-w-[75ch] mx-auto whitespace-pre-line">
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* Chapitres */}
              {chapterSegments.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-semibold tracking-[-0.01em] text-skin-base/90 mb-2 text-center">
                    Chapitres
                  </div>

                  <div className="rounded-full h-3 bg-skin-inset ring-1 ring-skin-border/30 overflow-hidden max-w-3xl mx-auto">
                    <div className="flex h-full">
                      {chapterSegments.map((seg, i) => (
                        <button
                          key={i}
                          title={`${seg.title} — ${fmtTime(seg.start)}`}
                          onClick={onPlay}
                          style={{ width: `${seg.widthPct}%` }}
                          className="group h-full relative focus:outline-none"
                        >
                          <div className="h-full w-full transition-colors group-hover:bg-fm-primary/70 bg-fm-primary/50" />
                          {i > 0 && (
                            <span className="absolute left-0 top-0 h-full w-px bg-white/40 opacity-40" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className="mt-2 flex gap-2 overflow-x-auto pr-1 no-scrollbar justify-center"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {chapters.map((c, idx) => (
                      <span
                        key={`${c.title}-${idx}`}
                        className="shrink-0 rounded-full px-3 py-1.5 text-xs bg-skin-inset ring-1 ring-skin-border/30 text-skin-base"
                        title={`${fmtTime(c.startSec)} · ${c.title}`}
                      >
                        {fmtTime(c.startSec)} · {c.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
