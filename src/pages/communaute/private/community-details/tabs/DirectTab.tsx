// src/pages/communaute/private/community-details/tabs/DirectTab.tsx
import { useEffect, useState } from "react";
import { API_BASE } from "../../../../../lib/api";
import { loadSession } from "../../../../../auth/lib/storage";

import LaunchLiveModal from "./DirectTab/LaunchLiveModal";
import OwnerDirectActions from "./DirectTab/OwnerDirectActions";
import LiveListsSection from "./DirectTab/LiveListsSection";
import type { CommunityLive } from "./DirectTab/types";
import MembersOnlyAlert from "../../../../../components/community/MembersOnlyAlert";

type Props = {
  communityId: string;
  isOwner: boolean;
  isMember: boolean;
  isAuthenticated: boolean;
  /** pour adapter le texte du bouton (public / private) */
  communityVisibility?: "public" | "private";
  /** appelé quand l’utilisateur clique sur “Rejoindre la communauté” */
  onJoinCommunity?: () => void;
};

type LivesApiResponse = {
  ok: boolean;
  data?: { items?: CommunityLive[]; live?: CommunityLive };
  error?: string;
};

function authHeaders(): HeadersInit {
  const tok = (loadSession() as { token?: string } | null)?.token ?? "";
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

/** Ouvre le modal global d'authentification */
function openAuthModal() {
  try {
    const from =
      window.location.pathname + window.location.search + window.location.hash;
    localStorage.setItem("fm:auth:intent", from);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode: "signin" } })
  );
}

