import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../../../lib/api";
import { loadSession } from "../../../../../auth/lib/storage";
import type { CommunityCardData } from "../../components/cards/CommunityCard";

/* ===========================
 * Types API
 * =========================== */
type ApiOwner = { id: string; fullName?: string; avatarUrl?: string };

type ApiCommunity = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  visibility?: "public" | "private";
  coverUrl?: string;
  logoUrl?: string;
  membersCount?: number;
  owner?: ApiOwner;
  createdAt?: string;
  updatedAt?: string;
};

type ApiListResponse =
  | { ok: true; data: { items: ApiCommunity[] } }
  | { ok: false; error: string };

type ApiCategoryItem = { key: string; label: string; count: number };

type ApiRequestsMy =
  | {
      ok: true;
      data: {
        items: {
          community: { id: string } | null;
          status: "pending" | "approved" | "rejected";
        }[];
      };
    }
  | { ok: false; error: string };

type ApiMembershipsMy =
  | { ok: true; data: { communityIds: string[] } }
  | { ok: false; error: string };

type ApiJoinResponse =
  | { ok: true; data: { status: "approved" | "pending" } }
  | { ok: false; error: string };

/** Réponse pour les moyennes d'avis */
type RatingsAvgItem = {
  communityId: string;
  avg: number | null;
  count: number;
};
type RatingsAvgResponse =
  | { ok: true; data: { items: RatingsAvgItem[] } }
  | { ok: false; error: string };

