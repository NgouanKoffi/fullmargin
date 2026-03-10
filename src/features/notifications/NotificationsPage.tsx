import { Bell, CheckCheck } from "lucide-react";
import { useAuth } from "@core/auth/AuthContext";
import CommentsModal from "@shared/components/feed/modals/CommentsModal";

// IMPORTS MODULAIRES
import { CATEGORY_CONFIG, type NotificationCategory } from "./constants";
import CategorySection from "./CategorySection";
import { useNotificationsData } from "./hooks/useNotificationsData";
import { useNotificationActions } from "./hooks/useNotificationActions";
import { getNotificationTitle, formatDate, getNotificationCategory } from "./hooks/notificationFormats";

export default function NotificationsPage() {
  const { status, user } = useAuth();

  const isAdmin =
    status === "authenticated" &&
    ((user as { role?: string })?.role === "admin" ||
      (Array.isArray(user?.roles) && user.roles.includes("admin")));

  // Data fetching and filtering hook
  const {
    filtered,
    loading,
    filter,
    setFilter,
    categoryFilter,
    setCategoryFilter,
    unreadCount,
    counts,
    markingAll,
    markAsRead,
    markAllAsRead,
  } = useNotificationsData(status);

  // Click handler and post modal logic
  const { handleNotificationClick, modalPost, setModalPost, modalLoading } =
    useNotificationActions(markAsRead);

  // Derive grouped items for the full "all" view
  const groupedList: Record<NotificationCategory, typeof filtered> = {
    all: [],
    community: [],
    marketplace: [],
    courses: [],
    fmmetrix: [],
    finance: [],
    admin: [],
    roles: [],
  };



  filtered.forEach((n) => {
    const cat = getNotificationCategory(n.kind) as NotificationCategory;
    if (groupedList[cat]) {
      groupedList[cat].push(n);
    }
  });

  const categoriesToShow: NotificationCategory[] =
    categoryFilter === "all"
      ? (
          [
            "community",
            "courses",
            "marketplace",
            "fmmetrix",
            "finance",
            "roles",
            ...(isAdmin ? (["admin"] as const) : []),
          ] as NotificationCategory[]
        ).filter((cat) => groupedList[cat] && groupedList[cat].length > 0)
      : [categoryFilter];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm w-full">
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between py-4 sm:py-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 dark:from-white dark:to-slate-200 flex items-center justify-center shadow-md">
                  <Bell className="w-5 h-5 text-white dark:text-slate-900" />
                </div>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Notifications
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
                  {unreadCount > 0 &&
                    ` · ${unreadCount} non lu${unreadCount !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-700 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 shadow-sm whitespace-nowrap"
              >
                <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">
                  {markingAll ? "…" : "Tout lire"}
                </span>
              </button>
            )}
          </div>

          <div className="pb-0">
            <div className="flex gap-1 mb-3">
              {(["all", "unread"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === f
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  {f === "all"
                    ? "Toutes"
                    : `Non lues${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
              {(Object.keys(CATEGORY_CONFIG) as NotificationCategory[])
                .filter((cat) => cat !== "admin" || isAdmin)
                .map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const Icon = cfg.icon;
                  const isActive = categoryFilter === cat;
                  const badgeCount = counts[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border flex-shrink-0 ${
                        isActive
                          ? `bg-gradient-to-r ${cfg.color} text-white border-transparent shadow-md`
                          : `${cfg.bg} ${cfg.border} text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600`
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{cfg.label}</span>
                      {badgeCount > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/25 text-white" : cfg.badge}`}
                        >
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-slate-800 dark:border-t-white animate-spin" />
            <span className="text-sm text-slate-400">Chargement…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {filter === "unread" ? "Tout est lu !" : "Aucune notification"}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {filter === "unread" ? "Vous êtes à jour." : "Revenez plus tard."}
            </p>
          </div>
        ) : categoryFilter !== "all" ? (
          <CategorySection
            category={categoryFilter}
            items={filtered}
            onNotifClick={handleNotificationClick}
            getTitle={getNotificationTitle}
            formatDate={formatDate}
            showHeader={false}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {categoriesToShow.map((cat) => (
              <CategorySection
                key={`all-${cat}`}
                category={cat}
                items={groupedList[cat]}
                onNotifClick={handleNotificationClick}
                getTitle={getNotificationTitle}
                formatDate={formatDate}
                showHeader={true}
                onSeeAll={() => setCategoryFilter(cat)}
                defaultExpanded={false}
              />
            ))}
          </div>
        )}
      </div>

      {modalLoading && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}
      {modalPost && (
        <CommentsModal
          open={true}
          onClose={() => setModalPost(null)}
          post={modalPost}
          moderation={{ canModerate: false }}
        />
      )}
    </div>
  );
}
