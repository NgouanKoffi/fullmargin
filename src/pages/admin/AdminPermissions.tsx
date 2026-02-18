// src/pages/admin/AdminPermissions.tsx
import { useState, useRef, useEffect } from "react";
import { Card } from "./services/tabs/SharedComponents";
import { PermissionsTab } from "./services/tabs/PermissionsTab";
import { AgentTab } from "./services/tabs/AgentTab";
import { ServicesTab } from "./services/tabs/ServicesTab";
import { UsersTab } from "./services/tabs/UsersTab";

type TabKey = "users" | "permissions" | "agent" | "services";

function Tabs({
  value,
  onChange,
  tabs,
}: {
  value: TabKey;
  onChange: (k: TabKey) => void;
  tabs: { key: TabKey; label: string }[];
}) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLButtonElement>(
      '[aria-selected="true"]'
    );
    if (el)
      el.scrollIntoView({
        inline: "center",
        behavior: "smooth",
        block: "nearest",
      });
  }, [value]);

  return (
    <div>
      <div
        ref={listRef}
        role="tablist"
        aria-label="Onglets permissions"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {tabs.map((t) => {
          const active = value === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${t.key}`}
              id={`tab-${t.key}`}
              onClick={() => onChange(t.key)}
              className={[
                "whitespace-nowrap h-9 px-3 rounded-md border text-sm",
                active
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPermissions() {
  const [tab, setTab] = useState<TabKey>("users");
  const tabs: { key: TabKey; label: string }[] = [
    { key: "users", label: "Utilisateurs" },
    { key: "permissions", label: "Permissions" },
    { key: "agent", label: "Agent" },
    { key: "services", label: "Services" },
  ];

  return (
    <main className="mx-auto max-w-6xl w-full px-3 sm:px-6 py-8 space-y-4">
      <h1 className="text-xl font-semibold">Permissions</h1>
      <Card className="space-y-4">
        <Tabs value={tab} onChange={setTab} tabs={tabs} />
        {tab === "users" && <UsersTab />}
        {tab === "permissions" && <PermissionsTab />}
        {tab === "agent" && <AgentTab />}
        {tab === "services" && <ServicesTab />}
      </Card>
    </main>
  );
}
