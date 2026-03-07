// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\podcasts\index.tsx
import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Filter, CalendarDays } from "lucide-react";
import { CATEGORIES } from "./constants";
import type { Podcast } from "./types";
import {
  listPodcasts,
  createPodcast,
  updatePodcast,
  deletePodcast,
  togglePublish,
  type ListParams,
} from "./api";
import { api } from "@core/api/client";
import Modal from "./components/Modal";
import Confirm from "./components/Confirm";
import PodcastForm from "./components/PodcastForm";
import PodcastCard from "./components/PodcastCard";
import PodcastDetail from "./components/PodcastDetail";

/* ----------------------- Helpers typés ----------------------- */
type StatusFilter = "all" | "publie" | "brouillon";
type LanguageFilter = "" | "fr" | "en";

function extractUserIdFromMe(resp: unknown): string | undefined {
  if (!resp || typeof resp !== "object") return undefined;
  const r = resp as Record<string, unknown>;
  const data =
    r.ok === true && r.data && typeof r.data === "object"
      ? (r.data as Record<string, unknown>)
      : r;

  const user =
    data.user && typeof data.user === "object"
      ? (data.user as Record<string, unknown>)
      : undefined;
  const id = (user?.id ?? data.id ?? data.userId) as unknown;

  return id == null ? undefined : String(id);
}

type WindowWithSession = Window & {
  __SESSION?: { user?: { id?: string | number } };
};
function extractUserIdFromWindow(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as WindowWithSession;
  const id = w.__SESSION?.user?.id;
  return id == null ? undefined : String(id);
}

/* ============================================================ */

const LANGUAGE_OPTIONS: ReadonlyArray<{ value: "fr" | "en"; label: string }> = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

