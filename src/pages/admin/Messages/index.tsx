// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\Messages\index.tsx
import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Settings2,
  Signature as SignatureIcon,
  Files,
  Megaphone,
  Inbox,
  CalendarClock,
} from "lucide-react";

import { useAuth } from "../../../auth/AuthContext";
import SignatureTab from "./SignatureTab";
import TemplatesTab from "./TemplatesTab";
import DiffusionTab from "./DiffusionTab";

type TabKey =
  | "signature"
  | "templates"
  | "mail"
  | "programmation"
  | "diffusion";

const ALL_TABS: {
  key: TabKey;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "signature", label: "Signature", Icon: SignatureIcon },
  { key: "templates", label: "Templates", Icon: Files },
  { key: "mail", label: "Boîte mail", Icon: Inbox },
  { key: "programmation", label: "Programmation", Icon: CalendarClock },
  { key: "diffusion", label: "Diffusion", Icon: Megaphone },
];

function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-sm text-skin-muted">{text}</div>
    </div>
  );
}

export default function AdminMessages() {
  const { status, user } = useAuth();
  const roles = user?.roles ?? [];
  const isAdmin = status === "authenticated" && roles.includes("admin");
  const isAgent = status === "authenticated" && roles.includes("agent");

  const visibleKeys = useMemo<TabKey[]>(() => {
    if (isAdmin)
      return ["signature", "templates", "mail", "programmation", "diffusion"];
    if (isAgent) return ["mail", "programmation", "diffusion"];
    // fallback si roles inconnus
    return ["signature", "templates", "mail", "programmation", "diffusion"];
  }, [isAdmin, isAgent]);

  const TABS = useMemo(
    () => ALL_TABS.filter((t) => visibleKeys.includes(t.key)),
    [visibleKeys],
  );

  const defaultTab: TabKey = isAgent ? "mail" : "signature";

  const [sp, setSp] = useSearchParams();
  const requested = sp.get("tab") as TabKey | null;

  const active: TabKey = useMemo(() => {
    const cur = (requested || defaultTab) as TabKey;
    return visibleKeys.includes(cur) ? cur : defaultTab;
  }, [requested, defaultTab, visibleKeys]);

  useEffect(() => {
    if (requested !== active) {
      const next = new URLSearchParams(sp);
      next.set("tab", active);
      setSp(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const switchTo = (key: TabKey) => {
    if (!visibleKeys.includes(key)) return;
    const next = new URLSearchParams(sp);
    next.set("tab", key);
    setSp(next, { replace: true });
  };

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.getElementById(`tab-${active}`);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [active]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const intro = isAgent
    ? "Accède aux emails de ton service, programme et diffuse tes campagnes. Les autres sections sont gérées par l’administrateur."
    : "Gère les signatures, modèles, la boîte mail, la programmation et la diffusion des campagnes.";

  return (
    <main
      className="
        w-full
        mx-auto
        px-3 sm:px-6 lg:px-10 xl:px-14
        py-8
        space-y-6
      "
    >
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-skin-border/20 bg-skin-surface">
          <Settings2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Emails</h1>
          <p className="text-skin-muted">{intro}</p>
        </div>
      </div>

      <div
        className="
          mt-4
          lg:grid
          lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]
          lg:items-start
          lg:gap-8
        "
      >
        <aside className="mb-4 lg:mb-0">
          <div
            ref={scrollerRef}
            className="
              overflow-x-auto lg:overflow-x-visible scroll-smooth
              rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface
            "
            aria-label="Barre d’onglets"
          >
            <div
              role="tablist"
              aria-label="Gestion des messages"
              className="
                flex lg:flex-col gap-2 min-w-max lg:min-w-0
                p-2
              "
            >
              {TABS.map(({ key, label, Icon }) => {
                const selected = key === active;
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`panel-${key}`}
                    id={`tab-${key}`}
                    onClick={() => switchTo(key)}
                    className={[
                      "inline-flex items-center justify-start gap-2",
                      "px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition",
                      "whitespace-nowrap lg:whitespace-normal w-auto lg:w-full text-left",
                      selected
                        ? "bg-[#7c3aed] text-white shadow"
                        : "hover:bg-skin-tile text-skin-base",
                    ].join(" ")}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section
          role="tabpanel"
          id={`panel-${active}`}
          aria-labelledby={`tab-${active}`}
          className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-4 sm:p-6"
        >
          {active === "signature" && <SignatureTab />}
          {active === "templates" && <TemplatesTab />}
          {active === "diffusion" && <DiffusionTab />}

          {active === "mail" && (
            <Placeholder
              title="Boîte mail"
              text="Branche ici ton composant Mailbox (lecture/réponse). Pour l’instant, cet onglet est un placeholder."
            />
          )}

          {active === "programmation" && (
            <Placeholder
              title="Programmation"
              text="Branche ici ton composant de planification (campaign scheduler). Pour l’instant, cet onglet est un placeholder."
            />
          )}
        </section>
      </div>
    </main>
  );
}
