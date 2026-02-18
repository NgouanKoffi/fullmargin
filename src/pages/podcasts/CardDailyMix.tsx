import { Play, Pause, ThumbsUp, ThumbsDown, Languages } from "lucide-react";
import { cx, fmtTime } from "./utils";
import type { Podcast } from "./types";
import { useEffect, useState } from "react";
import { playlist } from "./playlist";

type PWithLang = Podcast & { language?: "fr" | "en"; isNew?: boolean };

export default function CardDailyMix({
  index,
  podcast,
  onOpen,
  onPlay,
  onLike,
  onDislike,
  liked,
  disliked,
  isActive,
  isPlaying,
}: {
  index: number;
  podcast: PWithLang;
  onOpen: () => void;
  onPlay: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  liked?: boolean;
  disliked?: boolean;
  isActive?: boolean;
  isPlaying?: boolean;
}) {
  const [saved, setSaved] = useState<boolean>(
    playlist.has((podcast.id as string) ?? "")
  );

  useEffect(() => {
    setSaved(playlist.has((podcast.id as string) ?? ""));
  }, [podcast?.id]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.();
  };
  const handleDislike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDislike?.();
  };

  const isCurrentlyPlaying = !!isActive && !!isPlaying;

  return (
    <article className="group rounded-2xl overflow-hidden ring-1 ring-skin-border/20 bg-skin-surface hover:bg-skin-inset transition shadow-sm hover:shadow-xl">
      <div className="relative">
        <img
          src={podcast.cover}
          alt=""
          className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />

        {/* langue */}
        {podcast.language && (
          <span
            className={cx(
              "absolute top-2 left-2 text-[10px] font-bold rounded-md px-1.5 py-0.5 inline-flex items-center gap-1",
              podcast.language === "en"
                ? "bg-blue-600/90 text-white"
                : "bg-emerald-600/90 text-white"
            )}
          >
            <Languages className="h-3 w-3" />
            {podcast.language.toUpperCase()}
          </span>
        )}

        {/* badge nouveau */}
        {podcast.isNew && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md shadow-red-400/30">
            Nouveau
          </span>
        )}

        {/* badge playlist */}
        {saved && (
          <span className="absolute top-8 right-2 text-[10px] font-semibold bg-black/70 text-white px-2 py-0.5 rounded-md">
            Dans la playlist
          </span>
        )}

        {/* zone clickable principale : play / pause */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="absolute inset-0 z-10"
          aria-label={
            isCurrentlyPlaying ? "Mettre en pause" : "Lire le podcast"
          }
        />

        {/* bouton flottant play/pause */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className={cx(
            "absolute bottom-2 right-2 h-10 w-10 rounded-full bg-fm-primary text-skin-primary-foreground grid place-items-center opacity-0 group-hover:opacity-100 shadow-lg transition-transform duration-200 group-hover:translate-y-[-2px] z-20",
            isCurrentlyPlaying ? "opacity-100" : ""
          )}
          aria-label={isCurrentlyPlaying ? "Mettre en pause" : "Lire"}
        >
          {isCurrentlyPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>

        <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/70 text-white rounded-md px-1.5 py-0.5">
          {String(index).padStart(2, "0")}
        </span>
      </div>

      <div
        className="p-3 space-y-2 cursor-pointer"
        onClick={onOpen}
        role="button"
      >
        <h3 className="font-semibold leading-tight line-clamp-1 text-skin-base">
          {podcast.title}
        </h3>
        <p className="text-xs text-skin-muted line-clamp-1">{podcast.artist}</p>
        <p className="text-xs text-skin-muted/90 line-clamp-2">
          {podcast.description}
        </p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <IconBtn onClick={handleLike} active={liked} title="J'aime">
              <ThumbsUp className="h-4 w-4" />
              <span className="text-[11px] ml-1">
                {podcast.likesCount ?? 0}
              </span>
            </IconBtn>
            <IconBtn
              onClick={handleDislike}
              active={disliked}
              title="Je n'aime pas"
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="text-[11px] ml-1">
                {podcast.dislikesCount ?? 0}
              </span>
            </IconBtn>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full ring-1 ring-skin-border/30 text-skin-muted">
            {fmtTime(podcast.durationSec)} ·{" "}
            {Intl.NumberFormat().format(podcast.viewsCount ?? 0)} vues
          </span>
        </div>
      </div>
    </article>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  active?: boolean;
}) {
  const classes = cx(
    "px-2 py-1 rounded-lg transition inline-flex items-center",
    active ? "bg-fm-primary/15 text-fm-primary" : "hover:bg-skin-inset"
  );
  return (
    <button onClick={onClick} title={title} className={classes}>
      {children}
    </button>
  );
}