function authHeaders(): Record<string, string> {
  const token = loadSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Récupère l'ID utilisateur courant depuis la session (sans any). */
function getCurrentUserId(): string | null {
  const raw = loadSession() as unknown;
  if (raw && typeof raw === "object") {
    const obj = raw as { user?: { id?: unknown }; userId?: unknown };
    const fromUser = obj.user?.id;
    if (typeof fromUser === "string" && fromUser.length > 0) return fromUser;
    const fromRoot = obj.userId;
    if (typeof fromRoot === "string" && fromRoot.length > 0) return fromRoot;
  }
  return null;
}

export type JoinStatus = "none" | "pending" | "approved" | "rejected";
export type SortMode = "default" | "topRated";
export type SubTab = "mine" | "top" | "all";

export type BannerState = { kind: "success" | "error"; text: string } | null;

export type UseCommunautesResult = {
  // états UI globaux
  banner: BannerState;
  setBanner: (b: BannerState) => void;

  query: string;
  setQuery: (v: string) => void;

  sortMode: SortMode;
  setSortMode: (m: SortMode) => void;

  subTab: SubTab;
  setSubTab: (t: SubTab) => void;

  // catégories
  categoriesLabels: string[];
  selectedCategories: string[];
  toggleCategory: (label: string) => void;
  clearCategories: () => void;

  // chargement / erreurs
  loadingList: boolean;
  loadingCats: boolean;
  error: string | null;

  // données dérivées
  grid: CommunityCardData[];
  myGrid: CommunityCardData[];
  topGrid: CommunityCardData[];

  // besoins des cartes
  statusById: Record<string, JoinStatus>;
  joinCommunity: (c: CommunityCardData) => Promise<void>;
};

export function useCommunautesExplore(): UseCommunautesResult {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<ApiCommunity[]>([]);
  const [cats, setCats] = useState<ApiCategoryItem[]>([]);

  const [statusById, setStatusById] = useState<Record<string, JoinStatus>>({});
  const [membershipTick, setMembershipTick] = useState(0);

  const [ratingsById, setRatingsById] = useState<
    Record<string, { avg: number | null; count: number }>
  >({});

  const [banner, setBanner] = useState<BannerState>(null);

  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [subTab, setSubTab] = useState<SubTab>("mine");

  const currentUserId = getCurrentUserId();

  /* ------------------ Charge la liste publique ------------------ */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      setErr(null);
      try {
        const res = await fetch(`${API_BASE}/communaute/communities/public`, {
          headers: { ...authHeaders() },
          cache: "no-store",
        });
        const json = (await res.json()) as ApiListResponse;
        if (!cancelled) {
          if ("ok" in json && json.ok) {
            setItems(json.data.items || []);
          } else {
            setErr(
              (json as { error?: string })?.error || "Chargement impossible"
            );
          }
        }
      } catch {
        if (!cancelled) setErr("Connexion au serveur impossible.");
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ------------------ Construit les catégories ------------------ */
  useEffect(() => {
    if (!items.length) {
      setCats([]);
      return;
    }

    const map = new Map<string, ApiCategoryItem>();

    for (const c of items) {
      const raw = (c.category || "").trim();
      if (!raw) continue;

      const key = raw.toLowerCase();

      const label = String(raw)
        .replace(/[_-]+/g, " ")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/(^|\s)\S/g, (m) => m.toUpperCase());

      const existing = map.get(label);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(label, { key, label, count: 1 });
      }
    }

    const ordered = Array.from(map.values()).sort(
      (a, b) => (b.count ?? 0) - (a.count ?? 0)
    );

    setCats(ordered);
  }, [items]);

  const loadingCats = loadingList && !cats.length;

  /* -------- Statuts (membre/demande) -------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!authHeaders().Authorization) return;
      try {
        const [mReq, rReq] = await Promise.all([
          fetch(`${API_BASE}/communaute/memberships/my`, {
            headers: authHeaders(),
            cache: "no-store",
          }),
          fetch(`${API_BASE}/communaute/requests/my`, {
            headers: authHeaders(),
            cache: "no-store",
          }),
        ]);
        const m = (await mReq.json()) as ApiMembershipsMy;
        const r = (await rReq.json()) as ApiRequestsMy;
        if (cancelled) return;

        const map: Record<string, JoinStatus> = {};
        if (m.ok) for (const id of m.data.communityIds) map[id] = "approved";
        if (r.ok) {
          for (const it of r.data.items) {
            const id = it.community?.id;
            if (!id) continue;
            if (it.status === "pending") map[id] = "pending";
            if (it.status === "rejected") map[id] = "rejected";
            if (it.status === "approved") map[id] = "approved";
          }
        }
        setStatusById(map);
      } catch {
        /* silencieux */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items.length, membershipTick]);

  /* --------- écoute globale des changements d’adhésion --------- */
  useEffect(() => {
    function onMembershipChanged(e: Event) {
      const ev = e as CustomEvent<{ communityId?: string }>;
      const cid = ev.detail?.communityId;
      setMembershipTick((x) => x + 1);
      if (cid) {
        setStatusById((prev) => {
          const next = { ...prev };
          delete next[String(cid)];
          return next;
        });
      }
    }
    window.addEventListener(
      "fm:community:membership-changed",
      onMembershipChanged
    );
    return () => {
      window.removeEventListener(
        "fm:community:membership-changed",
        onMembershipChanged
      );
    };
  }, []);

  /* -------- Récupère les moyennes d'avis -------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!items.length) {
        setRatingsById({});
        return;
      }
      try {
        const ids = items.map((c) => c.id).filter(Boolean);
        const url = `${API_BASE}/communaute/communities/ratings/avg?ids=${encodeURIComponent(
          ids.join(",")
        )}`;
        const res = await fetch(url, { cache: "no-store" });
        const json = (await res.json()) as RatingsAvgResponse;

        if (cancelled) return;

        if ("ok" in json && json.ok) {
          const map: Record<string, { avg: number | null; count: number }> = {};
          for (const it of json.data.items || []) {
            map[it.communityId] = { avg: it.avg, count: it.count };
          }
          setRatingsById(map);
        } else {
          setRatingsById({});
        }
      } catch {
        if (!cancelled) setRatingsById({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items]);

  /* ------------------ Utilitaires catégories ------------------ */
  const categoriesLabels = useMemo<string[]>(
    () => cats.map((c) => c.label),
    [cats]
  );

  const labelToKey = useMemo<Map<string, string>>(() => {
    const m = new Map<string, string>();
    for (const c of cats) m.set(c.label, c.key);
    return m;
  }, [cats]);

  const toggleCategory = useCallback((label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }, []);

  const clearCategories = useCallback(() => {
    setSelected([]);
  }, []);

  /* ------------------ Join / Request ------------------ */
  const joinCommunity = useCallback(async (c: CommunityCardData) => {
    const token = loadSession()?.token;
    if (!token) {
      try {
        const from =
          window.location.pathname +
          window.location.search +
          window.location.hash;
        localStorage.setItem("fm:auth:intent", from);
      } catch {
        /* no-op */
      }
      window.dispatchEvent(
        new CustomEvent("fm:open-account", { detail: { mode: "signin" } })
      );
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/communaute/memberships/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ communityId: c.id, note: "" }),
      });

      if (res.status === 401) {
        window.dispatchEvent(
          new CustomEvent("fm:open-account", { detail: { mode: "signin" } })
        );
        return;
      }
      if (res.status === 403) {
        setBanner({
          kind: "error",
          text: "Action non autorisée. Accès réservé aux membres de cette communauté.",
        });
        return;
      }

      const resp = (await res.json()) as ApiJoinResponse;

      if (!resp.ok) {
        setBanner({
          kind: "error",
          text: resp.error || "Action impossible",
        });
        return;
      }

      setStatusById((prev) => ({
        ...prev,
        [String(c.id)]: resp.data.status,
      }));
      setItems((prev) =>
        prev.map((it) =>
          String(it.id) === String(c.id)
            ? {
                ...it,
                membersCount:
                  resp.data.status === "approved"
                    ? Number(it.membersCount || 0) + 1
                    : it.membersCount,
              }
            : it
        )
      );

      setBanner({
        kind: "success",
        text:
          resp.data.status === "approved"
            ? "Vous avez rejoint la communauté."
            : "Demande envoyée. En attente d’approbation.",
      });

      window.dispatchEvent(
        new CustomEvent("fm:community:membership-changed", {
          detail: { communityId: c.id },
        })
      );
    } catch {
      setBanner({
        kind: "error",
        text: "Impossible de traiter la demande.",
      });
    }
  }, []);

  /* ------------------ Liste filtrée ------------------ */
  const filteredCommunities = useMemo(() => {
    const q = query.trim().toLowerCase();

    const selectedKeys = new Set(
      selected
        .map((lbl) => labelToKey.get(lbl))
        .filter((k): k is string => typeof k === "string" && k.length > 0)
    );

    return items.filter((c) => {
      const name = c.name?.toLowerCase() || "";
      const desc = c.description?.toLowerCase() || "";
      const ownerName = c.owner?.fullName?.toLowerCase() || "";
      const hasText =
        !q ||
        name.includes(q) ||
        desc.includes(q) ||
        ownerName.includes(q) ||
        c.slug.toLowerCase().includes(q);

      const okCats =
        selectedKeys.size === 0 ||
        (c.category ? selectedKeys.has(String(c.category)) : false);

      return hasText && okCats;
    });
  }, [items, query, selected, labelToKey]);

  /* ------------------ Grille globale ------------------ */
  const grid: CommunityCardData[] = useMemo(() => {
    let base = filteredCommunities;

    if (sortMode === "topRated") {
      base = [...base].sort((a, b) => {
        const ra = ratingsById[a.id]?.avg ?? 0;
        const rb = ratingsById[b.id]?.avg ?? 0;
        if (rb !== ra) return rb - ra;
        const ma = a.membersCount ?? 0;
        const mb = b.membersCount ?? 0;
        return mb - ma;
      });
    }

    return base.map<CommunityCardData>((c) => {
      const isOwner =
        currentUserId &&
        c.owner?.id &&
        String(c.owner.id) === String(currentUserId);
      const status = statusById[String(c.id)] || "none";
      const role: "owner" | "member" | "none" = isOwner
        ? "owner"
        : status === "approved"
        ? "member"
        : "none";

      const r = ratingsById[c.id];
      const rating = typeof r?.avg === "number" ? r.avg : 0;

      return {
        id: c.id,
        name: c.name,
        coverSrc: c.coverUrl || "/img/placeholder/cover.svg",
        logoSrc: c.logoUrl || "/img/placeholder/community-logo.svg",
        rating,
        followers: c.membersCount ?? 0,
        owner: {
          name: c.owner?.fullName || "Admin",
          avatar:
            c.owner?.avatarUrl ||
            "https://fullmargin-cdn.b-cdn.net/WhatsApp%20Image%202025-12-02%20%C3%A0%2008.45.46_8b1f7d0a.jpg",
        },
        tags: c.category ? [c.category] : [],
        type: c.visibility === "private" ? "private" : "free",
        href: `/communaute/${encodeURIComponent(c.slug)}`,
        description: c.description || "",
        role,
      };
    });
  }, [filteredCommunities, sortMode, ratingsById, currentUserId, statusById]);

  const myGrid = useMemo(
    () => grid.filter((c) => c.role === "owner" || c.role === "member"),
    [grid]
  );

  const topGrid = useMemo(() => {
    const sorted = [...grid].sort((a, b) => {
      const ra = a.rating ?? 0;
      const rb = b.rating ?? 0;
      if (rb !== ra) return rb - ra;
      const fa = a.followers ?? 0;
      const fb = b.followers ?? 0;
      return fb - fa;
    });
    return sorted.slice(0, 12);
  }, [grid]);

  // ⚡ Auto-switch de tab quand on fait une recherche
  useEffect(() => {
    const q = query.trim();
    if (!q) return; // pas de recherche → ne pas bouger l'onglet

    const mineCount = myGrid.length;
    const topCount = topGrid.length;
    const allCount = grid.length;

    // Si l'onglet courant n'a aucun résultat, on essaie un autre
    if (subTab === "mine" && mineCount === 0) {
      if (topCount > 0) {
        setSubTab("top");
      } else if (allCount > 0) {
        setSubTab("all");
      }
    } else if (subTab === "top" && topCount === 0) {
      if (mineCount > 0) {
        setSubTab("mine");
      } else if (allCount > 0) {
        setSubTab("all");
      }
    } else if (subTab === "all" && allCount === 0) {
      if (mineCount > 0) {
        setSubTab("mine");
      } else if (topCount > 0) {
        setSubTab("top");
      }
    }
  }, [query, subTab, myGrid.length, topGrid.length, grid.length, setSubTab]);

  return {
    banner,
    setBanner,
    query,
    setQuery,
    sortMode,
    setSortMode,
    subTab,
    setSubTab,
    categoriesLabels,
    selectedCategories: selected,
    toggleCategory,
    clearCategories,
    loadingList,
    loadingCats,
    error: err,
    grid,
    myGrid,
    topGrid,
    statusById,
    joinCommunity,
  };
}
