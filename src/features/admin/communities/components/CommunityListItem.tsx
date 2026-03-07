// src/features/admin/communities/components/CommunityListItem.tsx
import { Eye, AlertTriangle, Trash2, Mail } from "lucide-react";
import { RefreshCw } from "lucide-react";
import type { CommunityItem, CourseItem } from "../types";

type Stat = { label: string; value: number; icon: React.ElementType };

type Props = {
  title: string;
  subtitle: string;
  email?: string;
  date: string;
  imageUrl?: string;
  icon: React.ElementType;
  viewUrl: string;
  stats: Stat[];
  status?: string;
  deletedAt?: string | null;
  warningCount?: number;
  onDelete: () => void;
  onWarning?: () => void;
  onApproveDeletion?: () => void;
  onApproveRestoration?: () => void;
};

export function CommunityListItem({
  title, subtitle, email, date, imageUrl, icon: Icon,
  viewUrl, stats, status, deletedAt, warningCount,
  onDelete, onWarning, onApproveDeletion, onApproveRestoration,
}: Props) {
  const formattedDate = new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="group flex flex-col xl:flex-row xl:items-center justify-between p-4 rounded-2xl bg-skin-surface border border-skin-border/30 shadow-sm hover:shadow-md hover:border-violet-500/30 transition gap-4">
      {/* ── Infos ── */}
      <div className="flex items-center gap-4 min-w-0 w-full xl:w-auto flex-1">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="w-14 h-14 rounded-xl object-cover ring-1 ring-skin-border/20 shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center shrink-0 ring-1 ring-skin-border/20">
            <Icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-skin-base truncate mb-1" title={title}>{title}</p>

          <div className="text-xs text-skin-muted mb-2 flex items-center gap-1.5 flex-wrap">
            <span className="truncate max-w-[200px] sm:max-w-xs">{subtitle}</span>
            <span className="opacity-50">•</span>
            <span>Créé le {formattedDate}</span>
            {email && (
              <>
                <span className="opacity-50">•</span>
                <a
                  href={`mailto:${email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:underline font-medium"
                >
                  <Mail className="w-3 h-3" />{email}
                </a>
              </>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {stats.map((s) => {
              const StatIcon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-skin-inset ring-1 ring-skin-border/30 text-[11px] font-medium text-skin-base">
                  <StatIcon className="w-3 h-3 text-violet-500" />
                  {s.value} {s.label}
                </div>
              );
            })}
            {status === "deletion_requested" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[11px] font-medium ring-1 ring-inset ring-orange-600/20">
                Demande de suppression
              </span>
            )}
            {deletedAt && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[11px] font-medium ring-1 ring-inset ring-red-600/20">
                Supprimée ({status})
              </span>
            )}
            {!!warningCount && warningCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-[11px] font-medium ring-1 ring-inset ring-amber-600/20">
                <AlertTriangle className="w-3 h-3" />
                {warningCount} Avertissements
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 shrink-0 self-start xl:self-auto w-full xl:w-auto justify-end flex-wrap">
        <a href={viewUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-skin-base bg-skin-surface border border-skin-border/40 rounded-xl hover:bg-skin-inset transition shadow-sm">
          <Eye className="w-4 h-4" /> Voir
        </a>

        {onWarning && !deletedAt && (
          <button onClick={onWarning} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition shadow-sm">
            <AlertTriangle className="w-4 h-4" /> Avertir
          </button>
        )}

        {status === "deletion_requested" && onApproveDeletion && (
          <button onClick={onApproveDeletion} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm">
            <Trash2 className="w-4 h-4" /> Approuver suppression
          </button>
        )}

        {deletedAt && onApproveRestoration && (
          <button onClick={onApproveRestoration} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition shadow-sm">
            <RefreshCw className="w-4 h-4" /> Restaurer
          </button>
        )}

        {!deletedAt && status !== "deletion_requested" && (
          <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl hover:bg-red-100 shadow-sm">
            <Trash2 className="w-4 h-4" /> Suspendre
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Factory helpers pour éviter la répétition dans index.tsx ──────────────

export function communityItemProps(
  c: CommunityItem,
  callbacks: {
    onDelete: (id: string) => void;
    onWarning: (id: string, name: string) => void;
    onApproveDeletion: (c: CommunityItem) => void;
    onApproveRestoration: (c: CommunityItem) => void;
  }
): Omit<React.ComponentProps<typeof CommunityListItem>, "icon"> {
  const id = c.id || String(c._id ?? "");
  return {
    title: c.name,
    subtitle: `Gérée par ${c.owner?.fullName || "Inconnu"}`,
    email: c.owner?.email,
    date: c.createdAt || new Date().toISOString(),
    imageUrl: c.logoUrl,
    viewUrl: `/communaute/${c.slug}`,
    status: c.status,
    deletedAt: c.deletedAt,
    warningCount: c.warningCount,
    stats: [
      { label: "Membres", value: c.membersCount || 0, icon: () => null },
      { label: "Posts", value: c.postsCount || 0, icon: () => null },
    ],
    onDelete: () => callbacks.onDelete(id),
    onWarning: () => callbacks.onWarning(id, c.name),
    onApproveDeletion: () => callbacks.onApproveDeletion(c),
    onApproveRestoration: () => callbacks.onApproveRestoration(c),
  };
}

export function courseItemProps(
  c: CourseItem,
  onDelete: (id: string) => void
): Omit<React.ComponentProps<typeof CommunityListItem>, "icon"> {
  return {
    title: c.title,
    subtitle: `Créée par ${c.ownerName || "Inconnu"} • ${c.priceType === "paid" ? "Payant" : "Gratuit"}`,
    email: c.ownerEmail || c.owner?.email,
    date: c.createdAt,
    imageUrl: c.coverUrl,
    viewUrl: c.communitySlug ? `/communaute/formation/${c.id}` : "#",
    stats: [{ label: "Inscrits", value: c.enrollmentCount || 0, icon: () => null }],
    onDelete: () => onDelete(c.id),
  };
}
