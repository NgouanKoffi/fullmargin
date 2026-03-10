// src/pages/profil/components/TabBar.tsx
import cx from "../utils/cx";
import { HiInformationCircle, HiShieldCheck, HiLink } from "react-icons/hi2";
import type { TabId } from "../types";
import type { IconType } from "react-icons";

export default function TabBar({
  tab,
  onChange,
}: {
  tab: TabId;
  onChange: (t: TabId) => void;
}) {
  const TABS: ReadonlyArray<{ id: TabId; label: string; Icon: IconType }> = [
    { id: "about", label: "À propos", Icon: HiInformationCircle },
    { id: "affiliation", label: "Affiliation", Icon: HiLink },
    { id: "security", label: "Sécurité", Icon: HiShieldCheck },
  ];

  return (
    <div className="sticky top-16 z-30 -mx-3 sm:mx-0">
      <div className="px-3 sm:px-0">
        {/* Carte comme les autres blocs */}
        <div
          className={cx(
            "rounded-2xl border border-skin-border/50 ring-1 ring-skin-border/25",
            "bg-white dark:bg-slate-900 shadow-sm px-2 sm:px-3 py-2"
          )}
        >
          <nav
            aria-label="Onglets du profil"
            className="overflow-x-auto no-scrollbar"
          >
            <div className="inline-flex w-max gap-1">
              {TABS.map(({ id, label, Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => onChange(id)}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "relative shrink-0 inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl",
                      "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-primary/40",
                      active
                        ? "text-fm-primary bg-fm-primary/5"
                        : "text-skin-muted hover:text-skin-base hover:bg-skin-tile"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="min-w-0">{label}</span>
                    {/* soulignement discret pour l’actif */}
                    <span
                      className={cx(
                        "pointer-events-none absolute left-3 right-3 -bottom-[6px] h-[2px] rounded-full",
                        active ? "bg-fm-primary" : "bg-transparent"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
