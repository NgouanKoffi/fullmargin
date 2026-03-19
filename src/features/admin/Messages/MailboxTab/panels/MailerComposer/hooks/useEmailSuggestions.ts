// src/pages/admin/Messages/MailboxTab/panels/MailerComposer/hooks/useEmailSuggestions.ts
import { useEffect, useState } from "react";
import { fetchJSON } from "../utils";

type RawUser = { email?: unknown };
type UsersRes = { users?: RawUser[]; items?: RawUser[] } | RawUser[];

function asString(v: unknown): v is string {
  return typeof v === "string";
}

export default function useEmailSuggestions(query: string) {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    setItems([]);
    setError(null);
    if (q.length < 2) return;

    let cancelled = false;
    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        // ⚠️ PAS de /api en tête, utils s'occupe de la base
        const res = await fetchJSON<UsersRes>(
          `/admin/users?q=${encodeURIComponent(q)}&limit=8`,
          { signal: ctrl.signal }
        );

        const arr: RawUser[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.users)
          ? res.users!
          : Array.isArray(res?.items)
          ? res.items!
          : [];

        const emails = arr
          .map((u) => (asString(u?.email) ? u.email : ""))
          .filter((e): e is string => e.length > 0);

        if (!cancelled) setItems(emails);
      } catch (e: unknown) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erreur de suggestions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [query]);

  return { items, loading, error };
}
