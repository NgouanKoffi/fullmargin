// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\index\CommunityDetails.tsx

import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

import MobileStickyBar from "../community-details/components/MobileStickyBar.js";
import { tabLabel, type TabKey } from "../community-details/types.js";

import { useAuth } from "../../../../auth/AuthContext.js";
import { useCommunityDetails } from "../community-details/hooks/useCommunityDetails";
import { useCommunityMembership } from "../community-details/hooks/useCommunityMembership";

import CommunityDesktopTabs from "../community-details/layout/CommunityDesktopTabs.js";
import CommunityContentSwitch from "../community-details/layout/CommunityContentSwitch.js";
import {
  getRequestCounters,
  leaveCommunity,
} from "../community-details/services/requests.service.js";
import {
  getReviewCounters,
  markReviewNotificationsAsSeen,
} from "../community-details/services/reviews.service.js";
import { getUnseenNotificationsCount } from "../community-details/services/notifications.service.ts";
import MobileDrawer from "../community-details/layout/MobileDrawer.tsx";

import CommentsModal from "../../public/components/feed/modals/CommentsModal";
import type { PostLite } from "../../public/components/feed/types";

import { ALLOWED_TABS, LOCKED_WHEN_NO_COMMUNITY, isTabKey } from "./constants";
import { CommunityDetailsSkeleton } from "./Skeleton";
import { usePostFromNotification } from "./postFromNotification";

const OWNER_ONLY_TABS: TabKey[] = [
  "notifications",
  "demandes",
  "paramètres",
  "ventes",
];

