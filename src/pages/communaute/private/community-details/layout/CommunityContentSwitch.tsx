// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\layout\CommunityContentSwitch.tsx

import CommunityProfileTabs from "../tabs/CommunityProfileTabs";
import Publications from "../tabs/Publications/Publications";
import FormationsPage from "../tabs/Formations";

import AvisTab from "../tabs/AvisTab";
import DemandesTab from "../tabs/DemandesTab";
import ParamsTab from "../tabs/SettingsTab";
import AboutTab from "../tabs/about/AboutTab";
import NotificationsList from "../components/NotificationsList";
import VentesTab from "../tabs/VentesTab";
import AchatsTab from "../tabs/AchatsTab";
import GroupesTab from "../tabs/GroupesTab";

import { type TabKey } from "../types";
import type { Community } from "../hooks/useCommunityDetails";
import DirectTab from "../tabs/DirectTab";

type Props = {
  active: TabKey;
  loading: boolean;
  error: string | null;
  isSelfSpace: boolean;
  community: Community | null;
  isOwner: boolean;
  isMember: boolean;
  membershipStatus: "none" | "pending" | "approved";
  onVisitorJoin: (note?: string) => void;
  requireAuth: () => void;
  isAuthenticated: boolean;
  onVisitorLeave?: () => void;
  visitorLeaving?: boolean;
  currentUserId?: string | null;
  currentUserName?: string | null;
};

type CommunityWithCurrentUser = Community & {
  currentUserId?: string | null;
};

export default function CommunityContentSwitch({
  active,
  loading,
  error,
  isSelfSpace,
  community,
  isOwner,
  isMember,
  membershipStatus,
  onVisitorJoin,
  requireAuth,
  isAuthenticated,
  onVisitorLeave,
  visitorLeaving = false,
  currentUserId,
  currentUserName,
}: Props) {
  const effectiveCurrentUserId: string | null =
    typeof currentUserId === "string"
      ? currentUserId
      : isAuthenticated && community
        ? ((community as CommunityWithCurrentUser).currentUserId ?? null)
        : null;

  if (loading) {
    return <div className="rounded-2xl bg-white/90 p-6">Chargement…</div>;
  }

  if (error && !isSelfSpace) {
    return (
      <div className="rounded-2xl bg-white/90 p-6 text-red-600">{error}</div>
    );
  }

  const allowSubscribersPosts = !!community?.allowSubscribersPosts;

  if (active === "apercu") {
    return community ? (
      <CommunityProfileTabs
        community={community}
        isOwner={isOwner}
        visitorStatus={membershipStatus}
        onVisitorJoin={onVisitorJoin}
        ctaBusy={false}
        onVisitorLeave={onVisitorLeave}
        visitorLeaving={visitorLeaving}
      />
    ) : (
      <AboutTab />
    );
  }

  if (active === "publications") {
    return community ? (
      <Publications
        communityId={community.id}
        currentUserId={effectiveCurrentUserId}
        onRequireAuth={requireAuth}
        isAuthenticated={isAuthenticated}
        isOwner={isOwner}
        isMember={isMember}
        allowSubscribersPosts={allowSubscribersPosts}
      />
    ) : (
      <div className="rounded-2xl bg-white/90 p-6">
        Crée d’abord ta communauté pour publier.
      </div>
    );
  }

  if (active === "formations") {
    if (!community) {
      return (
        <div className="rounded-2xl bg-white/90 p-6">
          Crée d’abord ta communauté pour ajouter des formations.
        </div>
      );
    }

    return (
      <FormationsPage
        communityId={community.id}
        canCreate={isOwner} // ou (isOwner || isMember)
      />
    );
  }

  /* 🔹 Onglet GROUPES */
  if (active === "groupes") {
    if (!community) {
      return (
        <div className="rounded-2xl bg-white/90 p-6">
          Crée d’abord ta communauté pour gérer des groupes.
        </div>
      );
    }

    return (
      <GroupesTab
        communityId={community.id}
        isOwner={isOwner}
        isMember={isMember}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  /* 🔹 Onglet DIRECT */
  if (active === "direct") {
    if (!community) {
      return (
        <div className="rounded-2xl bg-white/90 p-6">
          Crée d’abord ta communauté pour lancer des directs.
        </div>
      );
    }

    return (
      <DirectTab
        communityId={community.id}
        isOwner={isOwner}
        isMember={isMember}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  if (active === "avis" && community) {
    return (
      <AvisTab
        communityId={community.id}
        ownerId={community.ownerId || ""}
        isMember={isMember}
        currentUserId={effectiveCurrentUserId}
        currentUserName={currentUserName}
        onRequireAuth={requireAuth}
        isAuthenticated={isAuthenticated}
        isOwner={isOwner}
        // 👇 permettre l’abonnement direct depuis Avis
        onJoinCommunity={() => onVisitorJoin()}
        communityVisibility={community.visibility ?? "public"}
      />
    );
  }

  if (active === "notifications") {
    return (
      <div className="mt-4">
        <NotificationsList
          onGoTo={(target) => {
            if (
              target.kind === "community_request_received" ||
              target.kind === "community_request_approved" ||
              target.kind === "community_request_rejected"
            ) {
              window.dispatchEvent(
                new CustomEvent("fm:community-req-counters:force-refresh"),
              );
              const sp = new URLSearchParams(window.location.search);
              sp.set("tab", "demandes");
              window.history.replaceState(null, "", `?${sp.toString()}`);
              return;
            }

            if (target.postId) {
              window.dispatchEvent(
                new CustomEvent("fm:community:open-post", {
                  detail: {
                    postId: target.postId,
                    communityId: target.communityId ?? undefined,
                  },
                }),
              );
            }
          }}
        />
      </div>
    );
  }

  if (isOwner && active === "demandes") {
    return <DemandesTab />;
  }

  if (isOwner && active === "paramètres") {
    return community ? (
      <ParamsTab communityId={community.id} />
    ) : (
      <div className="rounded-2xl bg-white/90 p-6">
        Paramètres disponibles après création.
      </div>
    );
  }

  /* ---------- Onglet VENTES ---------- */
  if (active === "ventes") {
    if (!isOwner) {
      return (
        <div className="rounded-2xl bg-white/90 p-6">
          Seul l’administrateur de la communauté peut voir ses ventes ici.
        </div>
      );
    }

    if (!isAuthenticated) {
      return (
        <div className="rounded-2xl bg-white/90 p-6">
          Connecte-toi pour voir tes ventes.
        </div>
      );
    }

    return <VentesTab />;
  }

  /* ---------- Onglet ACHATS ---------- */
  if (active === "achats") {
    if (!isAuthenticated) {
      return (
        <div className="rounded-2xl bg-white/90 p-6">
          Connecte-toi pour voir tes achats.
        </div>
      );
    }

    // 🚫 Sécurité : on ne montre "Mes achats" que dans *mon* espace
    if (!isSelfSpace) {
      return (
        <div className="rounded-2xl bg-white/90 p-6">
          Tes achats sont visibles uniquement dans ton espace communauté.
        </div>
      );
    }

    return <AchatsTab />;
  }

  return <AboutTab />;
}
