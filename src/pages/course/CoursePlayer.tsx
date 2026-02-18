// src/pages/communaute/private/community-details/tabs/Formations/CoursePlayer.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Menu,
  X,
  Layers,
  CalendarClock,
  Star as StarIcon,
} from "lucide-react";

import { API_BASE } from "../../lib/api";
import { loadSession } from "../../auth/lib/storage";
import { ReviewsBlock, type Review } from "./ReviewsBlock";

import {
  type CourseSaved,
  type ModuleT,
  type CurriculumItem,
  type Session,
} from "./CoursePlayer/coursePlayerTypes";

import { authHeaders } from "./CoursePlayer/coursePlayerUtils";
import { ModuleSidebar } from "./CoursePlayer/ModuleSidebar";
import { LessonsColumn } from "./CoursePlayer/LessonsColumn";
import { formatRelativeFR } from "./CoursePlayer/dateUtils";
import { ResourceViewer } from "./CoursePlayer/ResourceViewer";
import { RichTextBN } from "./CoursePlayer/RichTextBN";
import {
  getUnseenNotificationsCount,
  markNotificationsAsSeen,
} from "../communaute/private/community-details/services/notifications.service";
import { TABS, type TabKey } from "../communaute/public/tabs.constants";
import { ScrollTabs } from "../communaute/public/components/ScrollTabs";

// 🔥 Menu d'onglets commun (même que sur /communaute)

/* =================== Page principale =================== */

