// src/pages/communaute/public/sections/Formations.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Star, Users, Search, Lock } from "lucide-react";
import { API_BASE } from "../../../../lib/api";
import { loadSession } from "../../../../auth/lib/storage";
import { useAuth } from "../../../../auth/AuthContext";

/* ---------- Types ---------- */

type CourseLite = {
  id: string;
  title: string;
  coverUrl?: string;
  shortDesc?: string;
  priceType: "free" | "paid";
  currency?: string;
  price?: number;
  enrollmentCount?: number;
  ratingAvg?: number | null;
  reviewsCount?: number;
  communityId?: string | null;
  communityName?: string; // 👈 NOM DE LA COMMUNAUTÉ (front)
  communitySlug?: string; // 👈 SLUG (si besoin plus tard)
  authorName?: string;
  authorAvatar?: string;
  level?: string;
  visibility?: "public" | "private";
  /** vrai si l’utilisateur est inscrit à cette formation */
  isEnrolled?: boolean;

  /** Date de création de la formation (ISO) – utilisé pour les filtres admin */
  createdAt?: string;
};

type ApiCourse = {
  id?: string;
  _id?: string;
  title?: string;
  coverUrl?: string;
  shortDesc?: string;
  priceType?: "free" | "paid";
  currency?: string;
  price?: number;
  enrollmentCount?: number;
  ratingAvg?: number | null;
  reviewsCount?: number;
  communityId?: string | null;
  communityName?: string; // 👈 NOM DE LA COMMU (vient du backend)
  communitySlug?: string; // 👈 SLUG (vient du backend)
  ownerName?: string;
  ownerAvatar?: string;
  level?: string;
  visibility?: "public" | "private";
  enrolled?: boolean; // au cas où tu l’ajoutes un jour

  /** champ API pour la date de création */
  createdAt?: string;
};

type ApiCoursesResponse = {
  ok?: boolean;
  data?: { items?: ApiCourse[] };
  error?: string;
};

type ApiEnrollmentCourse = {
  id?: string;
};

type ApiEnrollmentRow = {
  id?: string;
  enrolledAt?: string | null;
  course?: ApiEnrollmentCourse | null;
};

type ApiEnrollmentsResponse = {
  ok?: boolean;
  data?: { items?: ApiEnrollmentRow[] };
  error?: string;
};

type Session = { token?: string } | null;

function authHeaders(): HeadersInit {
  const t = (loadSession() as Session)?.token ?? "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

type CoursesTab = "mine" | "all";

/** Props optionnelles pour filtrer par période (admin) */
type TabFormationsProps = {
  /** Date min (incluse), format YYYY-MM-DD */
  filterFrom?: string;
  /** Date max (incluse), format YYYY-MM-DD */
  filterTo?: string;
};

/* ---------- ⭐ Etoiles ---------- */
function RatingStars({
  value,
  size = "sm",
}: {
  value: number | null | undefined;
  size?: "sm" | "md";
}) {
  const v = Math.max(0, Math.min(5, value ?? 0));
  const base = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const index = i + 1;
        const filled = v >= index - 0.25;
        return (
          <Star
            key={index}
            className={`${base} transition-transform ${
              filled
                ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.9)] scale-[1.02]"
                : "text-slate-400/70 dark:text-slate-500"
            }`}
          />
        );
      })}
    </div>
  );
}

/* ---------- Skeleton ---------- */
function ShimmerCard() {
  return (
    <li className="rounded-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-white/80 dark:bg-slate-900/80">
      <div className="fm-shimmer h-40 w-full" />
      <div className="p-4 space-y-3">
        <div className="fm-shimmer h-4 w-3/4 rounded" />
        <div className="fm-shimmer h-3 w-full rounded" />
        <div className="fm-shimmer h-3 w-5/6 rounded" />
        <div className="flex items-center justify-between pt-2">
          <div className="fm-shimmer h-6 w-28 rounded-full" />
          <div className="fm-shimmer h-4 w-16 rounded" />
        </div>
      </div>
    </li>
  );
}

