import { useMemo, useEffect } from "react";
import { usePlayer } from "@core/player/PlayerContext";
import type { Podcast } from "../types";
import type { PublicPodcast } from "../services/publicApi";
import { playlist } from "../utils/playlist";

export function usePodcastsPlayer(
  active: string,
  items: PublicPodcast[],
  playlistVersion: number,
  incrementViewOnce: (id: string) => Promise<void>
) {
  const player = usePlayer();

  // functions mapped with fallback implementations
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

  // Sync Queue automatically
  useEffect(() => {
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

  // TOGGLE PLAY / PAUSE logic
  function playPodcast(p: PublicPodcast) {
    const isSame =
      currentId !== null && String(p.id) === String(currentId ?? "");

    if (isSame && isPlaying) {
      const anyPlayer = player as any;
      if (typeof anyPlayer.pause === "function") {
        anyPlayer.pause();
        return;
      }
      if (typeof anyPlayer.togglePlay === "function") {
        anyPlayer.togglePlay();
        return;
      }
      if (typeof anyPlayer.toggle === "function") {
        anyPlayer.toggle();
        return;
      }
    }

    play(p as unknown as Podcast);
    void incrementViewOnce(p.id);
  }

  return {
    playPodcast,
    isPlaying,
    currentId,
  };
}
