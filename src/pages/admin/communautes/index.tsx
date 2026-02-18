// src/pages/admin/communaute/index.tsx
import { useState } from "react";
import type React from "react";
import { Users, GraduationCap, Layers, CalendarRange } from "lucide-react";

// ⬇️ Adapte les chemins si besoin
import { TabCommunautes } from "../../communaute/public/sections/Communautes";
import TabFormations from "../../communaute/public/sections/Formations";
import TabGroupes from "../../communaute/public/sections/Groupes";

type TabKey = "communities" | "courses" | "groups";

const TAB_LABELS: Record<TabKey, string> = {
  communities: "Communautés",
  courses: "Formations",
  groups: "Groupes",
};

export default function AdminCommunautePage() {
  const [tab, setTab] = useState<TabKey>("communities");

  // 📅 Filtres de période (YYYY-MM-DD)
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const hasPeriod = !!dateFrom || !!dateTo;

  return (
    <div className="w-full px-3 sm:px-4 lg:px-8 py-6 lg:py-8">
      {/* Titre global */}
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold text-skin-base">
          Communauté – Administration
        </h1>
        <p className="text-sm text-skin-muted">
          Vue d’ensemble des communautés, formations et groupes créés sur la
          plateforme.
        </p>
      </header>

      {/* Layout principal : sidebar + contenu */}
      <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
        {/* SIDEBAR GAUCHE */}
        <aside className="w-full md:w-60 md:flex-shrink-0">
          <div className="rounded-2xl bg-skin-surface ring-1 ring-skin-border/30 p-3 md:p-4 space-y-3">
            <div className="px-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-skin-muted">
                Section
              </p>
              <p className="mt-1 text-sm text-skin-base">
                Vue d&apos;ensemble Communauté
              </p>
            </div>

            <nav className="space-y-1">
              <SidebarItem
                icon={Users}
                label="Communautés"
                active={tab === "communities"}
                onClick={() => setTab("communities")}
              />
              <SidebarItem
                icon={GraduationCap}
                label="Formations"
                active={tab === "courses"}
                onClick={() => setTab("courses")}
              />
              <SidebarItem
                icon={Layers}
                label="Groupes"
                active={tab === "groups"}
                onClick={() => setTab("groups")}
              />
            </nav>
          </div>
        </aside>

        {/* CONTENU PRINCIPAL */}
        <main className="flex-1">
          <div className="rounded-2xl bg-skin-surface ring-1 ring-skin-border/20 overflow-hidden">
            {/* Header du contenu */}
            <div className="border-b border-skin-border/20 px-4 sm:px-5 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-skin-base">
                  {TAB_LABELS[tab]}
                </h2>
                <p className="text-xs text-skin-muted">
                  {tab === "communities" &&
                    "Liste des communautés avec leurs propriétaires, membres et statut."}
                  {tab === "courses" &&
                    "Toutes les formations créées dans les communautés."}
                  {tab === "groups" &&
                    "Groupes de discussion internes aux communautés."}
                </p>
              </div>

              {/* 📅 Filtres de période globaux (appliqués à l’onglet courant) */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-skin-border/60 bg-skin-base/40 px-3 py-2">
                  <CalendarRange className="w-4 h-4 text-violet-500" />
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-skin-muted">Du</span>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="rounded-md border border-skin-border/60 bg-skin-elevated px-2 py-1 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-skin-muted">au</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="rounded-md border border-skin-border/60 bg-skin-elevated px-2 py-1 text-xs"
                      />
                    </div>
                  </div>

                  {hasPeriod && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                      }}
                      className="ml-2 text-[11px] text-skin-muted hover:text-skin-base underline"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>

                {hasPeriod && (
                  <span className="text-[11px] text-skin-muted">
                    Période appliquée aux{" "}
                    <span className="font-semibold">
                      {TAB_LABELS[tab].toLowerCase()}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Contenu selon l'onglet */}
            <div className="px-3 sm:px-4 md:px-5 py-4 sm:py-5">
              {tab === "communities" && (
                <div className="space-y-4">
                  <TabCommunautes
                    dense
                    filterFrom={dateFrom || undefined}
                    filterTo={dateTo || undefined}
                  />
                </div>
              )}

              {tab === "courses" && (
                <div className="space-y-4">
                  <TabFormations
                    filterFrom={dateFrom || undefined}
                    filterTo={dateTo || undefined}
                  />
                </div>
              )}

              {tab === "groups" && (
                <div className="space-y-4">
                  <TabGroupes
                    filterFrom={dateFrom || undefined}
                    filterTo={dateTo || undefined}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar item                                                       */
/* ------------------------------------------------------------------ */

type SidebarItemProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  active?: boolean;
  onClick?: () => void;
};

function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full inline-flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition",
        active
          ? "bg-violet-500 text-white shadow-sm"
          : "text-skin-muted hover:text-skin-base hover:bg-skin-tile",
      ].join(" ")}
    >
      <Icon className="w-4 h-4" />
      <span className="truncate">{label}</span>
    </button>
  );
}
