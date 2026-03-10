// src/pages/communaute/private/community-details/tabs/DirectTab/LiveListsSection.tsx
import type { FC, ReactNode } from "react";
import { useState } from "react";
import type { CommunityLive } from "./types";

type LiveListsSectionProps = {
  loading: boolean;
  currentLive?: CommunityLive;
  upcomingLives: CommunityLive[];
  pastLives: CommunityLive[];
  isOwner: boolean;
  communityId: string;

  onEndLive: (liveId: string) => void;
  onLaunchFromScheduled: (live: CommunityLive) => void;
  onEditScheduled: (live: CommunityLive) => void;
  onCancelScheduled: (liveId: string) => void;
};

type TabKey = "current" | "upcoming" | "replays";

const LiveListsSection: FC<LiveListsSectionProps> = ({
  loading,
  currentLive,
  upcomingLives,
  pastLives,
  isOwner,
  communityId,
  onEndLive,
  onLaunchFromScheduled,
  onEditScheduled,
  onCancelScheduled,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>("current");

  const hasNoLives =
    !loading &&
    !currentLive &&
    upcomingLives.length === 0 &&
    pastLives.length === 0;

  const renderCurrentTab = () => {
    if (loading) {
      return (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Chargement des directs…
        </p>
      );
    }

    if (!currentLive) {
      return (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Aucun direct en cours pour le moment.
        </p>
      );
    }

    return (
      <div className="rounded-lg border border-emerald-500/60 bg-emerald-50/80 dark:bg-emerald-900/20 px-3 py-2 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <div className="flex-1">
          <p className="text-xs font-semibold">
            Live en cours : {currentLive.title}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            Lance le lecteur pour rejoindre la session en direct.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (window.location.href = `/direct/${currentLive.id}`)}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Rejoindre
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={() => onEndLive(currentLive.id)}
              className="text-[11px] px-3 py-1.5 rounded-full border border-emerald-500/70 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/30"
            >
              Terminer
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderUpcomingTab = () => {
    if (loading) {
      return (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Chargement des directs…
        </p>
      );
    }

    if (upcomingLives.length === 0) {
      return (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Aucun direct programmé pour le moment.
        </p>
      );
    }

    return (
      <div className="space-y-1.5">
        {upcomingLives.map((l) => (
          <div
            key={l.id}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs flex items-center gap-3"
          >
            <div className="flex-1">
              <p className="font-medium">{l.title}</p>
              {l.startsAt && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {new Date(l.startsAt).toLocaleString("fr-FR", {
                    weekday: "short",
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
              <p className="text-[10px] text-slate-400 mt-0.5">
                {l.isPublic ? "Public" : "Privé"}
              </p>
            </div>

            {isOwner ? (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => onLaunchFromScheduled(l)}
                  className="text-[11px] px-3 py-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Lancer
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditScheduled(l)}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancelScheduled(l.id)}
                    className="text-[11px] px-2 py-0.5 rounded-full border border-red-500/60 text-red-600 hover:bg-red-50/60 dark:hover:bg-red-900/30"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => (window.location.href = `/direct/${l.id}`)}
                className="text-[11px] px-3 py-1 rounded-full bg-violet-600 text-white hover:bg-violet-700"
              >
                Voir la salle
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderReplaysTab = () => {
    if (loading) {
      return (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Chargement des directs…
        </p>
      );
    }

    if (pastLives.length === 0) {
      return (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Aucun live terminé ou annulé pour le moment.
        </p>
      );
    }

    return (
      <div className="space-y-1.5">
        {pastLives.slice(0, 5).map((l) => (
          <div
            key={l.id}
            className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs flex items-center gap-3"
          >
            <div className="flex-1">
              <p className="font-medium flex items-center gap-1.5">
                <span>{l.title}</span>
                {l.status === "cancelled" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
                    Annulé
                  </span>
                )}
                {l.status === "ended" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700">
                    Terminé
                  </span>
                )}
              </p>
              {l.startsAt && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {new Date(l.startsAt).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
            <span className="text-[11px] px-2 py-1 rounded-full border border-slate-300 dark:border-slate-600 text-slate-500">
              Replay bientôt
            </span>
          </div>
        ))}
      </div>
    );
  };

  let content: ReactNode = null;
  if (activeTab === "current") content = renderCurrentTab();
  if (activeTab === "upcoming") content = renderUpcomingTab();
  if (activeTab === "replays") content = renderReplaysTab();

  return (
    <section className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 space-y-4">
      <header className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Directs à venir & replays</h3>

        {/* Onglets */}
        <div className="inline-flex items-center rounded-full bg-slate-900/60 border border-slate-700 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab("current")}
            className={`px-3 py-1.5 rounded-full transition ${
              activeTab === "current"
                ? "bg-emerald-500 text-white"
                : "text-slate-300"
            }`}
          >
            Direct en cours
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1.5 rounded-full transition ${
              activeTab === "upcoming"
                ? "bg-violet-500 text-white"
                : "text-slate-300"
            }`}
          >
            Directs à venir
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("replays")}
            className={`px-3 py-1.5 rounded-full transition ${
              activeTab === "replays"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-300"
            }`}
          >
            Replays
          </button>
        </div>
      </header>

      {hasNoLives ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Aucun direct encore programmé pour cette communauté.
        </p>
      ) : (
        <div className="space-y-2">{content}</div>
      )}

      <p className="mt-1 text-[11px] text-slate-400">
        ID communauté : <code className="font-mono">{communityId}</code>
      </p>
    </section>
  );
};

export default LiveListsSection;
