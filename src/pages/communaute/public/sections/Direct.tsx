// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\sections\Direct.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlayCircle } from "lucide-react";

import SearchBar from "../components/SearchBar";
import AvatarsScroller, {
  type AvatarCard,
} from "../components/AvatarsScroller";
import { softCard } from "../components/ui";
import { API_BASE } from "../../../../lib/api";
import { loadSession } from "../../../../auth/lib/storage";

type PublicLive = {
  id: string;
  title: string;
  communityId: string;
  communityName: string;
  communitySlug: string | null;
  communityAvatar: string | null;
  startsAt: string | null;
  plannedEndAt?: string | null;
};

type LivesApiResponse = {
  ok: boolean;
  data?: { items?: PublicLive[] };
  error?: string;
};

function authHeaders(): HeadersInit {
  const tok = (loadSession() as { token?: string } | null)?.token ?? "";
  return tok ? { Authorization: `Bearer ${tok}` } : {};
}

export function TabDirect() {
  const [query, setQuery] = useState("");
  const [lives, setLives] = useState<PublicLive[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Charger les lives publics en cours
  useEffect(() => {
    const fetchLives = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/communaute/lives/public-live`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
        });

        // si pas connecté -> 401
        if (res.status === 401) {
          setError("Connecte-toi à FullMargin pour voir les directs en cours.");
          setLives([]);
          return;
        }

        const json = (await res.json()) as LivesApiResponse;
        if (!json.ok) {
          throw new Error(json.error || "Impossible de charger les directs.");
        }

        const items = json.data?.items ?? [];
        setLives(items);
      } catch (e) {
        setError(
          (e as Error).message || "Impossible de charger les directs publics."
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchLives();
  }, []);

  // Filtrage par recherche
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lives;
    return lives.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.communityName.toLowerCase().includes(q)
    );
  }, [lives, query]);

  // Avatars en haut : un avatar par live
  const liveAvatars = useMemo<AvatarCard[]>(() => {
    return lives.map((l) => ({
      src: l.communityAvatar || "/img/placeholder-community.png",
      label: l.communityName,
      href: `/direct/${l.id}`,
      live: true,
      subscribers: undefined, // tu pourras mettre un compteur “viewers” plus tard
    }));
  }, [lives]);

  const showEmptyState = !loading && !error && visible.length === 0;

  const emptyTitle = query
    ? "Aucun direct ne correspond à ta recherche"
    : "Aucun direct en cours pour le moment";

  const emptySubtitle = query
    ? "Essaye avec un autre mot-clé ou explore les communautés actives."
    : "Dès qu’un direct commencera sur FullMargin, il apparaîtra ici.";

  return (
    <>
      {/* Barre de recherche */}
      <SearchBar
        className="mt-4"
        placeholder="Rechercher un direct ou une communauté…"
        onSearch={setQuery}
        defaultValue={query}
      />

      {/* Ligne d’avatars : directs en cours */}
      {lives.length > 0 && (
        <AvatarsScroller
          title="En direct maintenant"
          items={liveAvatars}
          className="mt-4"
        />
      )}

      {/* Grille des directs */}
      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading && (
          <div className="col-span-full text-sm text-slate-500 dark:text-slate-400">
            Chargement des directs…
          </div>
        )}

        {!loading && error && (
          <div className="col-span-full text-sm text-red-500">{error}</div>
        )}

        {showEmptyState && (
          <div className="col-span-full">
            <div
              className={`${softCard} flex flex-col items-center justify-center py-10 px-4 text-center`}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <PlayCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {emptyTitle}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {emptySubtitle}
              </p>

              <Link
                to="/communaute?tab=communautes"
                className="mt-4 inline-flex items-center rounded-full border border-primary/40 px-4 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-white transition-colors"
              >
                Explorer les communautés
              </Link>
            </div>
          </div>
        )}

        {!loading &&
          !error &&
          visible.map((live) => {
            const startLabel = live.startsAt
              ? new Date(live.startsAt).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null;

            const endLabel = live.plannedEndAt
              ? new Date(live.plannedEndAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null;

            const communityHref = live.communitySlug
              ? `/communaute/${live.communitySlug}`
              : `/communaute`;

            return (
              <Link
                key={live.id}
                to={`/direct/${live.id}`}
                className={`${softCard} p-4 hover:bg-white/90 dark:hover:bg-white/[0.09]`}
              >
                <div className="aspect-video rounded-xl bg-gradient-to-tr from-emerald-500/40 to-fuchsia-500/40 grid place-items-center relative overflow-hidden">
                  <PlayCircle className="w-9 h-9" />
                  <span className="absolute top-2 left-2 text-[11px] px-2 py-0.5 rounded-full bg-red-600 text-white font-semibold">
                    LIVE
                  </span>
                </div>

                <div className="mt-3 text-sm">
                  <p className="font-semibold line-clamp-2">{live.title}</p>

                  {/* ⚠️ PAS DE <Link> ICI → sinon <a> dans <a> */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault(); // ne pas suivre /direct/:id
                      e.stopPropagation(); // ne pas déclencher le Link parent
                      navigate(communityHref);
                    }}
                    className="mt-1 block text-left text-xs text-slate-500 dark:text-slate-300 hover:underline"
                  >
                    {live.communityName}
                  </button>

                  {startLabel && (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Début : {startLabel}
                      {endLabel && ` — fin prévue ${endLabel}`}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
      </section>
    </>
  );
}
