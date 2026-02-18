// src/pages/course/course-public/PaymentCard.tsx
import { Link } from "react-router-dom";
import {
  DollarSign,
  ShieldCheck,
  PlayCircle,
  Users,
  Loader2,
} from "lucide-react";

import type { CourseSaved } from "../CourseTypes";
import { RatingStars } from "../RatingStars";

type PaymentCardProps = {
  course: CourseSaved;
  priceText: string;
  displayRating: number;
  totalReviews: number;
  enrolled: boolean;
  playerHref: string;
  isBusy: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  primaryCtaLabel: string;
  onPrimaryCtaClick: () => Promise<void> | void;
};

export function PaymentCard({
  course,
  priceText,
  displayRating,
  totalReviews,
  enrolled,
  playerHref,
  isBusy,
  isOwner,
  isAdmin,
  primaryCtaLabel,
  onPrimaryCtaClick,
}: PaymentCardProps) {
  return (
    <div className="w-full rounded-2xl ring-1 ring-slate-200/70 dark:ring-slate-700/60 p-5 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 text-slate-50 shadow-xl">
      {/* Prix */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">Prix de la formation</span>
        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold bg-slate-800/80 ring-1 ring-slate-700/80">
          <DollarSign className="h-4 w-4" />
          {priceText}
        </span>
      </div>

      {/* Rating étoiles */}
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

      {/* CTA principal */}
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
          disabled={isBusy || isOwner || isAdmin}
          onClick={async () => {
            await onPrimaryCtaClick();
          }}
          className={[
            "mt-5 w-full inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-150 hover:-translate-y-0.5",
            course.priceType === "free"
              ? "bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/30"
              : "bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600 shadow-xl shadow-violet-500/35",
            (isBusy || isOwner || isAdmin) &&
              "opacity-60 cursor-not-allowed hover:translate-y-0",
          ].join(" ")}
          title={
            isOwner
              ? "Vous êtes l’auteur de cette formation"
              : isAdmin
              ? "Administrateur"
              : undefined
          }
        >
          {isBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />}
          <span>{primaryCtaLabel}</span>
        </button>
      )}

      {course.priceType === "paid" && !enrolled && !isOwner && !isAdmin && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Paiement sécurisé • Accès immédiat après validation
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          Dernière mise à jour :{" "}
          {new Date(course.updatedAt).toLocaleDateString()}
        </span>
        {typeof course.enrollmentCount === "number" && (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {course.enrollmentCount} inscrits
          </span>
        )}
      </div>
    </div>
  );
}
