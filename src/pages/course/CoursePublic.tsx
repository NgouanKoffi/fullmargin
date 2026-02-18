// src/pages/course/CoursePublic.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Layers,
  DollarSign,
  ShieldCheck,
  PlayCircle,
  Users,
  Loader2,
  CalendarClock,
  Star as StarIcon,
  Lock,
  ArrowLeft,
} from "lucide-react";

import { ReviewsBlock } from "./ReviewsBlock";
import { RatingStars } from "./RatingStars";
import { CourseDescription } from "./CourseDescription";

// 🔹 Barre d'onglets communauté
import { ScrollTabs } from "../communaute/public/components/ScrollTabs";
import { TABS, type TabKey } from "../communaute/public/tabs.constants";

import { useCoursePublicPage } from "./CoursePublic/useCoursePublicPage";

// 🔹 Sidebar communauté
import CommunityDesktopTabs from "../communaute/private/community-details/layout/CommunityDesktopTabs";
import type { TabKey as CommunityTabKey } from "../communaute/private/community-details/types";
import { fetchMyCommunity } from "../communaute/private/community-details/services/community.service";
import { getUnseenNotificationsCount } from "../communaute/private/community-details/services/notifications.service";

type CourseCommunityMeta = {
  visibility?: "public" | "private";
  communityName?: string;
  communitySlug?: string;
  communityIsMember?: boolean;
  communityIsOwner?: boolean;
  community?: {
    id?: string;
    name?: string;
    slug?: string;
    logoUrl?: string;
    coverUrl?: string;
    isMember?: boolean;
    isOwner?: boolean;
  };
};

