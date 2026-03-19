// src/pages/admin/Messages/MailboxTab/panels/MailerComposer/hooks/useDiffusionGroupsOptions.ts
import { useEffect, useState } from "react";
import type { GroupOption } from "../types";
import { fetchJSON } from "../utils";

type State = {
  options: GroupOption[];
  loading: boolean;
  error: string | null;
};

type RawGroup = {
  id?: unknown;
  _id?: unknown;
  name?: unknown;
};

type ListRes = {
  items?: RawGroup[];
  groups?: RawGroup[]; // compat éventuelle
};

function toId(v: unknown): string {
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}
function toName(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export default function useDiffusionGroupsOptions(): State {
  const [options, setOptions] = useState<GroupOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ limit: String(200) }).toString();
        // ⚠️ PAS de /api en tête, utils s'occupe de la base
        const res = await fetchJSON<unknown>(`/admin/diffusions?${qs}`);

        const rawArr: unknown[] = Array.isArray(res)
          ? res
          : Array.isArray((res as ListRes)?.items)
          ? (res as ListRes).items!
          : Array.isArray((res as ListRes)?.groups)
          ? (res as ListRes).groups!
          : [];

        const opts: GroupOption[] = rawArr
          .map((g) => {
            if (!g || typeof g !== "object") return null;
            const o = g as RawGroup;
            const id = toId(o.id ?? o._id);
            const name = toName(o.name);
            if (!id || !name) return null;
            return { id, name };
          })
          .filter((x): x is GroupOption => !!x);

        if (!cancelled) setOptions(opts);
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Erreur de chargement des groupes";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { options, loading, error };
}
