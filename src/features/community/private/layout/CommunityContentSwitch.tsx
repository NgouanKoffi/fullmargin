// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\layout\CommunityContentSwitch.tsx

import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE } from "@core/api/client";

import CommunityProfileTabs from "@features/community/private/layout/CommunityProfileTabs";
import Publications from "../modules/posts/Publications/Publications";
import FormationsPage from "../modules/courses/Formations";

import AvisTab from "../modules/reviews/AvisTab";
import DemandesTab from "../modules/requests/DemandesTab";
import ParamsTab from "../modules/settings/SettingsTab";
import AboutTab from "../modules/about/AboutTab";
import VentesTab from "../modules/sales/VentesTab";
import AchatsTab from "../modules/purchases/AchatsTab";
import GroupesTab from "../modules/groups/GroupesTab";

import { type TabKey } from "@features/community/types";
import type { Community } from "@features/community/hooks/useCommunityDetails";
import DirectTab from "../modules/streams/DirectTab";

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
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Ouverture automatique d'un post depuis URL (?postId=xxx&tab=publications) ──
  const postOpenedRef = useRef<string | null>(null);

  useEffect(() => {
    if (active !== "publications") return;

    const postId = searchParams.get("postId");
    if (!postId) return;

    if (postOpenedRef.current === postId) return;
    postOpenedRef.current = postId;

    const timer = window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("fm:community:open-post", {
          detail: {
            postId,
            communityId: community?.id,
          },
        }),
      );
    }, 150);

    const handleModalClosed = () => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("postId");
          return next;
        },
        { replace: true },
      );
      postOpenedRef.current = null;
    };

    window.addEventListener(
      "fm:community:post-modal-closed",
      handleModalClosed,
    );

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(
        "fm:community:post-modal-closed",
        handleModalClosed,
      );
    };
  }, [active, searchParams, community?.id, setSearchParams]);

  useEffect(() => {
    postOpenedRef.current = null;
  }, [community?.id]);

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

  if (community && (community.deletedAt || community.status === "deleted_by_owner" || community.status === "deleted_by_admin")) {
    if (isOwner) {
      return (
        <div className="rounded-2xl bg-white/90 p-8 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <span className="text-2xl">🗑️</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Votre communauté a été supprimée</h2>
          <p className="text-slate-600 mb-6">
            Votre communauté n'est plus visible publiquement. Vos membres existants conservent toutefois l'accès à leurs formations achetées.
          </p>
          <button
            onClick={async () => {
              if (!window.confirm("Voulez-vous vraiment demander la restauration de votre communauté ?")) return;
              try {
                const sessionRaw = localStorage.getItem("fm:session");
                const token = sessionRaw ? JSON.parse(sessionRaw).token : "";
                const res = await fetch(`${API_BASE}/communaute/communities/${encodeURIComponent(community.id)}/request-restoration`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify({ reason: "Demande de restauration depuis le dashboard" })
                });
                const json = await res.json();
                if (json.ok) alert("Demande envoyée avec succès.");
                else alert(json.error || "Erreur de la demande.");
              } catch (e) {
                alert("Erreur lors de la demande de restauration.");
              }
            }}
            className="inline-flex justify-center rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition"
          >
            Demander la restauration
          </button>
        </div>
      );
    }
    return <div className="rounded-2xl bg-white/90 p-6 text-red-600 text-center font-medium">Cette communauté n'existe plus.</div>;
  }

  /* 🔹 Onglet DÉTAILS / APERÇU (Ma communauté) */
  if (active === "apercu") {
    if (community) {
      return (
        <CommunityProfileTabs
          community={community}
          isOwner={isOwner}
          visitorStatus={membershipStatus}
          onVisitorJoin={onVisitorJoin}
          ctaBusy={false}
          onVisitorLeave={onVisitorLeave}
          visitorLeaving={visitorLeaving}
        />
      );
    }

    // ✅ CORRECTION : S'il n'y a pas de communauté, on atterrit ici avec un état "vide"
    // pour permettre la création (via AboutTab ou le composant de création dédié)
    return <AboutTab />;
  }

  /* 🔹 Onglet PUBLICATIONS */
  if (active === "publications") {
    if (!community) {
      return (
        <div className="rounded-2xl bg-white/90 p-6 text-slate-600">
          Crée d'abord ta communauté pour publier.
        </div>
      );
    }

    return (
      <Publications
        communityId={community.id}
        currentUserId={effectiveCurrentUserId}
        onRequireAuth={requireAuth}
        isAuthenticated={isAuthenticated}
        isOwner={isOwner}
        isMember={isMember}
        allowSubscribersPosts={allowSubscribersPosts}
      />
    );
  }

  /* 🔹 Onglet FORMATIONS */
  if (active === "formations") {
    if (!community) {
      return (
        <div className="rounded-2xl bg-white/90 p-6 text-slate-600">
          Crée d'abord ta communauté pour ajouter des formations.
        </div>
      );
    }

    return <FormationsPage communityId={community.id} canCreate={isOwner} />;
  }

  /* 🔹 Onglet GROUPES */
  if (active === "groupes") {
    if (!community) {
      return (
        <div className="rounded-2xl bg-white/90 p-6 text-slate-600">
          Crée d'abord ta communauté pour gérer des groupes.
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
    return (
      <DirectTab
        communityId={community?.id || ""}
        isOwner={isOwner}
        isAuthenticated={isAuthenticated}
      />
    );
  }

  /* 🔹 Onglet AVIS */
  if (active === "avis") {
    if (!community) return null;
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
        onJoinCommunity={() => onVisitorJoin()}
        communityVisibility={community.visibility ?? "public"}
      />
    );
  }

  /* 🔹 Onglet NOTIFICATIONS */
  if (active === "notifications") {
    return <div className="mt-4"></div>;
  }

  /* 🔹 Onglet DEMANDES (Mes abonnements) */
  if (isOwner && active === "demandes") {
    return <DemandesTab />;
  }

  /* 🔹 Onglet PARAMÈTRES */
  if (isOwner && active === "paramètres") {
    if (!community) {
      return (
        <div className="rounded-2xl bg-white/90 p-6 text-slate-600">
          Les paramètres seront disponibles après la création de ta communauté.
        </div>
      );
    }
    return <ParamsTab communityId={community.id} />;
  }

  /* ---------- Onglet VENTES ---------- */
  if (active === "ventes") {
    if (!isOwner) {
      return (
        <div className="rounded-2xl bg-white/90 p-6 text-red-500">
          Seul l'administrateur de la communauté peut voir ses ventes ici.
        </div>
      );
    }
    if (!isAuthenticated) {
      return (
        <div className="rounded-2xl bg-white/90 p-6 text-slate-600">
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
        <div className="rounded-2xl bg-white/90 p-6 text-slate-600">
          Connecte-toi pour voir tes achats.
        </div>
      );
    }
    if (!isSelfSpace) {
      return (
        <div className="rounded-2xl bg-white/90 p-6 text-red-500">
          Tes achats sont visibles uniquement dans ton espace personnel.
        </div>
      );
    }
    return <AchatsTab />;
  }

  return <AboutTab />;
}