export default function CoursePublic() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    loading,
    error,
    course,
    isAuthenticated,
    isAdmin,
    isOwner,
    modulesCount,
    lessonsCount,
    priceText,
    reviews,
    setReviews,
    displayRating,
    totalReviews,
    enrolled,
    membershipError,
    isBusy,
    primaryCtaLabel,
    primaryCtaClick,
    playerHref,
  } = useCoursePublicPage(id, navigate);

  /* ---------- Navigation onglets communauté ---------- */
  const communityTabs = TABS;
  const activeTab: TabKey = "formations";

  const handleTabChange = (t: TabKey) => {
    if (t === "formations") return;
    navigate(`/communaute?tab=${t}`);
  };

  /* ---------- Sidebar communauté ---------- */
  const [hasCommunity, setHasCommunity] = useState(false);
  const [myCommunitySlug, setMyCommunitySlug] = useState<string | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const showSidebar = isAuthenticated;

  useEffect(() => {
    if (!showSidebar) {
      setHasCommunity(false);
      setMyCommunitySlug(null);
      return;
    }
    let cancel = false;
    async function loadCommunity() {
      try {
        const data = await fetchMyCommunity();
        if (cancel) return;
        if (data && data.id) {
          setHasCommunity(true);
          setMyCommunitySlug(data.slug ?? null);
        } else {
          setHasCommunity(false);
          setMyCommunitySlug(null);
        }
      } catch {
        if (cancel) return;
        setHasCommunity(false);
        setMyCommunitySlug(null);
      }
    }
    loadCommunity();
    return () => {
      cancel = true;
    };
  }, [showSidebar]);

  useEffect(() => {
    if (!showSidebar) {
      setNotifCount(0);
      return;
    }
    async function loadNotif() {
      try {
        const { count } = await getUnseenNotificationsCount();
        setNotifCount(count);
      } catch {
        setNotifCount(0);
      }
    }
    loadNotif();
  }, [showSidebar]);

  const handleSidebarSelect = (k: CommunityTabKey) => {
    if (hasCommunity && myCommunitySlug) {
      navigate(`/communaute/${myCommunitySlug}?tab=${k}`);
    } else {
      navigate(`/communaute/mon-espace?tab=${k}`);
    }
  };

  /* ---------- Loading / Error ---------- */
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="w-full px-4 py-10 text-center">
        <div className="rounded-xl ring-1 ring-rose-400/70 bg-rose-950/10 p-6 text-rose-700">
          <h1 className="text-lg font-semibold">Cours introuvable</h1>
          <p className="text-sm mt-1">
            La formation que tu cherches n&apos;existe pas ou n&apos;est plus
            disponible.
          </p>
        </div>
      </div>
    );
  }

  const c = course as CourseCommunityMeta;
  const lastUpdate = course.updatedAt
    ? new Date(course.updatedAt).toLocaleDateString()
    : "";
  const communityName = c.communityName ?? c.community?.name ?? "";
  const communitySlug = c.communitySlug ?? c.community?.slug ?? "";

  const membershipLocked =
    c.visibility === "private" &&
    !enrolled &&
    !isOwner &&
    !isAdmin &&
    !c.communityIsMember;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/communaute?tab=formations");
    }
  };

  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-4">
        <ScrollTabs
          tabs={communityTabs}
          active={activeTab}
          onChange={handleTabChange}
        />
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pb-10">
        <div
          className={
            showSidebar
              ? "mt-4 lg:grid lg:grid-cols-[auto,minmax(0,1fr)] lg:gap-6 xl:gap-8"
              : "mt-4"
          }
        >
          {showSidebar && (
            <div className="hidden lg:block lg:self-start">
              <CommunityDesktopTabs
                active={"apercu"}
                onSelect={handleSidebarSelect}
                isOwner={true}
                hasCommunity={hasCommunity}
                ownerPendingCount={0}
                myPendingCount={0}
                reviewUnseen={0}
                notificationsUnseen={notifCount}
                canSeeNotifications={true}
              />
            </div>
          )}

          <section className="min-w-0 mt-2 lg:mt-0 w-full px-2 sm:px-3 lg:px-4 xl:px-6 py-4 space-y-4 overflow-x-hidden break-words">
            <div className="mb-2">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour</span>
              </button>
            </div>

            <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,2fr),minmax(320px,1fr)]">
              <div className="min-w-0 space-y-4 break-words">
                <div className="rounded-2xl ring-1 ring-slate-200/70 dark:ring-slate-700/70 bg-slate-950/70 overflow-hidden flex flex-col md:flex-row">
                  {course.coverUrl && (
                    <div className="md:w-5/12 bg-slate-900/80 flex items-center justify-center p-4">
                      <img
                        src={course.coverUrl}
                        alt={course.title}
                        className="max-h-44 w-auto object-contain rounded-xl"
                      />
                    </div>
                  )}

                  <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center space-y-3">
                    <div>
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-slate-50 break-words">
                        {course.title}
                      </h1>
                      {course.level && (
                        <p className="mt-1 text-sm text-slate-300">
                          Niveau : {course.level}
                        </p>
                      )}
                      {communityName && (
                        <p className="mt-1 text-xs text-slate-400">
                          Communauté :{" "}
                          <button
                            onClick={() =>
                              communitySlug
                                ? navigate(
                                    `/communaute/${communitySlug}?tab=apercu`,
                                  )
                                : navigate("/communaute")
                            }
                            className="font-semibold text-violet-300 hover:text-violet-200 underline-offset-2 hover:underline"
                          >
                            {communityName}
                          </button>
                        </p>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-4 w-4" />
                        {modulesCount} module{modulesCount > 1 ? "s" : ""} •{" "}
                        {lessonsCount} leçon{lessonsCount > 1 ? "s" : ""}
                      </span>
                      {lastUpdate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-4 w-4" />
                          MàJ : {lastUpdate}
                        </span>
                      )}
                      {typeof course.enrollmentCount === "number" && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.enrollmentCount} inscrit
                          {course.enrollmentCount > 1 ? "s" : ""}
                        </span>
                      )}
                      {displayRating > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-amber-400" />
                          {displayRating.toFixed(1)} / 5 ({totalReviews})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="break-words">
                  <CourseDescription
                    shortDesc={course.shortDesc}
                    description={course.description}
                  />
                </div>

                <ReviewsBlock
                  courseId={course.id}
                  isAuthenticated={isAuthenticated}
                  isOwner={isOwner}
                  isAdmin={isAdmin}
                  enrolled={enrolled}
                  reviews={reviews}
                  setReviews={setReviews}
                />
              </div>

              <aside className="space-y-6">
                <div className="w-full rounded-2xl ring-1 ring-slate-200/70 dark:ring-slate-700/60 p-5 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 text-slate-50 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      Prix de la formation
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold bg-slate-800/80 ring-1 ring-slate-700/80">
                      <DollarSign className="h-4 w-4" />
                      {priceText}
                    </span>
                  </div>

                  {displayRating > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RatingStars value={displayRating} />
                        <span className="text-xs font-semibold text-amber-200">
                          {displayRating.toFixed(1)}/5
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {totalReviews} avis
                      </span>
                    </div>
                  )}

                  {enrolled ? (
                    <Link
                      to={playerHref}
                      className="mt-5 w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/30"
                    >
                      <PlayCircle className="h-4 w-4 mr-1.5" />
                      Suivre la formation
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={async () => {
                        await primaryCtaClick();
                      }}
                      className={[
                        "mt-5 w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-150",
                        course.priceType === "free"
                          ? "bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/30"
                          : "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600 shadow-xl shadow-violet-500/35",
                        isBusy &&
                          "opacity-60 cursor-not-allowed hover:translate-y-0",
                        !isBusy && "hover:-translate-y-0.5",
                      ].join(" ")}
                    >
                      {isBusy && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                      )}
                      <span>{primaryCtaLabel}</span>
                    </button>
                  )}

                  {(membershipLocked || membershipError) && (
                    <div className="mt-4 rounded-xl border border-rose-500/80 bg-rose-900/45 px-4 py-3 text-xs sm:text-sm text-rose-50">
                      <div className="flex items-start gap-2">
                        <Lock className="h-4 w-4 mt-0.5" />
                        <div>
                          <p className="font-semibold">Accès restreint</p>
                          <p className="opacity-90">
                            {membershipError ||
                              `Abonnez-vous à "${communityName}" pour accéder.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {course.priceType === "paid" &&
                    !enrolled &&
                    !isOwner &&
                    !isAdmin && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        Paiement sécurisé • Accès immédiat après validation
                      </div>
                    )}

                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                    <span>MàJ : {lastUpdate}</span>
                    {typeof course.enrollmentCount === "number" && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {course.enrollmentCount} inscrit
                        {course.enrollmentCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
