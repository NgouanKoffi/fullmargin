// src/pages/communaute/private/community-details/tabs/DemandesTab.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { LogIn } from "lucide-react";

import { API_BASE } from "../../../../../lib/api";
import { loadSession } from "../../../../../auth/lib/storage";

import MyRequestsList from "./Demandes/MyRequestsList";
import IncomingRequestsList from "./Demandes/IncomingRequestsList";
import type { DemandesSubTab } from "./Demandes/DemandesTabsBar";
import {
  approveRequest,
  listIncomingRequests,
  listMyCommunities,
  listMyRequests,
  rejectRequest,
  leaveCommunity,
  type CommunityLite,
  type IncomingRequestItem,
  type MyRequestItem,
  type RequestFilter,
  markMyRequestNotificationsAsSeen,
} from "../services/requests.service";
import DemandesShell from "./Demandes/DemandesShell";
import EmptyState from "./Demandes/ui/EmptyState";
import DemandesTabsBar from "./Demandes/DemandesTabsBar";
import MyCommunitiesList from "./Demandes/MyCommunitiesList";

function getAuthHeader(): string {
  const token = (loadSession() as { token?: string } | null)?.token;
  return token ? `Bearer ${token}` : "";
}

function openAuthModal(mode: "signin" | "signup" = "signin") {
  try {
    const from =
      window.location.pathname + window.location.search + window.location.hash;
    localStorage.setItem("fm:auth:intent", from);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } })
  );
}

const parseSub = (v: string | null): DemandesSubTab =>
  v === "incoming" || v === "communities" ? v : "mine";

const parseIncomingFilter = (v: string | null): RequestFilter =>
  v === "approved" || v === "rejected" ? (v as RequestFilter) : "pending";

const parseMineFilter = (v: string | null): MyRequestItem["status"] =>
  v === "approved" || v === "rejected"
    ? (v as MyRequestItem["status"])
    : "pending";

function normalizeStatus(
  raw: string | undefined | null
): "pending" | "approved" | "rejected" {
  const s = (raw || "").toLowerCase();
  if (
    s === "approved" ||
    s === "accepted" ||
    s === "acceptee" ||
    s === "acceptée"
  ) {
    return "approved";
  }
  if (
    s === "rejected" ||
    s === "refused" ||
    s === "refusee" ||
    s === "refusée"
  ) {
    return "rejected";
  }
  return "pending";
}

