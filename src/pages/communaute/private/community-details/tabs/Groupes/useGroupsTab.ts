// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\tabs\Groupes\useGroupsTab.ts
import { useEffect, useState } from "react";
import { listGroups, deleteGroup, type GroupLite } from "../../api/groups.api";
import { loadSession } from "../../../../../../auth/lib/storage";
import type {
  MembershipData,
  MembershipResponse,
  PublicGroup,
} from "../../../../public/sections/groupes/types";
import { API_BASE } from "../../../../../../lib/api";

type Session = { token?: string } | null;

function authHeaders(): Record<string, string> {
  const t = (loadSession() as Session)?.token;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

type Args = {
  communityId: string;
  isOwner: boolean;
  isMember: boolean;
  isAuthenticated: boolean;
};

export function useGroupsTab({ communityId, isOwner, isAuthenticated }: Args) {
  const [groups, setGroups] = useState<GroupLite[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [membershipsMap, setMembershipsMap] = useState<
    Record<string, MembershipData | undefined>
  >({});

  const [activeGroup, setActiveGroup] = useState<PublicGroup | null>(null);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<GroupLite | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasGroups = !!groups && groups.length > 0;

  /* ---------- Chargement de la liste ---------- */

  const load = async () => {
    if (!communityId) return;
    setLoading(true);
    setError(null);
    try {
      const items = await listGroups(communityId);
      setGroups(items);
    } catch (e) {
      const msg =
        e instanceof Error && e.message
          ? e.message
          : "Impossible de charger les groupes.";
      setError(msg);
    } finally {
      setLoading(false);
      setDeletingId(null);
    }
  };

  useEffect(() => {
    load();

    const handler = (e: Event & { detail?: { communityId?: string } }) => {
      if (!e.detail?.communityId || e.detail.communityId === communityId) {
        load();
      }
    };

    window.addEventListener("fm:groups:created", handler as EventListener);
    window.addEventListener("fm:groups:refresh", handler as EventListener);

    return () => {
      window.removeEventListener("fm:groups:created", handler as EventListener);
      window.removeEventListener("fm:groups:refresh", handler as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [communityId]);

  /* ---------- Chargement des memberships pour la grille ---------- */

  useEffect(() => {
    if (!groups || !isAuthenticated) return;

    const headers = authHeaders();
    if (!headers.Authorization) return;

    let cancelled = false;

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
            if (data) next[groupId] = data;
          }
          return next;
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groups, isAuthenticated]);

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

  const openJoinCommunity = () => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("fm:community:open-join", {
          detail: { communityId },
        })
      );
    }
  };

  /* ---------- Delete ---------- */

  const handleAskDelete = (g: GroupLite) => {
    if (!isOwner) return;
    setDeleteTarget(g);
  };

  const handleCancelDelete = () => {
    setDeleteTarget(null);
    setDeletingId(null);
  };

  const handleConfirmDelete = async () => {
    const g = deleteTarget;
    if (!g || deletingId) return;

    try {
      setDeletingId(g.id);
      await deleteGroup(g.id); // soft delete côté backend

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("fm:toast", {
            detail: {
              title: "Groupe supprimé",
              message: `Le groupe « ${g.name} » a été supprimé.`,
              tone: "success",
            },
          })
        );
      }

      setDeleteTarget(null);
      await load();
    } catch (e) {
      const msg =
        e instanceof Error && e.message
          ? e.message
          : "Suppression du groupe impossible.";
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("fm:toast", {
            detail: {
              title: "Erreur",
              message: msg,
              tone: "error",
            },
          })
        );
      }
      setDeletingId(null);
    }
  };

  /* ---------- Détails / join / leave ---------- */

  const handleOpenGroup = (groupLite: GroupLite) => {
    const asPublic: PublicGroup = {
      ...groupLite,
      communityName: undefined,
    };

    setActiveGroup(asPublic);

    const known = membershipsMap[groupLite.id];
    setMembership(
      known ?? {
        isMember: false,
        membersCount: groupLite.membersCount ?? 0,
      }
    );
    setMembershipError(null);

    const headers = authHeaders();
    if (!headers.Authorization) return;

    (async () => {
      setMembershipLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/communaute/groups/${groupLite.id}/membership`,
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
          [groupLite.id]: json.data,
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

  const handleToggleMembership = async () => {
    if (!activeGroup) return;

    const groupId = activeGroup.id;
    const groupName = activeGroup.name;
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

      const isAlreadyMember = membership?.isMember ?? false;
      const url = isAlreadyMember
        ? `${API_BASE}/communaute/groups/${groupId}/leave`
        : `${API_BASE}/communaute/groups/${groupId}/join`;

      const res = await fetch(url, { method: "POST", headers });

      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok || !json || json.ok === false) {
        const errorCode: string | undefined = json?.error;
        const serverMessage: string | undefined = json?.message;

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
            json?.error ||
            (isAlreadyMember
              ? "Impossible de quitter le groupe."
              : "Impossible de rejoindre le groupe.")
        );
      }

      const data = (json as MembershipResponse).data;
      if (!data) {
        throw new Error(
          membership?.isMember
            ? "Impossible de quitter le groupe."
            : "Impossible de rejoindre le groupe."
        );
      }

      setMembership(data);
      setMembershipsMap((prev) => ({
        ...prev,
        [groupId]: data,
      }));

      // MAJ du compteur côté liste
      setGroups((prev) =>
        prev
          ? prev.map((g) =>
              g.id === groupId ? { ...g, membersCount: data.membersCount } : g
            )
          : prev
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("fm:toast", {
            detail: {
              title: isAlreadyMember ? "Groupe quitté" : "Groupe rejoint",
              message: isAlreadyMember
                ? `Tu as quitté « ${groupName} »`
                : `Tu as rejoint « ${groupName} »`,
              tone: "success",
            },
          })
        );
      }

      // si on vient de rejoindre → ouvrir direct la discussion
      if (!isAlreadyMember && typeof window !== "undefined") {
        handleCloseModal();

        window.dispatchEvent(
          new CustomEvent("fm:open-messages", {
            detail: {
              variant: "group",
              groupId,
              name: groupName,
              avatar: activeGroup.coverUrl || undefined,
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

  /* ---------- DISCUTER depuis la carte ---------- */

  const handleDiscussGroup = (g: GroupLite) => {
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

  return {
    groups,
    loading,
    error,
    membershipsMap,
    activeGroup,
    membership,
    membershipLoading,
    membershipError,
    deleteTarget,
    deletingId,
    hasGroups,

    openAuthModal,
    openJoinCommunity,
    handleAskDelete,
    handleConfirmDelete,
    handleCancelDelete,
    handleOpenGroup,
    handleToggleMembership,
    handleCloseModal,
    handleDiscussGroup,
  };
}
