// src/pages/communaute/private/community-details/tabs/Formations/CourseList.tsx
import { Link } from "react-router-dom";
import {
  Plus,
  PencilLine,
  Trash2,
  Layers,
  DollarSign,
  CalendarClock,
  Users,
  Link2,
  Lock,
  Eye,
} from "lucide-react";

import type { CourseSavedWithAgg } from "../Formations";
import StarRatingSmall from "./StarRatingSmall";

type CourseListProps = {
  canCreate: boolean;
  loading: boolean;
  error: string | null;
  courses: CourseSavedWithAgg[];
  onNew: () => void;
  onEdit: (c: CourseSavedWithAgg) => void;
  onDeleteCourse: (id: string) => void;
};

// largeur = 100% de la zone centrale, on garde juste l'espacement vertical
const sectionBase = "w-full space-y-4 sm:space-y-5";

export function CourseList({
  canCreate,
  loading,
  error,
  courses,
  onNew,
  onEdit,
  onDeleteCourse,
}: CourseListProps) {
  if (loading) {
    return (
      <section className={sectionBase}>
        <Header canCreate={canCreate} onNew={onNew} />
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/40">
          Chargement…
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={sectionBase}>
        <Header canCreate={canCreate} onNew={onNew} />
        <div className="rounded-2xl ring-1 ring-rose-300 dark:ring-rose-700/60 bg-rose-50 dark:bg-rose-900/20 p-6 text-rose-700 dark:text-rose-300">
          {error}
        </div>
      </section>
    );
  }

  const isEmpty = courses.length === 0;

  return (
    <section className={sectionBase}>
      <Header canCreate={canCreate} onNew={onNew} />

      {isEmpty ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/50">
          {canCreate ? (
            <>
              Aucune formation pour le moment. Clique sur{" "}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                “Nouvelle formation”
              </span>{" "}
              pour commencer.
            </>
          ) : (
            <>Aucune formation publiée pour le moment.</>
          )}
        </div>
      ) : (
        // 👉 2 colonnes dès md, 3 colonnes sur les grands écrans
        <div className="grid gap-5 sm:gap-6 lg:gap-7 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              canCreate={canCreate}
              onEdit={onEdit}
              onDeleteCourse={onDeleteCourse}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Header({
  canCreate,
  onNew,
}: {
  canCreate: boolean;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {canCreate && (
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-violet-600 text-white text-sm font-medium shadow-sm hover:bg-violet-700 hover:shadow-md transition"
          aria-label="Nouvelle formation"
          title="Nouvelle formation"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvelle formation</span>
        </button>
      )}
    </div>
  );
}

function CourseCard({
  course: c,
  canCreate,
  onEdit,
  onDeleteCourse,
}: {
  course: CourseSavedWithAgg;
  canCreate: boolean;
  onEdit: (c: CourseSavedWithAgg) => void;
  onDeleteCourse: (id: string) => void;
}) {
  const modulesCount = (c.modules ?? []).length;
  const lessonsCount = (c.modules ?? []).reduce(
    (n, m) => n + (m.lessons?.length || 0),
    0
  );

  const priceText =
    c.priceType === "free"
      ? "Gratuit"
      : typeof c.price === "number"
      ? `${c.price} ${c.currency || "USD"}`
      : "-";

  const avg = Number(c.ratingAvg || 0);
  const reviewsCount = Number(c.reviewsCount || 0);
  const enrollCount = Number(c.enrollmentCount || 0);

  const visibility = c.visibility === "private" ? "private" : "public";
  const isPrivate = visibility === "private";

  const to = `/communaute/formation/${c.id}`; // route publique

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let url = to;
    if (typeof window !== "undefined") {
      const origin = window.location.origin || "";
      url = origin + to;
    }

    const copy = async () => {
      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard &&
          navigator.clipboard.writeText
        ) {
          await navigator.clipboard.writeText(url);
        }
      } catch {
        /* ignore */
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("fm:toast", {
            detail: {
              title: "Lien copié",
              message:
                "Le lien de la formation a été copié dans le presse-papiers.",
              tone: "success",
            },
          })
        );
      }
    };

    void copy();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(c);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteCourse(c.id);
  };

  const isFree = c.priceType === "free";

  return (
    <Link
      to={to}
      className="group block h-full rounded-3xl overflow-hidden border border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-b from-white/95 via-white/90 to-slate-50/90 dark:from-slate-950/95 dark:via-slate-950/90 dark:to-slate-900/95 shadow-sm hover:shadow-xl hover:shadow-violet-500/20 hover:-translate-y-1 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
    >
      <div className="flex h-full flex-col">
        {/* Cover : légèrement moins haute pour alléger le bloc */}
        <div className="relative h-40 md:h-44 bg-slate-950 overflow-hidden">
          {c.coverUrl ? (
            <img
              src={c.coverUrl}
              alt={c.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500" />
          )}

          {/* gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

          {/* niveau badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/55 text-white backdrop-blur-sm">
              {c.level || "Tous niveaux"}
            </span>
          </div>

          {/* prix badge */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-sm ${
                isFree
                  ? "bg-emerald-500/90 text-white"
                  : "bg-white/90 text-slate-900"
              }`}
            >
              <DollarSign className="h-3.5 w-3.5 mr-0.5" />
              {priceText}
            </span>
          </div>

          {/* visibilité badge */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            {isPrivate ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-900/80 text-white backdrop-blur-sm">
                <Lock className="h-3.5 w-3.5" />
                Réservé aux membres
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/90 text-white backdrop-blur-sm">
                <Eye className="h-3.5 w-3.5" />
                Public
              </span>
            )}
          </div>
        </div>

        {/* Corps */}
        <div className="flex flex-1 flex-col p-4 sm:p-5 space-y-3">
          {/* Titre + résumé */}
          <div className="space-y-1">
            <h3 className="font-semibold leading-tight text-slate-900 dark:text-slate-50 line-clamp-2">
              {c.title || "(Sans titre)"}
            </h3>
            {c.shortDesc && (
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {c.shortDesc}
              </p>
            )}
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
            {/* Note + nb avis */}
            <span className="inline-flex items-center gap-1">
              <StarRatingSmall value={avg} />
              <span className="font-medium">{avg.toFixed(1)}/5</span>
              <span className="opacity-70">({reviewsCount})</span>
            </span>

            {/* Abonnés */}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {enrollCount} abonné{enrollCount > 1 ? "s" : ""}
            </span>

            {/* Modules / Leçons */}
            <span className="inline-flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {modulesCount} modules · {lessonsCount} leçons
            </span>

            {/* Date courte */}
            {c.updatedAt && (
              <span
                className="inline-flex items-center gap-1 opacity-80"
                title={new Date(c.updatedAt).toLocaleString()}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                {new Date(c.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Actions */}
          {/* Actions */}
          <div className="mt-auto pt-3 border-t border-slate-100/80 dark:border-slate-800/80 space-y-2">
            {canCreate ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={handleEdit}
                  className="inline-flex w-full items-center justify-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-slate-900/90 dark:bg-slate-900 text-slate-50 ring-1 ring-slate-700/70 hover:bg-slate-800 transition"
                  title="Modifier la formation"
                >
                  <PencilLine className="h-4 w-4" />
                  Modifier
                </button>

                <button
                  onClick={handleDelete}
                  className="inline-flex w-full items-center justify-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-rose-600/90 text-white ring-1 ring-rose-500/80 hover:bg-rose-600 transition"
                  title="Supprimer la formation"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>

                <button
                  onClick={handleCopyLink}
                  className="inline-flex w-full items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-violet-700/90 text-white ring-1 ring-violet-500/80 hover:bg-violet-700 transition"
                  title="Copier le lien public de la formation"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Lien
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {/* 👉 Nouveau : bouton VOIR + bouton Copier le lien */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Pas de onClick ni de stopPropagation :
                      le clic remontera jusqu'au <Link> parent et ouvrira la formation */}
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-slate-900/90 text-white ring-1 ring-slate-800/80 hover:bg-slate-800 transition"
                    title="Voir la formation"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Voir
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="inline-flex w-full items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-violet-700/90 text-white ring-1 ring-violet-500/80 hover:bg-violet-700 transition"
                    title="Copier le lien public de la formation"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Copier le lien
                  </button>
                </div>

                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Utilise <span className="font-medium">« Voir »</span> pour
                  ouvrir la page de la formation, ou{" "}
                  <span className="font-medium">« Copier le lien »</span> pour
                  la partager.
                </span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
              Clique sur la carte ou sur le bouton{" "}
              <span className="font-medium">« Voir »</span> pour prévisualiser
              la page publique.
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
