// src/pages/communaute/public/sections/Feed.tsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Users, X } from "lucide-react";

import FeedList from "@shared/components/feed/components/FeedList";
import {
  SidebarCard,
  SimilarCommunities,
} from "@shared/components/feed/components/Sidebar";
import { loadSession } from "@core/auth/lib/storage";
import PostComposer from "@shared/components/feed/PostComposer";
import { API_BASE } from "@core/api/client";

type FeedSubTab = "my" | "public";

const isMongoId = (s: string) => /^[a-f0-9]{24}$/i.test(String(s));
const safeGet = (k: string) => {
  try {
    return localStorage.getItem(k) ?? "";
  } catch {
    return "";
  }
};
const safeSet = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* no-op */
  }
};

type SessionShape =
  | {
      user?: { id?: unknown; _id?: unknown };
      userId?: unknown;
      token?: string;
    }
  | null
  | undefined;

function getCurrentUserIdFromSession(s: SessionShape): string | null {
  if (!s || typeof s !== "object") return null;
  const u = (s as { user?: { id?: unknown; _id?: unknown } }).user;
  const id1 =
    u && typeof u === "object" ? (u as { id?: unknown }).id : undefined;
  const id2 =
    u && typeof u === "object" ? (u as { _id?: unknown })._id : undefined;
  const id3 = (s as { userId?: unknown }).userId;
  const pick = [id1, id2, id3].find(
    (v) => typeof v === "string" && (v as string).length > 0
  );
  return (pick as string) ?? null;
}