export default function DirectTab({
  communityId,
  isOwner,
  isMember,
  isAuthenticated,
  communityVisibility = "public",
  onJoinCommunity,
}: Props) {
  const [lives, setLives] = useState<CommunityLive[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulaire de programmation / édition
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleIsPublic, setScheduleIsPublic] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);

  // Modale de lancement
  const [launchOpen, setLaunchOpen] = useState(false);
  const [launchMode, setLaunchMode] = useState<"instant" | "scheduled">(
    "instant"
  );
  const [launchTarget, setLaunchTarget] = useState<CommunityLive | null>(null);
  const [launchTitle, setLaunchTitle] = useState("");
  const [launchIsPublic, setLaunchIsPublic] = useState(false);
  const [launching, setLaunching] = useState(false);

  const hasAccess = isOwner || isMember;

  /* ---------- Chargement des lives ---------- */
  useEffect(() => {
    if (!isAuthenticated || !hasAccess) return;

    const fetchLives = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${API_BASE}/communaute/lives/by-community/${communityId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(),
            },
          }
        );
        const json = (await res.json()) as LivesApiResponse;
        if (!json.ok) throw new Error(json.error || "Chargement impossible");
        const items = json.data?.items ?? [];
        setLives(items);
      } catch (e) {
        setError((e as Error).message || "Impossible de charger les directs.");
      } finally {
        setLoading(false);
      }
    };

    void fetchLives();
  }, [communityId, isAuthenticated, hasAccess]);

  const currentLive = lives.find((l) => l.status === "live");
  const upcomingLives = lives
    .filter((l) => l.status === "scheduled")
    .sort(
      (a, b) =>
        new Date(a.startsAt || 0).getTime() -
        new Date(b.startsAt || 0).getTime()
    );
  const pastLives = lives
    .filter((l) => l.status === "ended" || l.status === "cancelled")
    .sort(
      (a, b) =>
        new Date(b.startsAt || 0).getTime() -
        new Date(a.startsAt || 0).getTime()
    );

  const buildInstantTitle = () => {
    const now = new Date();
    const datePart = now.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timePart = now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Live du ${datePart} à ${timePart}`;
  };

  /* ---------- Modale de lancement ---------- */

  const openInstantLaunchModal = () => {
    if (!isOwner) return;
    setLaunchMode("instant");
    setLaunchTarget(null);
    setLaunchTitle(buildInstantTitle());
    setLaunchIsPublic(false);
    setLaunchOpen(true);
  };

  const openLaunchFromScheduled = (live: CommunityLive) => {
    if (!isOwner) return;
    setLaunchMode("scheduled");
    setLaunchTarget(live);
    setLaunchTitle(live.title);
    setLaunchIsPublic(!!live.isPublic);
    setLaunchOpen(true);
  };

  const closeLaunchModal = () => {
    if (launching) return;
    setLaunchOpen(false);
    setLaunchTarget(null);
  };

  const handleConfirmLaunch = async () => {
    if (!isOwner) return;
    if (!launchTitle.trim()) return;
    setLaunching(true);
    try {
      setError(null);

      if (launchMode === "instant") {
        const res = await fetch(`${API_BASE}/communaute/lives/start-now`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            communityId,
            title: launchTitle.trim(),
            isPublic: launchIsPublic,
          }),
        });
        const json = (await res.json()) as LivesApiResponse;
        if (!json.ok || !json.data?.live) {
          throw new Error(json.error || "Impossible de lancer le direct.");
        }
        const live = json.data.live;
        setLives((prev) => {
          const others = prev.filter((l) => l.id !== live.id);
          return [...others, live];
        });
        window.location.href = `/direct/${live.id}`;
      } else if (launchMode === "scheduled" && launchTarget) {
        const res = await fetch(
          `${API_BASE}/communaute/lives/${launchTarget.id}/go-live`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(),
            },
            body: JSON.stringify({
              title: launchTitle.trim(),
              isPublic: launchIsPublic,
            }),
          }
        );
        const json = (await res.json()) as LivesApiResponse;
        if (!json.ok || !json.data?.live) {
          throw new Error(json.error || "Impossible de démarrer le direct.");
        }
        const live = json.data.live;
        setLives((prev) => prev.map((l) => (l.id === live.id ? live : l)));
        window.location.href = `/direct/${live.id}`;
      }
    } catch (e) {
      setError(
        (e as Error).message || "Impossible de lancer / démarrer le direct."
      );
    } finally {
      setLaunching(false);
      setLaunchOpen(false);
    }
  };

  /* ---------- Programmation / édition ---------- */

  const resetScheduleForm = () => {
    setScheduleTitle("");
    setScheduleDate("");
    setScheduleTime("");
    setScheduleIsPublic(false);
    setEditingId(null);
  };

  const handleSchedule = async () => {
    if (!isOwner) return;
    if (!scheduleTitle || !scheduleDate || !scheduleTime) return;

    const startsAt = new Date(`${scheduleDate}T${scheduleTime}:00`);

    setScheduling(true);
    try {
      setError(null);

      if (editingId) {
        const res = await fetch(
          `${API_BASE}/communaute/lives/${editingId}/update`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(),
            },
            body: JSON.stringify({
              title: scheduleTitle,
              startsAt: startsAt.toISOString(),
              isPublic: scheduleIsPublic,
            }),
          }
        );
        const json = (await res.json()) as LivesApiResponse;
        if (!json.ok || !json.data?.live) {
          throw new Error(json.error || "Impossible de modifier le direct.");
        }

        const live = json.data.live;
        setLives((prev) => prev.map((l) => (l.id === live.id ? live : l)));
      } else {
        const res = await fetch(`${API_BASE}/communaute/lives/schedule`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            communityId,
            title: scheduleTitle,
            startsAt: startsAt.toISOString(),
            isPublic: scheduleIsPublic,
          }),
        });
        const json = (await res.json()) as LivesApiResponse;
        if (!json.ok || !json.data?.live) {
          throw new Error(json.error || "Impossible de programmer le direct.");
        }

        const live = json.data.live;
        setLives((prev) => [...prev, live]);
      }

      resetScheduleForm();
    } catch (e) {
      setError(
        (e as Error).message || "Impossible de programmer/modifier le direct."
      );
    } finally {
      setScheduling(false);
    }
  };

  const handleEditScheduled = (live: CommunityLive) => {
    if (!isOwner) return;
    setEditingId(live.id);
    setScheduleTitle(live.title);
    if (live.startsAt) {
      const d = new Date(live.startsAt);
      setScheduleDate(d.toISOString().slice(0, 10));
      setScheduleTime(d.toTimeString().slice(0, 5));
    } else {
      setScheduleDate("");
      setScheduleTime("");
    }
    setScheduleIsPublic(!!live.isPublic);
  };

  const handleCancelScheduled = async (liveId: string) => {
    if (!isOwner) return;
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/communaute/lives/${liveId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });
      const json = (await res.json()) as LivesApiResponse;
      if (!json.ok || !json.data?.live) {
        throw new Error(json.error || "Impossible d’annuler le direct.");
      }
      const live = json.data.live;
      setLives((prev) => prev.map((l) => (l.id === live.id ? live : l)));
      if (editingId === liveId) {
        resetScheduleForm();
      }
    } catch (e) {
      setError((e as Error).message || "Impossible d’annuler le direct.");
    }
  };

  const handleEndLive = async (liveId: string) => {
    if (!isOwner) return;
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/communaute/lives/${liveId}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
      });
      const json = (await res.json()) as LivesApiResponse;
      if (!json.ok || !json.data?.live) {
        throw new Error(json.error || "Impossible de terminer le direct.");
      }

      const live = json.data.live;
      setLives((prev) => prev.map((l) => (l.id === live.id ? live : l)));
    } catch (e) {
      setError((e as Error).message || "Impossible de terminer le direct.");
    }
  };

  /* ---------- Helpers CTA ---------- */

  const joinLabel =
    communityVisibility === "private"
      ? "Demander l’accès"
      : "Rejoindre la communauté";

  const handleJoinClick = () => {
    if (onJoinCommunity) {
      onJoinCommunity();
      return;
    }

    // fallback : si jamais pas de callback, on essaie au moins
    // d’ouvrir le compte ou de renvoyer vers l’onglet Aperçu
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    try {
      const sp = new URLSearchParams(window.location.search);
      sp.set("tab", "apercu");
      window.history.replaceState(null, "", `?${sp.toString()}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      /* ignore */
    }
  };

  /* ---------- Rendu ---------- */

  // 1) Pas connecté → message + CTA login
  if (!isAuthenticated) {
    return (
      <div className="w-full">
        <MembersOnlyAlert
          title="Connecte-toi pour accéder aux directs"
          description="Crée ou rejoins un compte FullMargin pour lancer ou suivre les lives de cette communauté."
          ctaLabel="Se connecter / S’inscrire"
          onCtaClick={openAuthModal}
        />
      </div>
    );
  }

  // 2) Connecté mais pas membre → message + CTA rejoindre
  if (!hasAccess) {
    return (
      <div className="w-full">
        <MembersOnlyAlert
          title="Directs réservés aux membres"
          description="Deviens membre de cette communauté pour participer aux directs."
          ctaLabel={joinLabel}
          onCtaClick={handleJoinClick}
        />
      </div>
    );
  }

  // 3) Accès OK → contenu complet
  return (
    <>
      {/* Modale de lancement */}
      <LaunchLiveModal
        open={launchOpen}
        mode={launchMode}
        title={launchTitle}
        isPublic={launchIsPublic}
        launching={launching}
        onClose={closeLaunchModal}
        onChangeTitle={setLaunchTitle}
        onChangeVisibility={setLaunchIsPublic}
        onConfirm={() => void handleConfirmLaunch()}
      />

      {/* Contenu principal */}
      <div className="w-full">
        <div className="rounded-2xl bg-white/90 dark:bg-slate-900/80 p-6 border border-slate-100/60 dark:border-slate-800/60 space-y-6">
          <header>
            <h2 className="text-lg font-semibold">Directs & Lives</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Lance un direct en temps réel ou programme une session pour plus
              tard.
            </p>
          </header>

          {error && (
            <div className="text-sm text-red-600 bg-red-50/80 dark:bg-red-900/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {isOwner ? (
            <OwnerDirectActions
              onOpenInstantLaunchModal={openInstantLaunchModal}
              scheduleTitle={scheduleTitle}
              scheduleDate={scheduleDate}
              scheduleTime={scheduleTime}
              scheduleIsPublic={scheduleIsPublic}
              editingId={editingId}
              scheduling={scheduling}
              onChangeScheduleTitle={setScheduleTitle}
              onChangeScheduleDate={setScheduleDate}
              onChangeScheduleTime={setScheduleTime}
              onChangeScheduleVisibility={setScheduleIsPublic}
              onSubmitSchedule={() => void handleSchedule()}
              onResetEditing={resetScheduleForm}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400">
              Les directs sont gérés par les admins de la communauté. Tu pourras
              les rejoindre ici dès qu’un live sera planifié.
            </div>
          )}

          <LiveListsSection
            loading={loading}
            currentLive={currentLive}
            upcomingLives={upcomingLives}
            pastLives={pastLives}
            isOwner={isOwner}
            communityId={communityId}
            onEndLive={(id) => void handleEndLive(id)}
            onLaunchFromScheduled={openLaunchFromScheduled}
            onEditScheduled={handleEditScheduled}
            onCancelScheduled={(id) => void handleCancelScheduled(id)}
          />
        </div>
      </div>
    </>
  );
}
