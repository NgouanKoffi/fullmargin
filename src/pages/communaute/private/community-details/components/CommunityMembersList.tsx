// src/pages/communaute/private/community-details/components/CommunityMembersList.tsx
import { useEffect, useState, useMemo } from "react";
import { API_BASE } from "../../../../../lib/api";
import { loadSession } from "../../../../../auth/lib/storage";

type Session = { token?: string } | null;

export type CommunityMemberLite = {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  avatarUrl?: string | null;
};

type Props = {
  communityId: string;
  onSelectMember?: (m: CommunityMemberLite) => void;
  selectedId?: string | null;
};

export function CommunityMembersList({
  communityId,
  onSelectMember,
  selectedId,
}: Props) {
  const [members, setMembers] = useState<CommunityMemberLite[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!communityId) return;

    const session = loadSession() as Session;
    const token = session?.token;
    if (!token) {
      setError("Connexion requise.");
      return;
    }

    const base = API_BASE.replace(/\/+$/, "");
    const url = `${base}/communaute/memberships/${communityId}/members`;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json?.error || "Lecture impossible");
        }

        if (cancelled) return;
        setMembers(json.data as CommunityMemberLite[]);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof Error ? e.message : "Impossible de charger les membres"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [communityId]);

  const filtered = useMemo(() => {
    if (!members) return [];
    const q = search.trim().toLowerCase();
    if (!q) return members;

    return members.filter((m) => {
      const parts = [m.fullName, m.firstName || "", m.lastName || ""]
        .join(" ")
        .toLowerCase();

      return parts.includes(q);
    });
  }, [members, search]);

  if (loading && !members) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-300">
        Chargement des abonnés…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Aucun abonné pour l’instant dans cette communauté.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Résumé + barre de recherche */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {members.length} abonné(s) dans cette communauté.
        </p>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un abonné…"
            className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/70 focus:border-violet-500/70"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] text-slate-400 dark:text-slate-500">
            ⌕
          </span>
        </div>
      </div>

      {/* Liste filtrée */}
      {filtered.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Aucun abonné ne correspond à « {search} ».
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80">
          {filtered.map((m) => {
            const initials =
              (m.firstName?.[0] || m.fullName?.[0] || "?") +
              (m.lastName?.[0] || "");

            const isSelected = selectedId === m.id;
            const clickable = typeof onSelectMember === "function";

            return (
              <li
                key={m.id}
                className={[
                  "flex items-center gap-3 px-4 py-3 text-sm",
                  clickable
                    ? "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/70"
                    : "",
                  isSelected ? "bg-violet-50 dark:bg-violet-900/30" : "",
                ].join(" ")}
                onClick={() => {
                  if (clickable) onSelectMember(m);
                }}
              >
                {/* Avatar */}
                <div className="h-9 w-9 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-100">
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt={m.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{initials.toUpperCase()}</span>
                  )}
                </div>

                {/* Texte */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-50 truncate">
                    {m.fullName}
                  </p>
                  {(m.firstName || m.lastName) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {[m.firstName, m.lastName].filter(Boolean).join(" ")}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