export default function TabFeed() {
  const [subTab, setSubTab] = useState<FeedSubTab>("my");
  const [ownerId, setOwnerId] = useState<string | null>(null);

  // sidebar visible par défaut
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("fm:feed:sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    try {
      localStorage.setItem("fm:feed:sidebar-collapsed", next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const params = useParams();
  const [search] = useSearchParams();

  const fromParams =
    (params as Record<string, string | undefined>).communityId ??
    (params as Record<string, string | undefined>).id ??
    "";
  const fromQuery = search.get("communityId") ?? "";
  const fromState = (() => {
    const st = window.history?.state as { communityId?: string } | null;
    return st?.communityId ?? "";
  })();
  const fromPath = (() => {
    const m = window.location.pathname.match(/[a-f0-9]{24}/i);
    return m ? m[0] : "";
  })();
  const fromLS =
    safeGet("fm:community:lastId") || safeGet("fm:community:currentId");

  const communityId =
    (isMongoId(fromParams) && fromParams) ||
    (isMongoId(fromQuery) && fromQuery) ||
    (isMongoId(fromState) && fromState) ||
    (isMongoId(fromPath) && fromPath) ||
    (isMongoId(fromLS) && fromLS) ||
    "";

  useEffect(() => {
    if (isMongoId(communityId)) safeSet("fm:community:lastId", communityId);
  }, [communityId]);

  const base = useMemo(() => API_BASE.replace(/\/+$/, ""), []);

  // récupérer l’owner de la communauté (utile pour les droits)
  useEffect(() => {
    let cancelled = false;

    async function fetchOwner() {
      if (!communityId) {
        if (!cancelled) setOwnerId(null);
        return;
      }
      try {
        const r = await fetch(`${base}/communaute/communities/${communityId}`, {
          cache: "no-store",
        });
        if (r.ok) {
          type OwnerCore = { ownerId?: string; owner?: { id?: string } };
          type OwnerResp = { data?: OwnerCore } | OwnerCore | null;

          const j = (await r.json().catch(() => null)) as OwnerResp;
          const src: OwnerCore | null =
            j && "data" in (j as any) && (j as any).data
              ? ((j as any).data as OwnerCore)
              : (j as OwnerCore) ?? null;

          const oid =
            (src && src.ownerId) || (src && src.owner && src.owner.id) || null;

          if (!cancelled) setOwnerId(oid);
        } else if (!cancelled) {
          setOwnerId(null);
        }
      } catch {
        if (!cancelled) setOwnerId(null);
      }
    }

    void fetchOwner();
    return () => {
      cancelled = true;
    };
  }, [base, communityId]);

  // session + rôles
  const rawSession = (loadSession() ?? null) as SessionShape & {
    user?: { roles?: unknown };
    roles?: unknown;
  };

  const currentUserId = getCurrentUserIdFromSession(rawSession);

  const rolesValue =
    (rawSession?.user && (rawSession.user as any).roles) ??
    (rawSession as any)?.roles ??
    [];

  const userRoles: string[] = Array.isArray(rolesValue)
    ? (rolesValue as string[])
    : [];

  const isPlatformAdmin =
    userRoles.includes("admin") || userRoles.includes("superadmin");

  const isCommunityOwner =
    !!currentUserId && !!ownerId && currentUserId === ownerId;

  // 👉 celui qui peut gérer PUBLIC/PRIVÉ + PROGRAMMATION
  const canManageVisibilityAndSchedule = isCommunityOwner || isPlatformAdmin;

  function handleSwitchSubTab(next: FeedSubTab) {
    if (next === "my" && !currentUserId) {
      // pas connecté → on force la modale de connexion
      window.dispatchEvent(
        new CustomEvent("fm:open-account", { detail: { mode: "signin" } })
      );
      return;
    }
    setSubTab(next);
  }

  // Stub minimal pour PostComposer (création désactivée dans ce feed)
  const handleCreate = useCallback(
    async (): Promise<{ ok: boolean; message?: string }> => ({
      ok: false,
      message: "La création de publications n’est pas disponible sur ce flux.",
    }),
    []
  );

  // 🆕 scope envoyé au backend
  const visibilityScope: "my-communities" | "public-others" | undefined =
    currentUserId
      ? subTab === "my"
        ? "my-communities"
        : "public-others"
      : undefined;

  return (
    <>
      {/* Composer caché mais monté → permet d’ouvrir la modale d’édition */}
      <div style={{ display: "none" }}>
        <PostComposer
          onCreate={handleCreate}
          // ✅ ici on informe clairement le FullscreenEditor
          canManageVisibilityAndSchedule={canManageVisibilityAndSchedule}
        />
      </div>

      <style>
        {`
          [data-scrollfeed] { scrollbar-gutter: stable both-edges; }
          [data-scrollfeed] { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,.45) rgba(0,0,0,.06); }
          .dark [data-scrollfeed] { scrollbar-color: rgba(148,163,184,.35) rgba(255,255,255,.06); }
          [data-scrollfeed]::-webkit-scrollbar { width: 12px; height: 12px; }
          [data-scrollfeed]::-webkit-scrollbar-track { background: rgba(0,0,0,.06); border-radius: 9999px; }
          [data-scrollfeed]::-webkit-scrollbar-thumb { background: rgba(100,116,139,.45); border-radius: 9999px; border: 3px solid transparent; background-clip: content-box; }
          [data-scrollfeed]::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,.65); background-clip: content-box; }
          .dark [data-scrollfeed]::-webkit-scrollbar-track { background: rgba(255,255,255,.06); }
          .dark [data-scrollfeed]::-webkit-scrollbar-thumb { background: rgba(148,163,184,.35); border:3px solid transparent; background-clip: content-box; }
          .dark [data-scrollfeed]::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,.55); background-clip: content-box; }
        `}
      </style>

      <section className="py-4 sm:py-6">
        {/* conteneur centré + largeur max un peu plus grande */}
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          {/* Bouton pour réouvrir la sidebar si elle est fermée */}
          {isSidebarCollapsed && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={toggleSidebar}
                className="hidden lg:inline-flex items-center gap-2 rounded-xl bg-white/60 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-black/10 hover:bg-white dark:bg-white/5 dark:text-slate-200 dark:ring-white/10"
              >
                <Users className="h-4 w-4" />
                Afficher le top communautés
              </button>
            </div>
          )}

          {/* 2 colonnes : feed large + sidebar plus étroite */}
          <div
            className={`grid gap-6 ${
              isSidebarCollapsed
                ? "grid-cols-1"
                : "lg:grid-cols-[minmax(0,1.2fr)_280px] xl:grid-cols-[minmax(0,1.3fr)_300px]"
            }`}
          >
            {/* Colonne centrale */}
            <div className="min-w-0 space-y-4 sm:space-y-5">
              {/* Toggle Ma communauté / Public (autres commus) */}
              <div className="flex items-center justify-between max-w-full">
                <div className="flex items-center overflow-x-auto rounded-xl bg-white/60 p-1 ring-1 ring-black/10 dark:bg-white/5 dark:ring-white/10 max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {(
                    [
                      { k: "my", label: "Mes communautés" },
                      { k: "public", label: "Autres communautés" },
                    ] as const
                  ).map((o) => {
                    const active = subTab === o.k;
                    return (
                      <button
                        key={o.k}
                        onClick={() => handleSwitchSubTab(o.k)}
                        className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
                          active
                            ? "bg-violet-600 text-white"
                            : "text-slate-700 hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Liste des posts */}
              <FeedList
                communityId={communityId}
                currentUserId={currentUserId}
                pageSize={10}
                showDeleted={false}
                visibilityScope={visibilityScope}
              />

              <div className="h-4" />
            </div>

            {/* Colonne droite */}
            {!isSidebarCollapsed && (
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-4">
                  <SidebarCard
                    title="Les tops communautés"
                    icon={<Users className="h-5 w-5 text-violet-600" />}
                    actionLabel="Explorer"
                    onAction={() => {}}
                    headerAction={
                      <button
                        onClick={toggleSidebar}
                        className="rounded-lg p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
                        title="Réduire"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    }
                  >
                    <SimilarCommunities />
                  </SidebarCard>
                  <div className="h-4" />
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
