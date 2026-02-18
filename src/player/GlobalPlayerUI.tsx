// C:\Users\ADMIN\Desktop\fullmargin-site\src\player\GlobalPlayerUI.tsx
import { useState } from "react";
import { usePlayer } from "./PlayerContext";
import type { Podcast } from "../pages/podcasts/types";
import PlayerDock from "../pages/podcasts/PlayerDock";
import MobilePlayerFab from "../pages/podcasts/MobilePlayerFab";
import MobilePlayerDrawer from "../pages/podcasts/MobilePlayerDrawer";

export default function GlobalPlayerUI() {
  const {
    current,
    isPlaying,
    toggle,
    next,
    prev,
    quit, // 👈 fermeture TOTALE
    positionSec,
    durationSec,
    seek,
  } = usePlayer();

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <PlayerDock
        current={current as Podcast | null}
        isPlaying={isPlaying}
        onToggle={toggle}
        onPrev={prev}
        onNext={next}
        onClose={quit} // 👈 ferme tout
        positionSec={positionSec}
        durationSec={durationSec}
        onSeek={(sec) => seek?.(sec)}
      />

      <MobilePlayerFab
        current={current as Podcast | null}
        isPlaying={isPlaying}
        onPress={() => setDrawerOpen(true)}
      />

      <MobilePlayerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        current={current as Podcast | null}
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
