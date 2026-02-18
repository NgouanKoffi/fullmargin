// src/pages/journal/index.tsx
import { useEffect, useState } from "react";
import {
  NotebookPen, // Compte de journal
  CandlestickChart, // Marché
  Target, // Stratégie
  ScrollText, // Journal
  BarChart3, // Performance
} from "lucide-react";
import StrategyTab from "./tabs/strategy";
import JournalEntriesTab from "./tabs/JournalEntriesTab";
import JournalAccountsTab from "./tabs/JournalAccountsTab";
import ViewTab from "./tabs/view";
import MarketTab from "./tabs/market";
import TutorialVideoModal from "./TutorialVideoModal";

type TabKey =
  | "accounts"
  | "market"
  | "strategy"
  | "journal"
  | "totals"
  | "charts"
  | "view";

function isValidTab(v: unknown): v is TabKey {
  return (
    v === "accounts" ||
    v === "market" ||
    v === "strategy" ||
    v === "journal" ||
    v === "totals" ||
    v === "charts" ||
    v === "view"
  );
}

// ➜ on lit UNIQUEMENT l’URL (hash ou ?tab=) pour l’onglet initial
function getInitialTab(): TabKey {
  if (typeof window === "undefined") return "accounts";

  // 1. hash (#journal)
  const hash = window.location.hash.replace("#", "").toLowerCase();
  if (isValidTab(hash)) return hash;

  // 2. query (?tab=journal)
  const q = new URLSearchParams(window.location.search)
    .get("tab")
    ?.toLowerCase();
  if (isValidTab(q)) return q;

  // 3. défaut
  return "accounts";
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60",
        active
          ? "bg-violet-600 text-white border-violet-600"
          : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
      ].join(" ")}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Cette section arrive bientôt.
      </p>
    </div>
  );
}

export default function JournalPage() {
  const [tab, setTab] = useState<TabKey>(() => getInitialTab());
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // ➜ quand on change d’onglet, on met à jour le hash
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = `${window.location.pathname}${window.location.search}#${tab}`;
    window.history.replaceState(null, "", url);
  }, [tab]);

  // ➜ si l’utilisateur change le hash manuellement
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onHash = () => {
      const h = window.location.hash.replace("#", "").toLowerCase();
      if (isValidTab(h) && h !== tab) setTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [tab]);

  return (
    <main className="w-full">
      {/* Header */}
      <section className="w-full">
        <div className="w-full px-4 sm:px-6 lg:px-10 pt-10 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Mon journal de trading
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Crée tes comptes, saisis/importes tes trades et suis ta progression.
          </p>

          <div
            className="mt-6 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="min-w-max inline-flex items-center gap-2 p-1 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-700 bg-white/95 dark:bg-slate-900/95">
              <TabButton
                active={tab === "accounts"}
                onClick={() => setTab("accounts")}
              >
                <NotebookPen className="w-4 h-4" /> Compte de journal
              </TabButton>
              <TabButton
                active={tab === "market"}
                onClick={() => setTab("market")}
              >
                <CandlestickChart className="w-4 h-4" /> Marché
              </TabButton>
              <TabButton
                active={tab === "strategy"}
                onClick={() => setTab("strategy")}
              >
                <Target className="w-4 h-4" /> Stratégie
              </TabButton>
              <TabButton
                active={tab === "journal"}
                onClick={() => setTab("journal")}
              >
                <ScrollText className="w-4 h-4" /> Journal
              </TabButton>

              <TabButton active={tab === "view"} onClick={() => setTab("view")}>
                <BarChart3 className="w-4 h-4" /> Perfomance
              </TabButton>

              {/* Help button */}
              <button
                type="button"
                onClick={() => setShowTutorialModal(true)}
                className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-medium bg-violet-600/10 text-violet-600 transition-colors hover:bg-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20 border-0"
                title="Revoir le tutoriel"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Comment ça marche
              </button>

              <div id="journal-actions-anchor" className="ml-2" />
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="w-full">
        <div className="w-full px-0 lg:px-4 pb-14">
          <div className="w-full px-4 sm:px-6 lg:px-10">
            {tab === "accounts" && <JournalAccountsTab />}
            {tab === "market" && <MarketTab />}
            {tab === "strategy" && <StrategyTab />}
            {tab === "journal" && <JournalEntriesTab />}
            {tab === "totals" && <ComingSoon title="Total des stratégies" />}
            {tab === "charts" && <ComingSoon title="Graphiques" />}
            {tab === "view" && <ViewTab />}
          </div>
        </div>
      </section>

      {/* Tutorial Video Modal */}
      <TutorialVideoModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
      />
    </main>
  );
}
