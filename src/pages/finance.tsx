// src/pages/finance.tsx
import { useEffect, useState } from "react";
import { Wallet2, Activity, PieChart } from "lucide-react";
import ActionTab from "./finance/ActionTab";
import AccountsTab from "./finance/AccountTab";
import ChartsTab from "./finance/ChartsTab";
import TutorialVideoModal from "./finance/TutorialVideoModal";

type TabKey = "accounts" | "actions" | "charts";
const TAB_LS_KEY = "fm:finance:activeTab:v1";

function isValidTab(v: unknown): v is TabKey {
  return (
    typeof v === "string" &&
    (v === "accounts" || v === "actions" || v === "charts")
  );
}

function getInitialTab(): TabKey {
  try {
    const h =
      (typeof window !== "undefined"
        ? window.location.hash.replace("#", "").toLowerCase()
        : "") || "";
    if (isValidTab(h)) return h;

    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search)
        .get("tab")
        ?.toLowerCase();
      if (isValidTab(q)) return q;
    }

    const ls =
      (typeof window !== "undefined"
        ? localStorage.getItem(TAB_LS_KEY)
        : null) || null;
    if (isValidTab(ls)) return ls;
  } catch {
    /* noop */
  }
  return "accounts";
}

export default function FinancePage() {
  const [tab, setTab] = useState<TabKey>(() => getInitialTab());
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  // si tu veux qu’on puisse fermer le message :

  useEffect(() => {
    try {
      localStorage.setItem(TAB_LS_KEY, tab);
      if (typeof window !== "undefined") {
        const url = `${window.location.pathname}${window.location.search}#${tab}`;
        window.history.replaceState(null, "", url);
      }
    } catch {
      /* noop */
    }
  }, [tab]);

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "").toLowerCase();
      if (isValidTab(h) && h !== tab) setTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [tab]);

  return (
    <main className="w-full">
      {/* HEADER */}
      <section className="w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 pt-10 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Mes finances
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Créez vos comptes, enregistrez vos transactions, et suivez
            l’évolution de vos soldes.
          </p>

          {/* onglets */}
          <div
            className="mt-6 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="min-w-max flex items-center gap-2">
              <button
                onClick={() => setTab("accounts")}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60",
                  tab === "accounts"
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
                ].join(" ")}
                aria-pressed={tab === "accounts"}
              >
                <Wallet2 className="w-4 h-4" /> Mes comptes
              </button>

              <button
                onClick={() => setTab("actions")}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60",
                  tab === "actions"
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
                ].join(" ")}
                aria-pressed={tab === "actions"}
              >
                <Activity className="w-4 h-4" /> Actions & transactions
              </button>

              <button
                onClick={() => setTab("charts")}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-semibold border focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60",
                  tab === "charts"
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
                ].join(" ")}
                aria-pressed={tab === "charts"}
              >
                <PieChart className="w-4 h-4" /> Statistique
              </button>

              {/* Help button */}
              <button
                type="button"
                onClick={() => setShowTutorialModal(true)}
                className="inline-flex items-center gap-2 rounded-full px-4 h-10 text-sm font-medium bg-violet-600/10 text-violet-600 transition-colors hover:bg-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
                title="Revoir le tutoriel"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Comment ça marche
              </button>

              <div id="finance-actions-anchor" className="ml-2" />
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="w-full pb-14">
        <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12">
          {tab === "accounts" && <AccountsTab />}
          {tab === "actions" && <ActionTab />}
          {tab === "charts" && <ChartsTab />}
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
