// src/pages/journal/tabs/journal/JournalForm/OptionsLoader.tsx
import { useEffect, useState } from "react";
import { listJournalAccounts, listMarkets, listStrategies } from "../../../api";
import { loadSession } from "../../../../../auth/lib/storage";
import type { Option } from "../../../types";

type OptionsState = {
  accounts: Option[];
  markets: Option[];
  strats: Option[];
};

export function useJournalOptions(): OptionsState {
  const [accounts, setAccounts] = useState<Option[]>([]);
  const [markets, setMarkets] = useState<Option[]>([]);
  const [strats, setStrats] = useState<Option[]>([]);

  useEffect(() => {
    const session = typeof window !== "undefined" ? loadSession() : null;
    if (!session) {
      setAccounts([]);
      setMarkets([]);
      setStrats([]);
      return;
    }

    (async () => {
      try {
        const [accRes, mRes, sRes] = await Promise.all([
          listJournalAccounts({ limit: 200 }),
          listMarkets({ limit: 200 }),
          listStrategies({ limit: 200 }),
        ]);

        setAccounts(
          accRes.items.map((a) => ({ id: a.id, name: a.name })) as Option[]
        );
        setMarkets(
          mRes.items.map((m) => ({ id: m.id, name: m.name })) as Option[]
        );
        setStrats(
          sRes.items.map((s) => ({ id: s.id, name: s.name })) as Option[]
        );
      } catch (err) {
        console.warn("[journal] load options failed:", err);
        setAccounts([]);
        setMarkets([]);
        setStrats([]);
      }
    })();
  }, []);

  return { accounts, markets, strats };
}
