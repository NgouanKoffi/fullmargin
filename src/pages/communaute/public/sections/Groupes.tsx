// src/pages/communaute/public/sections/groupes/TabGroupes.tsx
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { API_BASE } from "../../../../lib/api";
import { loadSession } from "../../../../auth/lib/storage";
import {
  type PublicGroup,
  type PublicGroupsResponse,
  type MembershipData,
  type MembershipResponse,
} from "./groupes/types";
import { GroupsGrid } from "./groupes/GroupsGrid";
import GroupDetailsModal from "./groupes/GroupDetailsModal";
import { useAuth } from "../../../../auth/AuthContext";

type Session = { token?: string } | null;

function authHeaders(): Record<string, string> {
  const t = (loadSession() as Session)?.token;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

type SortBy = "recent" | "members";
type GroupsTab = "mine" | "all";

/** Props optionnelles pour filtrer les groupes sur une période (admin) */
type TabGroupesProps = {
  /** Date min (incluse), format YYYY-MM-DD */
  filterFrom?: string;
  /** Date max (incluse), format YYYY-MM-DD */
  filterTo?: string;
};

/* ---------- Helper période ---------- */
function isInDateRange(
  dateStr?: string | null,
  from?: string,
  to?: string
): boolean {
  if (!from && !to) return true;
  if (!dateStr) return false;

  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return false;

  if (from) {
    const fromT = new Date(from + "T00:00:00Z").getTime();
    if (t < fromT) return false;
  }
  if (to) {
    const toT = new Date(to + "T23:59:59Z").getTime();
    if (t > toT) return false;
  }
  return true;
}

export default function TabGroupes({
  filterFrom,
  filterTo,
}: TabGroupesProps = {}) {
  const { status } = useAuth();
  const isAuthenticated = status === "authenticated";

  const [groups, setGroups] = useState<PublicGroup[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("recent");

  const [activeTab, setActiveTab] = useState<GroupsTab>("mine");

  const [activeGroup, setActiveGroup] = useState<PublicGroup | null>(null);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  /** Cache des memberships par groupId (pour la grille) */
  const [membershipsMap, setMembershipsMap] = useState<
    Record<string, MembershipData | undefined>
  >({});
  /** Chargement des memberships pour la grille (Mes groupes) */
  const [gridMembershipsLoading, setGridMembershipsLoading] = useState(false);

  /* ---------- Shimmer style ---------- */
  const shimmerStyle = `
    @keyframes fmShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    .fm-shimmer {
      background-image: linear-gradient(
        90deg,
        rgba(148,163,184,0.15),
        rgba(148,163,184,0.50),
        rgba(148,163,184,0.15)
      );
      background-size: 200% 100%;
      animation: fmShimmer 1.4s ease-in-out infinite;
    }
  `;

  /* ---------- Chargement liste ---------- */

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = authHeaders();

      const res = await fetch(`${API_BASE}/communaute/groups/public`, {
        headers,
      });
      if (!res.ok) throw new Error("Réponse serveur invalide");

      const json = (await res.json()) as PublicGroupsResponse;
      if (!json.ok || !json.data) {
        throw new Error(json.error || "Chargement des groupes impossible.");
      }

      const items = json.data.items;
      setGroups(items);
    } catch (e) {
      const msg =
        e instanceof Error && e.message
          ? e.message
          : "Impossible de charger les groupes.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------- Chargement des memberships pour la grille ---------- */

  useEffect(() => {
    if (!groups || !isAuthenticated) return;

    const headers = authHeaders();
    if (!headers.Authorization) return;

    let cancelled = false;
    setGridMembershipsLoading(true);

    (async () => {
      try {
        const entries = await Promise.all(
          groups.map(async (g) => {
            try {
              const res = await fetch(
                `${API_BASE}/communaute/groups/${g.id}/membership`,
                { headers }
              );
              if (!res.ok) return [g.id, undefined] as const;

              const json = (await res.json()) as MembershipResponse;
              if (!json.ok || !json.data) return [g.id, undefined] as const;

              return [g.id, json.data] as const;
            } catch {
              return [g.id, undefined] as const;
            }
          })
        );

        if (cancelled) return;

        setMembershipsMap((prev) => {
          const next: Record<string, MembershipData | undefined> = {
            ...prev,
          };
          for (const [groupId, data] of entries) {
            if (data) {
              next[groupId] = data;
            }
          }
          return next;
        });
      } catch {
        // on ignore, la grille reste fonctionnelle sans les statuts
      } finally {
        if (!cancelled) {
          setGridMembershipsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groups, isAuthenticated]);

  /* ---------- Recherche + tri + période ---------- */

  const filteredAll = useMemo<PublicGroup[]>(() => {
    if (!groups) return [];
    const s = q.trim().toLowerCase();

    let base = groups;

    if (s) {
      base = base.filter((g) => {
        const name = g.name?.toLowerCase() ?? "";
        const community = (g.communityName ?? "").toLowerCase();
        return name.includes(s) || community.includes(s);
      });
    }

    // 🔥 filtre période sur createdAt
    base = base.filter((g) => isInDateRange(g.createdAt, filterFrom, filterTo));

    const arr = [...base];

    if (sortBy === "members") {
      arr.sort((a, b) => (b.membersCount ?? 0) - (a.membersCount ?? 0));
    } else {
      // récents : createdAt desc
      arr.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      });
    }

    return arr;
  }, [groups, q, sortBy, filterFrom, filterTo]);

  // 👉 Mes groupes = sous-ensemble de la liste filtrée
  const filteredMine = useMemo<PublicGroup[]>(() => {
    if (!filteredAll.length) return [];
    return filteredAll.filter((g) => membershipsMap[g.id]?.isMember);
  }, [filteredAll, membershipsMap]);

  const hasGroups = (groups && groups.length > 0) || false;

  const hasFilteredAll = filteredAll.length > 0;
  const hasFilteredMine = filteredMine.length > 0;

  const searchActive = q.trim().length > 0;

  /* ---------- Auto-switch de tab quand on cherche ---------- */

  useEffect(() => {
    if (!searchActive) return;

    if (activeTab === "mine" && !hasFilteredMine && hasFilteredAll) {
      setActiveTab("all");
    } else if (activeTab === "all" && !hasFilteredAll && hasFilteredMine) {
      setActiveTab("mine");
    }
  }, [searchActive, activeTab, hasFilteredMine, hasFilteredAll]);

  /* ---------- helpers auth ---------- */

  const openAuthModal = () => {
    try {
      const from =
        window.location.pathname +
        window.location.search +
        window.location.hash;
      localStorage.setItem("fm:auth:intent", from);
    } catch {
      /* ignore */
    }

    window.scrollTo({ top: 0 });
    window.dispatchEvent(new CustomEvent("fm:open-account"));
  };

  /* ---------- Ouverture / fermeture modal groupe ---------- */

  const handleOpenGroup = (group: PublicGroup) => {
    setActiveGroup(group);

    const known = membershipsMap[group.id];
    setMembership(
      known ?? {
        isMember: false,
        membersCount: group.membersCount ?? 0,
      }
    );
    setMembershipError(null);

    const headers = authHeaders();
    if (!headers.Authorization) return;

    (async () => {
      setMembershipLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/communaute/groups/${group.id}/membership`,
          { headers }
        );
        if (!res.ok) {
          throw new Error("Lecture du statut de membre impossible");
        }
        const json = (await res.json()) as MembershipResponse;
        if (!json.ok || !json.data) {
          throw new Error(
            json.error || "Lecture du statut de membre impossible."
          );
        }

        setMembership(json.data);
        setMembershipsMap((prev) => ({
          ...prev,
          [group.id]: json.data,
        }));
      } catch (e) {
        const msg =
          e instanceof Error && e.message
            ? e.message
            : "Impossible de récupérer le statut de membre.";
        setMembershipError(msg);
      } finally {
        setMembershipLoading(false);
      }
    })();
  };

  const handleCloseModal = () => {
    setActiveGroup(null);
    setMembership(null);
    setMembershipError(null);
  };

  /* ---------- Join / leave ---------- */

  const handleToggleMembership = async () => {
    if (!activeGroup) return;

    const group = activeGroup;
    setMembershipError(null);

    if (!isAuthenticated) {
      handleCloseModal();
      openAuthModal();
      return;
    }

    const headers = authHeaders();
    if (!headers.Authorization) {
      handleCloseModal();
      openAuthModal();
      return;
    }

    try {
      setMembershipLoading(true);

      const isMember = membership?.isMember ?? false;
      const url = isMember
        ? `${API_BASE}/communaute/groups/${group.id}/leave`
        : `${API_BASE}/communaute/groups/${group.id}/join`;

      const res = await fetch(url, { method: "POST", headers });

      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      type MembershipJson = MembershipResponse & {
        message?: string;
        error?: string;
      };

      const parsed = json as MembershipJson | null;

      if (!res.ok || !parsed || parsed.ok === false) {
        const errorCode: string | undefined = parsed?.error;
        const serverMessage: string | undefined = parsed?.message;

        if (errorCode === "COMMUNITY_MEMBERSHIP_REQUIRED") {
          const msg =
            serverMessage ||
            "Tu dois d’abord rejoindre la communauté pour accéder à ce groupe.";
          setMembershipError(msg);

          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("fm:toast", {
                detail: {
                  title: "Accès au groupe impossible",
                  message: msg,
                  tone: "warning",
                },
              })
            );
          }
          return;
        }

        throw new Error(
          serverMessage ||
            parsed?.error ||
            (isMember
              ? "Impossible de quitter le groupe."
              : "Impossible de rejoindre le groupe.")
        );
      }

      const data = parsed.data;
      if (!data) {
        throw new Error(
          isMember
            ? "Impossible de quitter le groupe."
            : "Impossible de rejoindre le groupe."
        );
      }

      setMembership(data);
      setMembershipsMap((prev) => ({
        ...prev,
        [group.id]: data,
      }));

      setGroups((prev) =>
        prev
          ? prev.map((g) =>
              g.id === group.id ? { ...g, membersCount: data.membersCount } : g
            )
          : prev
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("fm:toast", {
            detail: {
              title: isMember ? "Groupe quitté" : "Groupe rejoint",
              message: isMember
                ? `Tu as quitté « ${group.name} »`
                : `Tu as rejoint « ${group.name} »`,
              tone: "success",
            },
          })
        );
      }

      // 🔥 si on vient de REJOINDRE le groupe → ouvrir direct la discussion
      if (!isMember && typeof window !== "undefined") {
        handleCloseModal();

        window.dispatchEvent(
          new CustomEvent("fm:open-messages", {
            detail: {
              variant: "group",
              groupId: group.id,
              name: group.name,
              avatar: group.coverUrl || undefined,
            },
          })
        );
      }
    } catch (e) {
      const msg =
        e instanceof Error && e.message
          ? e.message
          : "Action impossible pour le moment.";
      setMembershipError(msg);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("fm:toast", {
            detail: { title: "Erreur", message: msg, tone: "error" },
          })
        );
      }
    } finally {
      setMembershipLoading(false);
    }
  };

  const groupsToDisplay = activeTab === "mine" ? filteredMine : filteredAll;

  const hasFilteredCurrent = groupsToDisplay.length > 0;

  const showNoGroupAtAll = !loading && !error && !hasGroups;

  // Pas de recherche, onglet "Mes groupes", mais aucun groupe
  const showEmptyMineNoSearch =
    !loading &&
    !gridMembershipsLoading &&
    !error &&
    hasGroups &&
    activeTab === "mine" &&
    !searchActive &&
    !hasFilteredMine;

  // Recherche active mais aucun résultat dans l’onglet courant
  const showNoResultCurrent =
    !loading &&
    !gridMembershipsLoading &&
    hasGroups &&
    searchActive &&
    !hasFilteredCurrent;

  /* ---------- Handler DISCUTER (ouvre le drawer messages) ---------- */

  const handleDiscussGroup = (g: PublicGroup) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("fm:open-messages", {
        detail: {
          variant: "group",
          groupId: g.id,
          name: g.name,
          avatar: g.coverUrl || undefined,
        },
      })
    );
  };

  const isMineTab = activeTab === "mine";

  return (
    <section className="mt-4 space-y-4 sm:space-y-6">
      <style>{shimmerStyle}</style>

      {/* Header + filtres globaux */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Groupes</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Retrouve les groupes de discussion liés aux communautés FullMargin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {/* Recherche */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 opacity-60" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un groupe…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-slate-900/40"
            />
          </div>

          {/* Tri */}
          <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-300">
            <SlidersHorizontal className="h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="text-xs sm:text-sm rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 px-2 py-1.5"
            >
              <option value="recent">Plus récents</option>
              <option value="members">Plus de membres</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Mes groupes / Tous les groupes */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        {/* flex-nowrap + overflow-x-auto + no-scrollbar */}
        <div className="flex flex-nowrap gap-4 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("mine")}
            className={`relative px-2 pb-2 text-sm font-medium transition sm:px-3 whitespace-nowrap flex-none ${
              activeTab === "mine"
                ? "text-violet-600 dark:text-violet-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Mes groupes
            {activeTab === "mine" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`relative px-2 pb-2 text-sm font-medium transition sm:px-3 whitespace-nowrap flex-none ${
              activeTab === "all"
                ? "text-violet-600 dark:text-violet-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Tous les groupes
            {activeTab === "all" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-violet-500" />
            )}
          </button>
        </div>
      </div>

      {/* Erreur globale */}
      {error && (
        <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/15 border border-rose-200 dark:border-rose-800/70 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* Skeleton shimmer : chargement initial des groupes */}
      {loading && !hasGroups && <GroupsSkeletonGrid />}

      {/* Aucun groupe existant du tout */}
      {showNoGroupAtAll && (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
          <p className="mb-2">
            Aucun groupe n’est encore disponible publiquement.
          </p>
          <p className="text-xs text-slate-400">
            Dès que des groupes seront créés et rendus visibles, ils
            apparaîtront ici.
          </p>
        </div>
      )}

      {/* Skeleton pendant le chargement des memberships dans "Mes groupes" */}
      {isAuthenticated &&
        isMineTab &&
        !loading &&
        gridMembershipsLoading &&
        hasGroups && <GroupsSkeletonGrid />}

      {/* Mes groupes vide (sans recherche) */}
      {showEmptyMineNoSearch && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-600 dark:text-slate-300">
          {isAuthenticated ? (
            <>
              Tu n’es encore membre d’aucun groupe.
              <br />
              Parcours l’onglet{" "}
              <span className="font-semibold">Tous les groupes</span> pour
              rejoindre ceux qui t’intéressent.
            </>
          ) : (
            <>
              Connecte-toi pour retrouver rapidement les groupes que tu as
              rejoints.
              <br />
              Tu peux déjà parcourir l’onglet{" "}
              <span className="font-semibold">Tous les groupes</span>.
            </>
          )}
        </div>
      )}

      {/* Aucun résultat pour la recherche dans l’onglet courant */}
      {showNoResultCurrent && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-600 dark:text-slate-300">
          Aucun groupe ne correspond à ta recherche dans cet onglet.
        </div>
      )}

      {/* Grille filtrée selon l’onglet */}
      {!loading &&
        !error &&
        (!isMineTab || !gridMembershipsLoading) &&
        hasFilteredCurrent && (
          <GroupsGrid
            groups={groupsToDisplay}
            memberships={membershipsMap}
            onSelectGroup={handleOpenGroup}
            onDiscussGroup={handleDiscussGroup}
          />
        )}

      {/* Modal détails du groupe */}
      {activeGroup && (
        <GroupDetailsModal
          group={activeGroup}
          membership={membership}
          loading={membershipLoading}
          error={membershipError}
          onClose={handleCloseModal}
          onToggleMembership={handleToggleMembership}
        />
      )}
    </section>
  );
}

/* ---------- Skeleton shimmer ---------- */

function GroupsSkeletonGrid() {
  return (
    <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className="h-full rounded-2xl overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-white/85 dark:bg-slate-950/80"
        >
          <div className="fm-shimmer h-24 sm:h-28 w-full" />
          <div className="p-4 space-y-3">
            <div className="fm-shimmer h-4 w-3/4 rounded" />
            <div className="fm-shimmer h-3 w-full rounded" />
            <div className="fm-shimmer h-3 w-2/3 rounded" />
            <div className="flex justify-between pt-2">
              <div className="fm-shimmer h-3 w-20 rounded" />
              <div className="fm-shimmer h-3 w-24 rounded" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