export default function DemandesTab() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [sub, setSub] = useState<DemandesSubTab>(
    parseSub(searchParams.get("sub"))
  );
  const [mineFilter, setMineFilter] = useState<MyRequestItem["status"]>(
    parseMineFilter(searchParams.get("mstatus"))
  );
  const [incomingFilter, setIncomingFilter] = useState<RequestFilter>(
    parseIncomingFilter(searchParams.get("istatus"))
  );

  const [loadingMine, setLoadingMine] = useState(true);
  const [loadingIncoming, setLoadingIncoming] = useState(true);
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  const [myItems, setMyItems] = useState<MyRequestItem[]>([]);

  // 👇 on stocke TOUTES les demandes reçues, pas seulement le filtre courant
  const [incomingAll, setIncomingAll] = useState<{
    pending: IncomingRequestItem[];
    approved: IncomingRequestItem[];
    rejected: IncomingRequestItem[];
  }>({ pending: [], approved: [], rejected: [] });

  const [communities, setCommunities] = useState<CommunityLite[]>([]);

  const [errorMine, setErrorMine] = useState<string | null>(null);
  const [errorIncoming, setErrorIncoming] = useState<string | null>(null);
  const [errorCommunities, setErrorCommunities] = useState<string | null>(null);

  const [communityId, setCommunityId] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const [leavingId, setLeavingId] = useState<string | null>(null);

  // 👉 badge "mes demandes" : on le met à 0 dès qu’on ouvre l’onglet
  const [unreadMine, setUnreadMine] = useState(0);

  const bearer = getAuthHeader();
  const isAuthed = !!bearer;

  /* sync URL (en conservant les autres params comme ?tab=...) */
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    let changed = false;

    if (next.get("sub") !== sub) {
      next.set("sub", sub);
      changed = true;
    }
    if (next.get("mstatus") !== mineFilter) {
      next.set("mstatus", mineFilter);
      changed = true;
    }
    if (next.get("istatus") !== incomingFilter) {
      next.set("istatus", incomingFilter);
      changed = true;
    }

    if (changed) {
      setSearchParams(next, { replace: true });
    }
  }, [sub, mineFilter, incomingFilter, searchParams, setSearchParams]);

  /* charger l’id de ma communauté (owner) */
  const loadCommunityId = useCallback(async () => {
    try {
      const base = API_BASE.replace(/\/+$/, "");
      const res = await fetch(`${base}/communaute/communities/my`, {
        headers: {
          Authorization: bearer,
          Accept: "application/json",
        },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("COMMUNITY_LOAD_FAILED");
      const json = (await res.json()) as {
        ok: boolean;
        data?: { items?: Array<{ id?: string; _id?: string }> };
      };
      const first = json.data?.items?.[0];
      const id = String(first?.id ?? first?._id ?? "");
      setCommunityId(id || null);
      return id || null;
    } catch {
      setCommunityId(null);
      return null;
    }
  }, [bearer]);

  /* ====== MES DEMANDES ====== */
  useEffect(() => {
    if (!isAuthed) return;
    let stop = false;
    (async () => {
      setLoadingMine(true);
      setErrorMine(null);
      try {
        const items = await listMyRequests();
        const normalized = (items || []).map((it) => ({
          ...it,
          status: normalizeStatus(it.status),
        }));
        if (!stop) setMyItems(normalized);

        // 👉 on considère que l’utilisateur a “vu” les réponses
        await markMyRequestNotificationsAsSeen();
        window.dispatchEvent(new CustomEvent("fm:community-req-mark-read"));
        if (!stop) setUnreadMine(0);
      } catch {
        if (!stop)
          setErrorMine(
            "Impossible de charger vos demandes envoyées. Réessayez plus tard."
          );
      } finally {
        if (!stop) setLoadingMine(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [isAuthed]);

  /* ====== DEMANDES REÇUES ====== */
  const reloadIncomingAll = useCallback(async (cid: string) => {
    // on charge TOUT pour que les compteurs soient bons
    const [p, a, r] = await Promise.all([
      listIncomingRequests(cid, "pending"),
      listIncomingRequests(cid, "approved"),
      listIncomingRequests(cid, "rejected"),
    ]);
    return {
      pending: p.map((x) => ({ ...x, status: normalizeStatus(x.status) })),
      approved: a.map((x) => ({ ...x, status: normalizeStatus(x.status) })),
      rejected: r.map((x) => ({ ...x, status: normalizeStatus(x.status) })),
    };
  }, []);

  useEffect(() => {
    if (!isAuthed) return;
    let stop = false;
    (async () => {
      setLoadingIncoming(true);
      setErrorIncoming(null);
      const cid = await loadCommunityId();
      if (!cid) {
        if (!stop) {
          setIncomingAll({ pending: [], approved: [], rejected: [] });
          setLoadingIncoming(false);
        }
        return;
      }
      try {
        const all = await reloadIncomingAll(cid);
        if (!stop) setIncomingAll(all);
      } catch {
        if (!stop)
          setErrorIncoming("Impossible de charger les demandes reçues.");
      } finally {
        if (!stop) setLoadingIncoming(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [isAuthed, loadCommunityId, reloadIncomingAll]);

  /* ====== MES COMMUNAUTÉS ====== */
  useEffect(() => {
    if (!isAuthed) return;
    let stop = false;
    (async () => {
      setLoadingCommunities(true);
      setErrorCommunities(null);
      try {
        const items = await listMyCommunities();
        if (!stop) setCommunities(items);
      } catch {
        if (!stop)
          setErrorCommunities(
            "Impossible de charger vos communautés. Réessayez plus tard."
          );
      } finally {
        if (!stop) setLoadingCommunities(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, [isAuthed]);

  /* ====== compteurs pour les listes ====== */
  const myCounts = useMemo(() => {
    const base: { pending: number; approved: number; rejected: number } = {
      pending: 0,
      approved: 0,
      rejected: 0,
    };
    for (const it of myItems) {
      const s = normalizeStatus(it.status);
      base[s] = base[s] + 1;
    }
    return base;
  }, [myItems]);

  const incomingCounts = useMemo(() => {
    return {
      pending: incomingAll.pending.length,
      approved: incomingAll.approved.length,
      rejected: incomingAll.rejected.length,
    };
  }, [incomingAll]);

  /* ====== action owner ====== */
  const doAction = async (reqId: string, action: "approve" | "reject") => {
    if (!communityId) return;
    try {
      setActing(reqId);
      if (action === "approve") {
        await approveRequest(reqId);
      } else {
        await rejectRequest(reqId);
      }
      // on recharge toutes les listes pour rafraîchir les compteurs
      const all = await reloadIncomingAll(communityId);
      setIncomingAll(all);
      window.dispatchEvent(
        new CustomEvent("fm:community-req-counters:force-refresh")
      );
    } finally {
      setActing(null);
    }
  };

  /* ====== désabonnement ====== */
  const handleLeaveCommunity = async (c: CommunityLite) => {
    setLeavingId(c.id);
    try {
      await leaveCommunity(c.id);

      window.dispatchEvent(
        new CustomEvent("fm:toast", {
          detail: {
            type: "success",
            title: "Désabonnement réussi",
            message: `Tu as quitté "${c.name}".`,
          },
        })
      );

      setCommunities((prev) => prev.filter((x) => x.id !== c.id));

      window.dispatchEvent(
        new CustomEvent("fm:community-req-counters:force-refresh")
      );
    } catch {
      window.dispatchEvent(
        new CustomEvent("fm:toast", {
          detail: {
            type: "error",
            title: "Erreur",
            message: "Impossible de te désabonner. Réessaie.",
          },
        })
      );
    } finally {
      setLeavingId(null);
    }
  };

  /* ====== filtrage ====== */
  const myFiltered = useMemo(
    () => myItems.filter((it) => normalizeStatus(it.status) === mineFilter),
    [myItems, mineFilter]
  );

  const incomingFiltered = useMemo(() => {
    if (incomingFilter === "pending") return incomingAll.pending;
    if (incomingFilter === "approved") return incomingAll.approved;
    return incomingAll.rejected;
  }, [incomingAll, incomingFilter]);

  /* ====== rendu ====== */
  if (!isAuthed) {
    return (
      <DemandesShell title="Demandes">
        <EmptyState
          title="Connexion requise"
          description="Connecte-toi pour voir tes demandes, celles reçues et tes communautés."
          icon={<LogIn className="w-5 h-5" />}
          action={
            <button
              onClick={() => openAuthModal("signin")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-sm"
            >
              <LogIn className="w-4 h-4" />
              Se connecter
            </button>
          }
        />
      </DemandesShell>
    );
  }

  // 👉 maintenant : badge = tout ce qui est “nouveau” (mais on l’a mis à 0 à l’arrivée)
  const mineBadge = unreadMine;
  const incomingBadge = incomingCounts.pending;
  const communitiesBadge = communities.length;

  return (
    <DemandesShell title="Demandes">
      <DemandesTabsBar
        active={sub}
        onSelect={setSub}
        mineCount={mineBadge}
        incomingCount={incomingBadge}
        communitiesCount={communitiesBadge}
      />

      <div className="mt-5 space-y-5">
        {sub === "mine" && (
          <MyRequestsList
            loading={loadingMine}
            error={errorMine}
            items={myFiltered}
            currentFilter={mineFilter}
            onChangeFilter={setMineFilter}
            counts={myCounts}
          />
        )}

        {sub === "incoming" && (
          <IncomingRequestsList
            loading={loadingIncoming}
            error={errorIncoming}
            requests={incomingFiltered}
            currentFilter={incomingFilter}
            onChangeFilter={setIncomingFilter}
            hasCommunity={!!communityId}
            onAction={doAction}
            actingId={acting}
            counts={incomingCounts}
          />
        )}

        {sub === "communities" && (
          <MyCommunitiesList
            loading={loadingCommunities}
            error={errorCommunities}
            items={communities}
            onUnsubscribe={handleLeaveCommunity}
            leavingId={leavingId}
          />
        )}
      </div>
    </DemandesShell>
  );
}
