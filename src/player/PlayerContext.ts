// C:\Users\ADMIN\Desktop\fullmargin-site\src\player\PlayerContext.ts
import { createContext, useContext } from "react";
import type { Podcast } from "../pages/podcasts/types";

export type PlayerContextValue = {
  current: Podcast | null;
  isPlaying: boolean;
  queue: Podcast[];
  setQueue: (items: Podcast[]) => void;
  play: (p: Podcast) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  stop: () => void; // pause + garde la barre visible
  quit: () => void; // ferme totalement + mémorise “hidden”
  positionSec: number;
  durationSec: number;
  seek: (sec: number) => void;
};

export const PlayerContext = createContext<PlayerContextValue>(
  null as unknown as PlayerContextValue
);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within <PlayerProvider>");
  return ctx;
}