export default function AdminPodcastsPage() {
  const [list, setList] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // user courant (pour afficher “Moi”)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(
    undefined
  );

  // Filtres
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // ouverture/fermeture du bloc filtres
  const [filtersOpen, setFiltersOpen] = useState<boolean>(true);

  // Modales / états
  const [openNew, setOpenNew] = useState(false);
  const [editItem, setEditItem] = useState<Podcast | null>(null);
  const [askDelete, setAskDelete] = useState<Podcast | null>(null);
  const [openDetail, setOpenDetail] = useState<Podcast | null>(null);

  // -------- récup me (id utilisateur)
  useEffect(() => {
    (async () => {
      try {
        const j = (await api.get("/auth/me", {
          cache: "no-store",
        })) as unknown;
        const id = extractUserIdFromMe(j) ?? extractUserIdFromWindow();
        if (id) setCurrentUserId(id);
      } catch {
        const id = extractUserIdFromWindow();
        if (id) setCurrentUserId(id);
      }
    })();
  }, []);

  // -------- chargement serveur
  const params: ListParams = useMemo(() => {
    const p: ListParams = {}; // 👈 pas de limit ici
    if (query.trim()) p.q = query.trim();
    if (statusFilter !== "all") p.status = statusFilter;
    if (categoryFilter) p.category = categoryFilter;
    if (languageFilter) p.language = languageFilter;
    if (dateFrom) p.from = new Date(dateFrom).toISOString();
    if (dateTo) p.to = new Date(dateTo).toISOString();
    return p;
  }, [query, statusFilter, categoryFilter, languageFilter, dateFrom, dateTo]);

  async function refresh() {
    setLoading(true);
    try {
      const all: Podcast[] = [];
      let cursor: string | null = null;
      let guard = 0; // sécurité pour éviter une boucle infinie

      do {
        const { items, nextCursor } = await listPodcasts({
          ...params,
          cursor: cursor || undefined,
          // 👇 tu peux mettre 200 ici, c’est le max du backend
          limit: 200,
        });

        all.push(...items);
        cursor = nextCursor;
        guard++;
      } while (cursor && guard < 200);

      setList(all);
    } catch (e) {
      console.warn("Chargement podcasts échoué:", e);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.q,
    params.status,
    params.category,
    params.language,
    params.from,
    params.to,
  ]);

  // -------- upsert
  async function upsert(
    values: Partial<Podcast> & { fileAudio?: File; fileCover?: File }
  ) {
    // 🔒 mini validation front (au cas où le form est bypassé)
    const hasTitle = !!values.title && values.title.trim().length > 0;
    const hasCategory = !!values.category && values.category.trim().length > 0;
    const hasHtml = !!values.html && values.html.trim().length > 0;

    // si on édite, on peut garder l’ancienne cover/audio
    const hasCover =
      !!values.fileCover ||
      !!values.coverUrl ||
      !!(editItem && editItem.coverUrl);
    const hasAudio =
      !!values.fileAudio ||
      !!values.audioUrl ||
      !!(editItem && editItem.audioUrl);

    if (!hasTitle || !hasCategory || !hasHtml || !hasCover || !hasAudio) {
      alert(
        "Titre, catégorie, description, couverture et audio sont obligatoires."
      );
      return;
    }

    try {
      if (editItem) {
        await updatePodcast(editItem.id, {
          title: values.title,
          author: values.author,
          category: values.category!,
          html: values.html,
          duration: values.duration,
          fileCover: values.fileCover,
          fileAudio: values.fileAudio,
          language: values.language as "fr" | "en" | undefined,
        });
        setEditItem(null);
      } else {
        await createPodcast({
          title: values.title!,
          author: values.author,
          category: values.category!,
          html: values.html,
          duration: values.duration,
          fileCover: values.fileCover,
          fileAudio: values.fileAudio,
          language: values.language as "fr" | "en" | undefined,
        });
        setOpenNew(false);
      }
    } catch (e) {
      console.warn("Sauvegarde podcast échouée:", e);
    } finally {
      await refresh();
    }
  }

  async function onTogglePublish(p: Podcast) {
    try {
      const r = await togglePublish(p.id);
      setList((cur) =>
        cur.map((x) =>
          x.id === p.id
            ? {
                ...x,
                status: r.status,
                publishedAt: r.publishedAt ?? undefined,
              }
            : x
        )
      );
    } catch (e) {
      console.warn("Toggle publish échoué:", e);
    }
  }

  async function removeItem(p: Podcast) {
    try {
      await deletePodcast(p.id);
      setList((cur) => cur.filter((x) => x.id !== p.id));
    } catch (e) {
      console.warn("Suppression podcast échouée:", e);
    } finally {
      setAskDelete(null);
      if (openDetail?.id === p.id) setOpenDetail(null);
    }
  }

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setCategoryFilter("");
    setLanguageFilter("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-gradient-to-b from-violet-50 via-white to-white dark:from-[#0b0c10] dark:via-[#0b0c10] dark:to-[#0b0c10]">
      <div className="mx-auto w-full max-w-[1400px] 2xl:max-w-[1600px] px-4 lg:px-6 py-6">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Podcasts — Admin</h1>
            <p className="text-sm opacity-70">
              Gère l’upload, l’édition, la publication et la suppression de tes
              podcasts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenNew(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-white shadow hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              Nouveau podcast
            </button>
          </div>
        </div>

        {/* Filtres pliables */}
        <div className="mb-6 rounded-2xl border bg-white shadow-sm ring-1 ring-black/10 dark:border-white/5 dark:bg-neutral-900 dark:ring-white/10">
          {/* header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4" /> Filtres
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs opacity-60 sm:inline">
                {loading
                  ? "Chargement…"
                  : `${list.length} élément${list.length > 1 ? "s" : ""}`}
              </span>
              <button
                type="button"
                onClick={() => setFiltersOpen((v) => !v)}
                className="text-xs rounded-full px-3 py-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition"
              >
                {filtersOpen ? "Masquer" : "Afficher"}
              </button>
            </div>
          </div>

          {filtersOpen && (
            <div className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                {/* Recherche */}
                <div className="grid gap-2 md:col-span-2">
                  <label className="text-xs opacity-70">Recherche</label>
                  <div className="flex items-center gap-2 rounded-xl ring-1 ring-black/10 px-3 py-2 dark:ring-white/10 dark:bg-neutral-900/60">
                    <Search className="h-4 w-4 opacity-60" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Titre, auteur…"
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Catégorie */}
                <div className="grid gap-2">
                  <label className="text-xs opacity-70">Catégorie</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-xl px-3 py-2 ring-1 ring-black/10 dark:bg-neutral-900 dark:ring-white/10"
                  >
                    <option value="">Toutes</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Langue */}
                <div className="grid gap-2">
                  <label className="text-xs opacity-70">Langue</label>
                  <select
                    value={languageFilter}
                    onChange={(e) =>
                      setLanguageFilter(e.target.value as LanguageFilter)
                    }
                    className="w-full rounded-xl px-3 py-2 ring-1 ring-black/10 dark:bg-neutral-900 dark:ring-white/10"
                  >
                    <option value="">Toutes</option>
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Statut */}
                <div className="grid gap-2">
                  <label className="text-xs opacity-70">Statut</label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { k: "all", label: "Tous" },
                        { k: "publie", label: "Publiés" },
                        { k: "brouillon", label: "Brouillons" },
                      ] as Array<{ k: StatusFilter; label: string }>
                    ).map((o) => {
                      const isActive = statusFilter === o.k;
                      const base =
                        "rounded-xl px-3 py-1.5 text-xs ring-1 ring-black/10 transition-colors dark:ring-white/10";
                      const active = isActive
                        ? " bg-violet-600 text-white"
                        : " hover:bg-black/5 dark:hover:bg-white/10";
                      return (
                        <button
                          key={o.k}
                          onClick={() => setStatusFilter(o.k)}
                          className={base + active}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Période */}
                <div className="grid gap-2 md:col-span-2">
                  <label className="text-xs opacity-70 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Période
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10 focus-within:ring-2 focus-within:ring-violet-400">
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full bg-transparent outline-none dark:[color-scheme:dark]"
                      />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-white dark:bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10 focus-within:ring-2 focus-within:ring-violet-400">
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full bg-transparent outline-none dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* footer filtres */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="opacity-70 sm:hidden">
                  {loading
                    ? "Chargement…"
                    : `${list.length} élément${list.length > 1 ? "s" : ""}`}
                </div>
                <div className="flex gap-2">
                  {(query ||
                    categoryFilter ||
                    languageFilter ||
                    dateFrom ||
                    dateTo ||
                    statusFilter !== "all") && (
                    <span className="hidden items-center rounded-full bg-black/5 px-3 py-1 text-xs opacity-70 dark:bg-white/10 sm:flex">
                      Actifs&nbsp;:
                      {query && " Recherche,"} {categoryFilter && " Catégorie,"}
                      {languageFilter && " Langue,"}
                      {statusFilter !== "all" && " Statut,"}
                      {(dateFrom || dateTo) && " Période"}
                    </span>
                  )}
                  <button
                    className="rounded-xl px-3 py-2 ring-1 ring-black/10 hover:bg-black/5 dark:ring-white/10 dark:hover:bg-white/10"
                    onClick={resetFilters}
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="rounded-2xl border p-10 text-center opacity-70 dark:border-white/10">
            Chargement…
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center opacity-70 dark:border-white/10">
            <p>Aucun podcast pour le moment.</p>
            <p className="mt-2 text-sm">
              Clique sur <span className="font-medium">“Nouveau podcast”</span>{" "}
              pour en ajouter un.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            {list.map((p) => (
              <PodcastCard
                key={p.id}
                item={p}
                currentUserId={currentUserId}
                onEdit={setEditItem}
                onDelete={setAskDelete}
                onTogglePublish={onTogglePublish}
                onOpen={setOpenDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      <Modal
        open={openNew}
        onClose={() => setOpenNew(false)}
        title="Nouveau podcast"
        footer={null}
      >
        <PodcastForm onSubmit={upsert} onCancel={() => setOpenNew(false)} />
      </Modal>

      <Modal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Modifier — ${editItem?.title ?? ""}`}
        footer={
          <button
            onClick={() => setEditItem(null)}
            className="rounded-xl px-4 py-2 ring-1 ring-black/10 hover:bg-black/5 dark:ring-white/10 dark:hover:bg-white/10"
          >
            Fermer
          </button>
        }
      >
        {editItem ? <PodcastForm initial={editItem} onSubmit={upsert} /> : null}
      </Modal>

      {/* Détails */}
      <Modal
        open={!!openDetail}
        onClose={() => setOpenDetail(null)}
        title={openDetail?.title || "Détails du podcast"}
        footer={null}
      >
        {openDetail ? (
          <PodcastDetail
            item={openDetail}
            onClose={() => setOpenDetail(null)}
            onEdit={(p) => {
              setEditItem(p);
              setOpenDetail(null);
            }}
            onDelete={(p) => setAskDelete(p)}
            onTogglePublish={onTogglePublish}
          />
        ) : null}
      </Modal>

      <Confirm
        open={!!askDelete}
        title="Supprimer le podcast"
        message={`Voulez-vous vraiment supprimer « ${
          askDelete?.title ?? ""
        } » ? Cette action est irréversible.`}
        onCancel={() => setAskDelete(null)}
        onConfirm={() => askDelete && removeItem(askDelete)}
      />
    </div>
  );
}