export default function CoursePlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const session = loadSession() as Session;
  const meId: string | undefined = session?.user?._id || session?.user?.id;
  const roles: string[] = session?.user?.roles ?? [];
  const isAdmin = roles.includes("admin");

  const [course, setCourse] = useState<CourseSaved | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const reviewsRef = useRef<HTMLDivElement | null>(null);

  const modules = useMemo<ModuleT[]>(
    () => course?.modules ?? [],
    [course?.modules]
  );
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);

  const isOwner = !!(
    course?.ownerId &&
    meId &&
    String(course.ownerId) === String(meId)
  );

  // compteur global leçons pour stats
  const lessonsCount = useMemo(
    () => modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0),
    [modules]
  );

  // sécuriser index module quand modules changent
  useEffect(() => {
    if (!modules.length) {
      setSelectedModuleIndex(0);
      return;
    }
    if (selectedModuleIndex < 0 || selectedModuleIndex >= modules.length) {
      setSelectedModuleIndex(0);
    }
  }, [modules.length, selectedModuleIndex]);

  const selectedModule =
    modules.length > 0 ? modules[selectedModuleIndex] ?? null : null;

  /* --------- Load course --------- */
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${API_BASE}/communaute/courses/${encodeURIComponent(id || "")}`,
          { headers: { ...authHeaders() }, cache: "no-store" }
        );
        if (!res.ok) throw new Error("Cours introuvable");
        const json = await res.json();
        const data: CourseSaved = json?.data ?? json;
        if (!cancel) setCourse(data);
      } catch {
        if (!cancel) setCourse(null);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  /* --------- Enrollment --------- */
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/communaute/courses/${encodeURIComponent(
            id || ""
          )}/enrollment`,
          { headers: { ...authHeaders() }, cache: "no-store" }
        );
        const j = await res.json().catch(() => ({}));
        if (!cancel) setEnrolled(!!j?.data?.enrolled);
      } catch {
        if (!cancel) setEnrolled(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  /* --------- Reviews --------- */
  useEffect(() => {
    if (!id) return;
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/communaute/courses/${encodeURIComponent(id)}/reviews`,
          { headers: { ...authHeaders() }, cache: "no-store" }
        );
        const j = await res.json().catch(() => ({}));
        const list: Review[] = (j?.data ?? j) || [];
        if (!cancel) setReviews(list);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancel = true;
    };
  }, [id]);

  const handleShowReviews = () => {
    setShowReviews(true);
    setTimeout(() => {
      if (reviewsRef.current) {
        reviewsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 50);
  };

  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  /* --------- plein écran via portail --------- */
  const [fullscreenItem, setFullscreenItem] = useState<CurriculumItem | null>(
    null
  );

  useEffect(() => {
    if (!fullscreenItem) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreenItem]);

  /* --------- Notifications pour le menu --------- */
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    async function loadNotif() {
      try {
        const { count } = await getUnseenNotificationsCount();
        setNotifCount(count);
      } catch {
        setNotifCount(0);
      }
    }
    loadNotif();
  }, []);

  const tabs = useMemo(
    () =>
      TABS.map((t) => ({
        ...t,
        notif: t.key === "feed" ? notifCount : 0,
      })),
    [notifCount]
  );

  const handleTabChange = async (t: TabKey) => {
    // marquer les notifs comme vues pour certains onglets
    const tabsThatClearNotif: TabKey[] = [
      "feed",
      "groupes",
      "direct",
      "formations",
    ];
    if (notifCount > 0 && tabsThatClearNotif.includes(t)) {
      try {
        await markNotificationsAsSeen();
        setNotifCount(0);
      } catch {
        /* ignore */
      }
    }

    // navigation vers la page publique avec le bon tab
    const url = `/communaute?tab=${t}`;
    navigate(url);
  };

  /* =================== UI =================== */

  if (loading) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 sm:py-6">
        <div className="h-48 rounded-2xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse" />
      </main>
    );
  }

  if (!course) {
    return (
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 sm:py-6">
        <div className="max-w-3xl">
          <div className="rounded-xl ring-1 ring-rose-300/60 dark:ring-rose-700/50 bg-rose-50 dark:bg-rose-900/20 p-6 text-rose-700 dark:text-rose-300">
            Cours introuvable
          </div>
          <Link
            to="/communaute"
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-slate-300 dark:ring-slate-600 hover:bg-black/5 dark:hover:bg-white/10 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </div>
      </main>
    );
  }

  const relativeUpdate = formatRelativeFR(course.updatedAt || "");

  const averageRating =
    course.ratingAvg != null
      ? course.ratingAvg
      : reviews.length
      ? reviews.reduce((sum, r: any) => sum + (r.rating || 0), 0) /
        reviews.length
      : null;

  const totalReviews = course.reviewsCount ?? reviews.length;

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 sm:py-6">
      {/* 🔹 MENU D'ONGLETS EN HAUT (même que sur /communaute) */}
      <ScrollTabs
        tabs={tabs}
        active={"formations"}
        onChange={handleTabChange}
      />

      <div className="mt-4">
        {/* En-tête : infos cours (sans photo de couverture) */}
        <div className="relative mb-5">
          {/* bouton programme mobile en haut à droite */}
          <button
            type="button"
            className="lg:hidden absolute top-3 right-3 z-20 inline-flex items-center justify-center rounded-full h-10 w-10 ring-1 ring-slate-300 dark:ring-slate-700 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 shadow-sm"
            onClick={() => setSidebarMobileOpen(true)}
            title="Ouvrir le programme"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 px-5 sm:px-8 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              {/* Titre + description courte */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50">
                  {course.title}
                </h1>

                <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  {course.shortDesc?.trim() ||
                    "Suis la formation directement depuis ton espace FullMargin."}
                </p>
              </div>

              {/* Stats du cours, en badges à droite */}
              <div className="mt-1 md:mt-0 flex flex-wrap gap-2 md:justify-end text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 bg-slate-800 text-white dark:bg-slate-900 dark:text-slate-100">
                  <Layers className="h-4 w-4" />
                  {modules.length} module{modules.length > 1 ? "s" : ""} •{" "}
                  {lessonsCount} leçon{lessonsCount > 1 ? "s" : ""}
                </span>

                {relativeUpdate && (
                  <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 bg-slate-800 text-white dark:bg-slate-900 dark:text-slate-100">
                    <CalendarClock className="h-4 w-4" />
                    {relativeUpdate}
                  </span>
                )}

                {typeof course.enrollmentCount === "number" && (
                  <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 bg-slate-800 text-white dark:bg-slate-900 dark:text-slate-100">
                    👥 {course.enrollmentCount} inscrits
                  </span>
                )}

                {averageRating != null && averageRating > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 bg-amber-500 text-white dark:bg-amber-600 dark:text-white">
                    <StarIcon className="h-4 w-4" />
                    {averageRating.toFixed(1)} / 5 • {totalReviews} avis
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar mobile overlay (avec ANIMATION qui glisse) */}
        {sidebarMobileOpen && (
          <div className="fixed inset-0 z-[9998] bg-black/40 lg:hidden">
            <style>
              {`
              @keyframes fmSlideIn {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
              }
              .fm-slide-in {
                animation: fmSlideIn 0.22s ease-out;
              }
            `}
            </style>

            <div className="absolute inset-y-0 left-0 w-[80%] max-w-xs bg-slate-50 dark:bg-slate-950 shadow-xl p-4 flex flex-col fm-slide-in">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Programme du cours
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarMobileOpen(false)}
                  className="rounded-full h-8 w-8 inline-flex items-center justify-center bg-slate-200/80 dark:bg-slate-800/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <ModuleSidebar
                modules={modules}
                selectedModuleIndex={selectedModuleIndex}
                onSelectModule={(index) => {
                  setSelectedModuleIndex(index);
                  setSidebarMobileOpen(false);
                  setShowReviews(false);
                }}
                onShowReviews={() => {
                  setSidebarMobileOpen(false);
                  handleShowReviews();
                }}
              />
            </div>
          </div>
        )}

        {/* ====== GRID 2 colonnes : PROGRAMME + PLAYER ====== */}
        <div className="grid gap-6 lg:grid-cols-[minmax(260px,320px),minmax(0,1fr)] xl:grid-cols-[minmax(280px,360px),minmax(0,1.6fr)] 2xl:grid-cols-[minmax(300px,380px),minmax(0,2fr)] items-start">
          {/* Colonne gauche : sidebar modules (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <ModuleSidebar
                modules={modules}
                selectedModuleIndex={selectedModuleIndex}
                onSelectModule={(index) => {
                  setSelectedModuleIndex(index);
                  setShowReviews(false);
                }}
                onShowReviews={handleShowReviews}
              />
            </div>
          </aside>

          {/* Colonne droite : HEADER DU MODULE + leçons / avis */}
          <div className="min-w-0 space-y-4">
            {/* 🔸 En-tête du MODULE sélectionné : nom + description détaillée */}
            {!showReviews && selectedModule && (
              <div className="rounded-2xl ring-1 ring-slate-200/80 dark:ring-white/10 bg-white/90 dark:bg-slate-950/70 p-4 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Module sélectionné
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-50">
                  {selectedModule.title || `Module ${selectedModuleIndex + 1}`}
                </h2>

                {selectedModule.description?.trim() && (
                  <div className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <RichTextBN json={selectedModule.description} />
                  </div>
                )}
              </div>
            )}

            {/* Contenu principal */}
            {!showReviews ? (
              <LessonsColumn
                courseId={course.id}
                module={selectedModule}
                onOpenFullscreen={(item) => setFullscreenItem(item)}
              />
            ) : (
              <div ref={reviewsRef}>
                <ReviewsBlock
                  courseId={course.id}
                  isAuthenticated={!!session?.token}
                  isOwner={!!isOwner}
                  isAdmin={!!isAdmin}
                  enrolled={!!enrolled}
                  reviews={reviews}
                  setReviews={setReviews}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== OVERLAY PLEIN ÉCRAN via PORTAL ====== */}
      {fullscreenItem &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 text-slate-100 border-b border-white/10">
              <div className="text-sm font-medium truncate">
                {fullscreenItem.title || course.title}
              </div>
              <button
                type="button"
                onClick={() => setFullscreenItem(null)}
                className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 p-1.5"
                title="Fermer le plein écran"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 relative">
              <LessonsFullscreenViewer
                courseId={course.id}
                item={fullscreenItem}
              />
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}

/**
 * Petit wrapper pour réutiliser ResourceViewer en plein écran
 */
function LessonsFullscreenViewer({
  courseId,
  item,
}: {
  courseId: string;
  item: CurriculumItem;
}) {
  return (
    <ResourceViewer
      courseId={courseId}
      item={item}
      onRequestFullscreen={() => {}}
      fullscreen
    />
  );
}
