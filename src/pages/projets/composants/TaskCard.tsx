import { useMemo } from "react";
import { CalendarDays, CheckCircle2, MoreHorizontal, Eye } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Dropdown from "./Dropdown";
import { enRetard, fmtDateFR, imminent } from "../date";
import { P_DOT } from "../ui";
import type { Priorite, Statut, Tache } from "../types";

function DotPriorite({ p }: { p?: Priorite }) {
  if (!p) return null;
  return <span className={`inline-block h-2 w-2 rounded-full ${P_DOT[p]}`} />;
}

const ICON_ALIASES: Record<string, string> = {
  check: "CheckCircle2",
  flag: "Flag",
  star: "Star",
  bug: "Bug",
  wrench: "Wrench",
  flame: "Flame",
  bell: "Bell",
  zap: "Zap",
  bookmark: "Bookmark",
  message: "MessageSquare",
  dollar: "DollarSign",
  globe: "Globe",
  rocket: "Rocket",
  shield: "Shield",
  target: "Target",
  trophy: "Trophy",
};

function resolveLucideIcon(name?: string): LucideIcon | null {
  if (!name) return null;
  const key =
    (name in (LucideIcons as Record<string, unknown>) ? name : "") ||
    ICON_ALIASES[name.toLowerCase()] ||
    name;
  const comp = (LucideIcons as Record<string, unknown>)[key];
  if (comp && (typeof comp === "function" || typeof comp === "object")) {
    return comp as LucideIcon;
  }
  return null;
}

function hexToRGBA(hex?: string, alpha = 0.12): string | undefined {
  if (!hex) return undefined;
  const s = hex.replace("#", "");
  if (s.length !== 6) return undefined;
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function TaskCard({
  t,
  onToggleDone,
  onMove,
  onEdit,
  onDelete,
  onView,
}: {
  t: Tache;
  onToggleDone: (t: Tache) => void;
  onMove: (t: Tache, to: Statut) => void;
  onEdit: (t: Tache) => void;
  onDelete: (t: Tache) => void;
  onView?: (t: Tache) => void;
}) {
  const itemsDeplacement: { label: string; to: Statut }[] = [
    { label: "➜ À faire", to: "todo" },
    { label: "➜ En cours", to: "in_progress" },
    { label: "➜ À revoir", to: "review" },
    { label: "➜ Terminé", to: "done" },
  ];

  const retard = enRetard(t.echeance ?? undefined);
  const imin = imminent(t.echeance ?? undefined);

  const IconComp = useMemo(
    () => resolveLucideIcon(t.icone) ?? CheckCircle2,
    [t.icone]
  );

  const tint = useMemo(() => hexToRGBA(t.projectColor, 0.12), [t.projectColor]);

  return (
    <div className="relative group rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur p-3 shadow-sm hover:shadow-md transition-shadow overflow-visible">
      {tint && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ background: tint, filter: "saturate(115%)" }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start gap-3">
          <button
            title="Terminer / Annuler terminé"
            onClick={() => onToggleDone(t)}
            className={`mt-1 rounded-full p-1 ring-1 ring-black/10 dark:ring-white/10 ${
              t.terminee
                ? "bg-emerald-500/20 text-emerald-500"
                : "hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            <IconComp className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            {t.etiquette && (
              <span className="inline-flex items-center gap-1 rounded-full border border-black/5 dark:border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide opacity-80">
                {t.etiquette}
              </span>
            )}

            <h4
              className={`mt-1 text-[15px] font-semibold leading-snug break-words ${
                t.terminee ? "line-through opacity-70" : ""
              }`}
            >
              {t.titre}
            </h4>
            {/* ⛔️ on ne montre plus l'image ici du tout */}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onView?.(t)}
              className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10"
              title="Voir les détails"
            >
              <Eye className="h-4 w-4" />
            </button>
            <Dropdown
              trigger={<MoreHorizontal className="h-5 w-5" />}
              items={[
                ...itemsDeplacement
                  .filter((m) => m.to !== t.statut)
                  .map((m) => ({
                    label: m.label,
                    onClick: () => onMove(t, m.to),
                  })),
                { label: "Modifier", onClick: () => onEdit(t) },
                {
                  label: "Supprimer",
                  onClick: () => onDelete(t),
                  danger: true,
                },
              ]}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs opacity-80">
          <div className="flex items-center gap-2">
            <DotPriorite p={t.priorite} />
            {t.priorite && (
              <span className="capitalize">
                {t.priorite === "high"
                  ? "Haute"
                  : t.priorite === "medium"
                  ? "Moyenne"
                  : "Faible"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {t.echeance && (
              <div className="rounded-md px-2 py-0.5 ring-1 ring-black/10 dark:ring-white/10 flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Échéance {fmtDateFR(t.echeance)}
              </div>
            )}
            {retard && (
              <span className="rounded-md px-2 py-0.5 text-rose-700 dark:text-rose-300 ring-1 ring-rose-400/40">
                En retard
              </span>
            )}
            {!retard && imin && (
              <span className="rounded-md px-2 py-0.5 text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/40">
                Imminent
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