/* ---------- Helper période ---------- */
function isInDateRange(
  dateStr: string | undefined,
  from?: string,
  to?: string
): boolean {
  // aucun filtre = tout passe
  if (!from && !to) return true;
  if (!dateStr) return false;

  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return false;

  if (from) {
    const fromT = new Date(from + "T00:00:00Z").getTime();
    if (t < fromT) return false;
  }
  if (to) {
    const toT = new Date(to + "T23:59:59Z").getTime();
    if (t > toT) return false;
  }
  return true;
}

/* =========================================================
 *  TabFormations avec Mes formations / Toutes les formations
 *  + filtre global période (filterFrom / filterTo)
 * ========================================================= */
export function TabFormations({
  filterFrom,
  filterTo,
}: TabFormationsProps = {}) {
  const { status } = useAuth();
  const isAuthenticated = status === "authenticated";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CourseLite[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [minRating, setMinRating] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<CoursesTab>("mine");

  /* ---------- Fetch formations + inscriptions ---------- */
  useEffect(() => {
    let cancel = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = authHeaders();

        const [coursesRes, enrollmentsRes] = await Promise.all([
          fetch(`${API_BASE}/communaute/courses?all=1`, { headers }),
          isAuthenticated
            ? fetch(`${API_BASE}/communaute/courses/me/enrollments`, {
                headers,
              })
            : Promise.resolve(null),
        ]);

        if (!coursesRes.ok) {
          throw new Error("Impossible de charger les formations.");
        }

        const jsonCourses =
          (await coursesRes.json()) as ApiCoursesResponse | null;

        if (!jsonCourses || jsonCourses.ok === false) {
          throw new Error(
            jsonCourses?.error || "Erreur de chargement des formations."
          );
        }

        const items = jsonCourses.data?.items ?? [];

        // Set des IDs de cours où l’utilisateur est inscrit
        const enrolledCourseIds = new Set<string>();
        if (enrollmentsRes && enrollmentsRes.ok) {
          const jsonEnroll =
            (await enrollmentsRes.json()) as ApiEnrollmentsResponse | null;
          if (jsonEnroll?.ok !== false && jsonEnroll?.data?.items) {
            for (const row of jsonEnroll.data.items) {
              const cid = row.course?.id;
              if (cid) enrolledCourseIds.add(String(cid));
            }
          }
        }

        const list: CourseLite[] = items.map((r) => {
          const idSrc = r.id || r._id || "";
          const idStr = String(idSrc);
          const enrolledFromList = r.enrolled === true;
          const enrolledFromMe = enrolledCourseIds.has(idStr);

          return {
            id: idStr,
            title: r.title || "Formation",
            coverUrl: r.coverUrl || "",
            shortDesc: r.shortDesc || "",
            priceType: r.priceType === "paid" ? "paid" : "free",
            currency: r.currency || "USD",
            price: typeof r.price === "number" ? r.price : undefined,
            enrollmentCount: r.enrollmentCount ?? 0,
            ratingAvg:
              typeof r.ratingAvg === "number" || r.ratingAvg === null
                ? r.ratingAvg
                : null,
            reviewsCount: r.reviewsCount ?? 0,
            communityId: r.communityId ? String(r.communityId) : null,
            communityName: r.communityName || "", // 👈 on stocke le nom
            communitySlug: r.communitySlug || "", // 👈 et le slug si besoin
            authorName: r.ownerName || "",
            authorAvatar: r.ownerAvatar || "",
            level: r.level || "Tous niveaux",
            visibility: r.visibility === "private" ? "private" : "public",
            isEnrolled: enrolledFromList || enrolledFromMe,
            createdAt: r.createdAt,
          };
        });

        if (!cancel) setRows(list);
      } catch (e) {
        if (!cancel)
          setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [isAuthenticated]);

  const hasCourses = rows.length > 0;

  /* ---------- Filtrage global (texte + note + période) ---------- */
  const filteredAll = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesText =
        !s ||
        r.title.toLowerCase().includes(s) ||
        (r.shortDesc || "").toLowerCase().includes(s);

      const ratingValue = r.ratingAvg ?? 0;
      const matchesRating = !minRating || ratingValue >= minRating;

      const matchesDate = isInDateRange(r.createdAt, filterFrom, filterTo);

      return matchesText && matchesRating && matchesDate;
    });
  }, [rows, q, minRating, filterFrom, filterTo]);

  // Mes formations = sous-ensemble des filtrées où l’utilisateur est inscrit
  const filteredMine = useMemo(
    () => filteredAll.filter((r) => r.isEnrolled),
    [filteredAll]
  );

  const hasFilteredAll = filteredAll.length > 0;
  const hasFilteredMine = filteredMine.length > 0;
  const searchActive = q.trim().length > 0;

  const coursesToDisplay = activeTab === "mine" ? filteredMine : filteredAll;
  const hasFilteredCurrent = coursesToDisplay.length > 0;

  /* ---------- Auto-switch de tab quand on cherche ---------- */
  useEffect(() => {
    if (!searchActive) return;

    if (activeTab === "mine" && !hasFilteredMine && hasFilteredAll) {
      setActiveTab("all");
    } else if (activeTab === "all" && !hasFilteredAll && hasFilteredMine) {
      setActiveTab("mine");
    }
  }, [searchActive, activeTab, hasFilteredMine, hasFilteredAll]);

  const showNoCourseAtAll = !loading && !error && !hasCourses;

  const showEmptyMineNoSearch =
    !loading &&
    !error &&
    hasCourses &&
    activeTab === "mine" &&
    !searchActive &&
    !hasFilteredMine;

  const showNoResultCurrent =
    !loading && !error && hasCourses && searchActive && !hasFilteredCurrent;

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* shimmer styles */}
      <style>{`
        @keyframes fmShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .fm-shimmer {
          background-image: linear-gradient(
            90deg,
            rgba(148, 163, 184, 0.15),
            rgba(148, 163, 184, 0.45),
            rgba(148, 163, 184, 0.15)
          );
          background-size: 200% 100%;
          animation: fmShimmer 1.4s ease-in-out infinite;
        }
      `}</style>

      {/* Header / recherche / filtre */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex items-center gap-2">
          <Layers className="h-5 w-5 text-violet-500" />
          <h2 className="text-lg font-semibold">Formations</h2>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full md:w-auto">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 opacity-60" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une formation…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 focus:outline-none focus:ring-2 focus:ring-violet-500/70"
            />
          </div>

          <select
            value={minRating ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setMinRating(v ? Number(v) : null);
            }}
            className="w-full sm:w-44 text-xs sm:text-sm rounded-lg border border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/70"
          >
            <option value="">Toutes les notes</option>
            <option value="4">Note ≥ 4 ⭐</option>
            <option value="3">Note ≥ 3 ⭐</option>
            <option value="2">Note ≥ 2 ⭐</option>
          </select>
        </div>
      </div>

      {/* Tabs Mes formations / Toutes les formations */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        {/* une seule ligne, scroll horizontal si besoin */}
        <div className="flex flex-nowrap gap-4 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("mine")}
            className={`relative px-2 pb-2 text-sm font-medium transition sm:px-3 whitespace-nowrap flex-none ${
              activeTab === "mine"
                ? "text-violet-600 dark:text-violet-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Mes formations
            {activeTab === "mine" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`relative px-2 pb-2 text-sm font-medium transition sm:px-3 whitespace-nowrap flex-none ${
              activeTab === "all"
                ? "text-violet-600 dark:text-violet-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Toutes les formations
            {activeTab === "all" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet-500" />
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </ul>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl ring-1 ring-rose-300/70 dark:ring-rose-800/60 bg-rose-50 dark:bg-rose-900/20 p-4 text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Aucun cours du tout */}
      {showNoCourseAtAll && (
        <div className="rounded-xl ring-1 ring-black/10 dark:ring-white/10 p-4 text-sm text-slate-600 dark:text-slate-300">
          Aucune formation n’est encore disponible pour le moment.
        </div>
      )}

      {/* Mes formations vide (sans recherche) */}
      {showEmptyMineNoSearch && (
        <div className="rounded-xl ring-1 ring-black/10 dark:ring-white/10 p-4 text-sm text-slate-600 dark:text-slate-300">
          Tu n’es encore inscrit à aucune formation.
          <br />
          Parcours l’onglet{" "}
          <span className="font-semibold">Toutes les formations</span> pour
          trouver celles qui t’intéressent.
        </div>
      )}

      {/* Aucun résultat pour la recherche dans l’onglet courant */}
      {showNoResultCurrent && (
        <div className="rounded-xl ring-1 ring-black/10 dark:ring-white/10 p-4 text-sm text-slate-600 dark:text-slate-300">
          Aucune formation ne correspond à ta recherche dans cet onglet.
        </div>
      )}

      {/* Grid */}
      {!loading && !error && hasFilteredCurrent && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {coursesToDisplay.map((c) => (
            <li
              key={c.id}
              className="group flex flex-col rounded-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-white/90 dark:bg-slate-950/80 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/20 transition-transform duration-200"
            >
              <Link
                to={`/communaute/formation/${encodeURIComponent(c.id)}`}
                className="flex flex-col h-full"
              >
                {/* Cover */}
                <div className="relative aspect-[16/9] bg-black/5 dark:bg-slate-900/80 overflow-hidden">
                  {c.coverUrl ? (
                    <img
                      src={c.coverUrl}
                      alt={c.title}
                      className="w-full h-full object-cover transform group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Niveau + badge privé */}
                  <div className="absolute left-3 bottom-2 flex flex-col gap-1 text-[11px]">
                    {c.level && (
                      <span className="inline-flex items-center rounded-full bg-black/60 text-white px-2 py-0.5">
                        {c.level}
                      </span>
                    )}

                    {c.visibility === "private" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/80 bg-black/70 text-amber-200 px-2 py-0.5 shadow-sm">
                        <Lock className="h-3 w-3" />
                        Réservé abonnés
                      </span>
                    )}
                  </div>

                  {/* Prix */}
                  <div className="absolute right-3 bottom-2">
                    <span className="inline-flex items-center rounded-full bg-violet-600/95 text-[11px] font-semibold text-white px-2.5 py-1 shadow-lg">
                      {c.priceType === "free"
                        ? "Gratuit"
                        : `${(c.price ?? 0).toFixed(2)} ${(
                            c.currency || "USD"
                          ).toUpperCase()}`}
                    </span>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  {/* Titre */}
                  <div className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-50 line-clamp-2">
                    {c.title}
                  </div>

                  {/* Short desc */}
                  {c.shortDesc ? (
                    <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {c.shortDesc}
                    </div>
                  ) : null}

                  {/* Auteur + communauté (COMMUNAUTÉ D'ABORD) */}
                  {/* Auteur + communauté façon "L'Essentiel Financier / par ..." */}
                  <div className="flex items-center justify-between pt-1 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {c.authorAvatar ? (
                        <img
                          src={c.authorAvatar}
                          alt={c.authorName || c.communityName || "Formateur"}
                          className="h-8 w-8 rounded-full object-cover border border-black/10 dark:border-white/10"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-700 dark:text-slate-100">
                          {(c.communityName || c.authorName || "F")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="flex flex-col min-w-0">
                        {/* Ligne 1 : nom (comme sur ta capture) */}
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                          {c.communityName || c.title}
                        </span>

                        {/* Ligne 2 : "par ..." */}
                        <span className="text-[11px] text-slate-500 dark:text-slate-300 truncate">
                          {c.authorName
                            ? `par ${c.authorName}`
                            : c.communityName
                            ? `par ${c.communityName}`
                            : "Formation FullMargin"}
                        </span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-100 flex-shrink-0">
                      <RatingStars value={c.ratingAvg} />
                      <span>{c.ratingAvg ? c.ratingAvg.toFixed(1) : "—"}</span>
                      {c.reviewsCount ? (
                        <span className="opacity-70">({c.reviewsCount})</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-auto flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Users className="h-3.5 w-3.5 opacity-70" />
                      <span>
                        {c.enrollmentCount ?? 0} inscrit
                        {(c.enrollmentCount ?? 0) > 1 ? "s" : ""}
                      </span>
                    </div>
                    {c.communityName && (
                      <span className="text-slate-500/80 dark:text-slate-400 text-[11px] truncate max-w-[120px] text-right">
                        {c.communityName}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TabFormations;
