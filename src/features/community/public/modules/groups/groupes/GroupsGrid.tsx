// src/pages/communaute/public/sections/groupes/groupes/GroupsGrid.tsx
import {
  Users,
  CalendarClock,
  GraduationCap,
  Globe2,
  PencilLine,
  Trash2,
  Lock,
} from "lucide-react";
import type { PublicGroup, MembershipData } from "./types";

type GroupsGridProps = {
  groups: PublicGroup[];
  memberships: Record<string, MembershipData | undefined>;
  onSelectGroup: (g: PublicGroup) => void;
  onDiscussGroup?: (g: PublicGroup) => void;

  isOwnerView?: boolean;
  onEditGroup?: (g: PublicGroup) => void;
  onDeleteGroup?: (g: PublicGroup) => void;
  deletingId?: string | null;
};

export function GroupsGrid({
  groups,
  memberships,
  onSelectGroup,
  onDiscussGroup,
  isOwnerView = false,
  onEditGroup,
  onDeleteGroup,
  deletingId,
}: GroupsGridProps) {
  return (
    <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {groups.map((g) => (
        <GroupCard
          key={g.id}
          group={g}
          membership={memberships[g.id]}
          onDetails={() => onSelectGroup(g)}
          onDiscuss={onDiscussGroup ? () => onDiscussGroup(g) : undefined}
          isOwnerView={isOwnerView}
          onEdit={onEditGroup ? () => onEditGroup(g) : undefined}
          onDelete={onDeleteGroup ? () => onDeleteGroup(g) : undefined}
          deleting={deletingId === g.id}
        />
      ))}
    </ul>
  );
}

type GroupCardProps = {
  group: PublicGroup;
  membership?: MembershipData;
  onDetails: () => void;
  onDiscuss?: () => void;
  isOwnerView?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
};

function GroupCard({
  group: g,
  membership,
  onDetails,
  onDiscuss,
  isOwnerView = false,
  onEdit,
  onDelete,
  deleting = false,
}: GroupCardProps) {
  const members = g.membersCount ?? 0;
  const courseTitle = g.courseTitle ?? null;
  const createdDate = g.createdAt
    ? new Date(g.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const isMember = membership?.isMember ?? false;
  const isOwner = membership?.isOwner ?? false;

  const visibility = g.visibility === "private" ? "private" : "public";

  return (
    <li className="h-full">
      <article className="group flex h-full flex-col rounded-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-white/90 dark:bg-slate-950/80 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/20 transition-transform duration-200">
        {/* Cover */}
        <div className="relative h-28 md:h-32 overflow-hidden bg-slate-900/70">
          {g.coverUrl ? (
            <img
              src={g.coverUrl}
              alt={g.name}
              className="w-full h-full object-cover transform group-hover:scale-[1.04] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Badges visibilité + accès */}
          <div className="absolute top-2 left-3 flex flex-wrap gap-2">
            {visibility === "private" ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-600/95 text-white shadow-md">
                <Lock className="h-3 w-3 mr-1" />
                Groupe privé
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-600/95 text-white shadow-md">
                <Globe2 className="h-3 w-3 mr-1" />
                Ouvert à tous
              </span>
            )}
          </div>

          <div className="absolute bottom-2 left-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/65 text-white backdrop-blur-sm">
              {g.accessType === "free" ? "Accès libre" : "Accès formation"}
            </span>
          </div>

          {/* Boutons admin */}
          {isOwnerView && (onEdit || onDelete) && (
            <div className="absolute top-2 right-2 flex gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="h-8 w-8 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/70"
                  title="Modifier le groupe"
                >
                  <PencilLine className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  disabled={deleting}
                  className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:opacity-60"
                  title="Supprimer le groupe"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 line-clamp-2">
            {g.name}
          </h3>

          {g.communityName && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Globe2 className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{g.communityName}</span>
            </p>
          )}

          {courseTitle && g.accessType === "course" && (
            <p className="text-[11px] text-violet-600 dark:text-violet-300 flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{courseTitle}</span>
            </p>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {g.description ??
              (g.accessType === "course"
                ? "Réservé aux étudiants d’une formation spécifique."
                : "Ouvert aux membres approuvés de la communauté.")}
          </p>

          {/* Badges + boutons */}
          <div className="mt-3 flex flex-col gap-1">
            {isOwner && (
              <div className="inline-flex items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-medium px-3 py-1">
                Vous êtes l’administrateur
              </div>
            )}

            {isMember && !isOwner && (
              <div className="inline-flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium px-3 py-1">
                Déjà membre
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <button
                type="button"
                onClick={onDetails}
                className="flex-1 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
              >
                Détails
              </button>

              {(isMember || isOwner) && onDiscuss && (
                <button
                  type="button"
                  onClick={onDiscuss}
                  className="flex-1 inline-flex items-center justify-center rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Discuter
                </button>
              )}
            </div>
          </div>

          {/* Footer collé en bas */}
          <div className="mt-auto pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {members} membre{members > 1 ? "s" : ""}
            </span>

            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              {createdDate ? `Créé le ${createdDate}` : "Création inconnue"}
            </span>
          </div>
        </div>
      </article>
    </li>
  );
}
