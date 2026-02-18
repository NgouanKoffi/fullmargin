// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\hooks\useUrlTab.ts
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { TABS, type TabKey } from "../tabs.constants";

export function useUrlTab(defaultTab: TabKey) {
  const loc = useLocation();
  const nav = useNavigate();

  const current = useMemo<TabKey>(() => {
    const sp = new URLSearchParams(loc.search);
    const t = sp.get("tab") as TabKey | null;
    return (
      (t && (TABS.some((x) => x.key === t) ? t : defaultTab)) || defaultTab
    );
  }, [loc.search, defaultTab]);

  const setTab = (t: TabKey) => {
    const sp = new URLSearchParams(loc.search);
    sp.set("tab", t);
    nav(`${loc.pathname}?${sp.toString()}`, { replace: true });
  };

  return [current, setTab] as const;
}