export default function CommunityDetails() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { status, user } = useAuth();
  const isAuthenticated = status === "authenticated";

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");

  const {
    community,
    loading,
    error,
    isSelfSpace,
    isOwner,
    requireAuth,
    joinFromDetails,
  } = useCommunityDetails({
    slug,
    status,
    user,
  });

  const { membershipStatus: remoteMembershipStatus, canAccessPrivates } =
    useCommunityMembership({
      communityId: community?.id,
      isOwner,
    });

  const hasCommunity = Boolean(community?.id);

  const [active, setActive] = useState<TabKey>(() =>
    isTabKey(urlTab) ? (urlTab as TabKey) : "apercu",
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [membershipStatus, setMembershipStatus] = useState<
    "none" | "pending" | "approved"
  >(remoteMembershipStatus);

  useEffect(() => {
    setMembershipStatus(remoteMembershipStatus);
  }, [remoteMembershipStatus]);

  const isMember = membershipStatus === "approved";

  const [reqCounters, setReqCounters] = useState<{
    myPending: number;
    ownerPending: number;
  }>({ myPending: 0, ownerPending: 0 });

  const [reviewUnseen, setReviewUnseen] = useState(0);
  const [notifUnseen, setNotifUnseen] = useState(0);

  const [leaving, setLeaving] = useState(false);

  const { openPostModal, postFromNotif, loadingPostFromNotif, closePostModal } =
    usePostFromNotification(community?.id);

  // ----------------- sync url / tab -----------------
  useEffect(() => {
    if (loading) return;

    setDrawerOpen(false);

    const next = new URLSearchParams(searchParams);
    const currentUrlTab = next.get("tab");

    const sub = next.get("sub");
    const mstatus = next.get("mstatus");
    const istatus = next.get("istatus");

    let rawTab = currentUrlTab;

    const looksLikeLegacyDemandes =
      rawTab === "publications" &&
      sub === "mine" &&
      (mstatus === "pending" || istatus === "pending");

    if (looksLikeLegacyDemandes) {
      rawTab = "demandes";
      next.set("tab", "demandes");
      setSearchParams(next, { replace: true });
    }

    let finalTab: TabKey = "apercu";

    if (rawTab && isTabKey(rawTab)) {
      let k = rawTab as TabKey;

      if (!isOwner && OWNER_ONLY_TABS.includes(k)) {
        k = "apercu";
        next.set("tab", k);
        setSearchParams(next, { replace: true });
      }

      if (isOwner && !hasCommunity && LOCKED_WHEN_NO_COMMUNITY.includes(k)) {
        k = "apercu";
        next.set("tab", k);
        setSearchParams(next, { replace: true });
      }

      if (!isSelfSpace && k === "achats") {
        k = "apercu";
        next.set("tab", k);
        setSearchParams(next, { replace: true });
      }

      finalTab = k;
    } else {
      finalTab = "apercu";
      next.set("tab", "apercu");
      setSearchParams(next, { replace: true });
    }

    setActive(finalTab);

    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [
    slug,
    hasCommunity,
    isOwner,
    isSelfSpace,
    loading,
    urlTab,
    searchParams,
    setSearchParams,
  ]);

  // ----------------- compteurs -----------------
  useEffect(() => {
    if (!isAuthenticated) {
      setReqCounters({ myPending: 0, ownerPending: 0 });
      setReviewUnseen(0);
      setNotifUnseen(0);
      window.dispatchEvent(
        new CustomEvent("fm:community-req-counters", {
          detail: { myPending: 0, ownerPending: 0 },
        }),
      );
      return;
    }

    let cancel = false;

    const loadCounters = async () => {
      try {
        const data = await getRequestCounters();
        if (!cancel) {
          const next = {
            myPending: data.myPending ?? 0,
            ownerPending: data.ownerPending ?? 0,
          };
          setReqCounters(next);
          window.dispatchEvent(
            new CustomEvent("fm:community-req-counters", {
              detail: next,
            }),
          );
        }
      } catch {
        /* ignore */
      }

      try {
        const rev = await getReviewCounters();
        if (!cancel) {
          setReviewUnseen(rev.unseen ?? 0);
        }
      } catch {
        /* ignore */
      }

      try {
        const n = await getUnseenNotificationsCount();
        if (!cancel) {
          setNotifUnseen(n.count ?? 0);
        }
      } catch {
        /* ignore */
      }
    };

    loadCounters();

    const id = window.setInterval(() => {
      loadCounters();
    }, 25000);

    const onForce = () => {
      loadCounters();
    };
    window.addEventListener(
      "fm:community-req-counters:force-refresh",
      onForce as EventListener,
    );
    window.addEventListener(
      "fm:community-review-counters:force-refresh",
      onForce as EventListener,
    );

    const onNotifSeenOne = () => {
      setNotifUnseen((prev) => Math.max(0, prev - 1));
    };
    window.addEventListener(
      "fm:community-notifs:seen-one",
      onNotifSeenOne as EventListener,
    );

    // ✅ ÉCOUTEUR AJOUTÉ ICI : Remise à 0
    const onNotifSeenAll = () => {
      setNotifUnseen(0);
    };
    window.addEventListener(
      "fm:community-notifs:seen-all",
      onNotifSeenAll as EventListener,
    );

    return () => {
      cancel = true;
      window.clearInterval(id);
      window.removeEventListener(
        "fm:community-req-counters:force-refresh",
        onForce as EventListener,
      );
      window.removeEventListener(
        "fm:community-review-counters:force-refresh",
        onForce as EventListener,
      );
      window.removeEventListener(
        "fm:community-notifs:seen-one",
        onNotifSeenOne as EventListener,
      );
      window.removeEventListener(
        "fm:community-notifs:seen-all",
        onNotifSeenAll as EventListener,
      );
    };
  }, [isAuthenticated]);

  const handleJoinFromDetails = async () => {
    try {
      await joinFromDetails();
    } catch {
      // ignore
    }
    const nextStatus: "approved" | "pending" =
      community?.visibility === "public" ? "approved" : "pending";
    setMembershipStatus(nextStatus);
  };

  const handleSelectTab = (k: TabKey) => {
    if (!isOwner && OWNER_ONLY_TABS.includes(k)) {
      k = "apercu";
    }
    if (isOwner && !hasCommunity && LOCKED_WHEN_NO_COMMUNITY.includes(k)) {
      k = "apercu";
    }
    if (!isSelfSpace && k === "achats") {
      k = "apercu";
    }

    const tab = ALLOWED_TABS.includes(k) ? k : "apercu";

    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);

    if (tab !== "demandes") {
      next.delete("sub");
      next.delete("mstatus");
      next.delete("istatus");
    }

    setSearchParams(next, { replace: true });
    setActive(tab);

    if (tab === "demandes" && isAuthenticated) {
      window.dispatchEvent(
        new CustomEvent("fm:community-req-counters:force-refresh"),
      );
    }

    if (tab === "avis" && isAuthenticated) {
      markReviewNotificationsAsSeen().catch(() => {});
      window.dispatchEvent(
        new CustomEvent("fm:community-review-counters:force-refresh"),
      );
    }

    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  };

  const handleLeaveCommunity = async () => {
    if (!community?.id || leaving) return;
    try {
      setLeaving(true);
      await leaveCommunity(community.id);

      setMembershipStatus("none");

      window.dispatchEvent(
        new CustomEvent("fm:toast", {
          detail: {
            title: "Désabonnement réussi",
            message: `Tu as quitté "${community.name}".`,
            tone: "success",
          },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("fm:community-req-counters:force-refresh"),
      );
    } catch {
      window.dispatchEvent(
        new CustomEvent("fm:toast", {
          detail: {
            title: "Erreur",
            message: "Impossible de te désabonner pour le moment.",
            tone: "error",
          },
        }),
      );
    } finally {
      setLeaving(false);
    }
  };

  const handleGoToFeed = () => {
    navigate("/communaute?tab=feed");
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/communaute?tab=communautes");
    }
  };

  if (loading && !community) {
    return <CommunityDetailsSkeleton />;
  }

  const fallbackPost: PostLite = {
    id: "unknown",
    content: loadingPostFromNotif
      ? "Chargement…"
      : "Publication introuvable ou supprimée.",
    author: { name: "Système", avatar: "" },
    createdAt: new Date().toISOString(),
    likes: 0,
    comments: 0,
    media: [],
  };

  const canSeeNotifications = isOwner;
  const showPurchasesTab = isAuthenticated && isSelfSpace;

  const layoutClass = sidebarCollapsed
    ? "pt-2 lg:pt-4 lg:flex lg:gap-3"
    : "pt-2 lg:pt-4 lg:flex lg:gap-6";

  return (
    <>
      <section className="pb-10" key={slug}>
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="pt-3 lg:pt-4 flex items-center">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium text-skin-muted hover:text-skin-base bg-skin-header/60 hover:bg-skin-header/80 ring-1 ring-skin-border/40 shadow-[0_4px_12px_rgba(0,0,0,0.18)] backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              aria-label="Retour aux communautés"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black/5 dark:bg-white/10">
                <ArrowLeft className="w-3.5 h-3.5" />
              </span>
              <span className="hidden xs:inline">Retour</span>
              <span className="xs:hidden">Retour</span>
            </button>
          </div>

          <div className="lg:hidden h-2" />
          <MobileStickyBar
            title={tabLabel(active)}
            onOpenMenu={() => setDrawerOpen(true)}
            topClass="safe-top"
            ownerPendingCount={reqCounters.ownerPending}
            myPendingCount={reqCounters.myPending}
            reviewUnseen={reviewUnseen}
            notificationsUnseen={notifUnseen}
          />
          <div className="lg:hidden h-2" />

          <div className={layoutClass}>
            <CommunityDesktopTabs
              active={active}
              onSelect={handleSelectTab}
              isOwner={isOwner}
              hasCommunity={hasCommunity}
              isSelfSpace={isSelfSpace}
              ownerPendingCount={reqCounters.ownerPending}
              myPendingCount={reqCounters.myPending}
              reviewUnseen={reviewUnseen}
              notificationsUnseen={notifUnseen}
              canSeeNotifications={canSeeNotifications}
              showPurchasesTab={showPurchasesTab}
              onCollapseChange={setSidebarCollapsed}
              onGoToFeed={handleGoToFeed}
            />

            <div className="flex-1 min-w-0">
              <CommunityContentSwitch
                key={`${slug}-${active}`}
                active={active}
                loading={loading}
                error={error}
                isSelfSpace={isSelfSpace}
                community={community}
                isOwner={isOwner}
                isMember={isMember}
                membershipStatus={membershipStatus}
                onVisitorJoin={handleJoinFromDetails}
                requireAuth={requireAuth}
                isAuthenticated={isAuthenticated}
                onVisitorLeave={handleLeaveCommunity}
                visitorLeaving={leaving}
                currentUserId={user?.id ?? null}
              />
            </div>
          </div>
        </div>

        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          active={active}
          onSelect={handleSelectTab}
          isOwner={isOwner}
          canAccessPrivates={canAccessPrivates}
          hasCommunity={hasCommunity}
          isSelfSpace={isSelfSpace}
          ownerPendingCount={reqCounters.ownerPending}
          myPendingCount={reqCounters.myPending}
          reviewUnseen={reviewUnseen}
          notificationsUnseen={notifUnseen}
          canSeeNotifications={isOwner}
          showPurchasesTab={showPurchasesTab}
          onGoToFeed={handleGoToFeed}
        />
      </section>

      {openPostModal ? (
        <CommentsModal
          open={openPostModal}
          onClose={closePostModal}
          post={postFromNotif ?? fallbackPost}
          moderation={{
            canModerate: false,
            postAuthorId: postFromNotif?.author?.id ?? null,
            currentUserId: user?.id ?? null,
          }}
        />
      ) : null}
    </>
  );
}
