// src/player/GlobalPlayerUI.tsx
import { useState } from "react";
import { usePlayer } from "./PlayerContext";
import type { Podcast } from "@features/podcasts/types";
import PlayerDock from "@features/podcasts/components/PlayerDock";
import MobilePlayerFab from "@features/podcasts/components/MobilePlayerFab";
import MobilePlayerDrawer from "@features/podcasts/components/MobilePlayerDrawer";

export default function GlobalPlayerUI() {
  const {
    current,
    isPlaying,
    toggle,
    next,
    prev,
    quit, // fermeture TOTALE
    positionSec,
    durationSec,
    seek,
  } = usePlayer();

  const [drawerOpen, setDrawerOpen] = useState(false);

  // Si aucun podcast n'est chargé en mémoire, le UI global ne se monte pas
  if (!current) return null;

  return (
    <>
      <PlayerDock
        current={current as Podcast}
        isPlaying={isPlaying}
        onToggle={toggle}
        onPrev={prev}
        onNext={next}
        onClose={quit}
        positionSec={positionSec}
        durationSec={durationSec}
        onSeek={(sec) => seek?.(sec)}
      />

      <MobilePlayerFab
        current={current as Podcast}
        isPlaying={isPlaying}
        onPress={() => setDrawerOpen(true)}
      />

      <MobilePlayerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        current={current as Podcast}
        isPlaying={isPlaying}
        onToggle={toggle}
        onPrev={prev}
        onNext={next}
        positionSec={positionSec}
        durationSec={durationSec}
        onSeek={(sec) => seek?.(sec)}
      />
    </>
  );
}
