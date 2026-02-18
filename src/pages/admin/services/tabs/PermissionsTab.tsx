// src/pages/admin/services/tabs/PermissionsTab.tsx
import { Card, SectionTitle } from "./SharedComponents";
import {
  HiMiniMicrophone,
  HiMiniChevronDown,
  HiMiniInformationCircle,
  HiMiniLink,
  HiMiniNoSymbol,
  HiMiniCheckCircle,
} from "react-icons/hi2";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../../../lib/api";

/* ---------- Types & Storage ---------- */
type ServiceRow = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  description?: string;
};

const LS_SERVICES = "fm.services";
const LS_PODCASTS_BINDING = "fm.permissions.podcasts.serviceId";

/** Forme minimale tolérée depuis l’API services */
type ServiceApiMinimal = {
  _id?: unknown;
  id?: unknown;
  name?: unknown;
  email?: unknown;
  description?: unknown;
  createdAt?: unknown;
};
type ServicesResponse = {
  services?: unknown;
  items?: unknown;
};

/** Gardes de type utilitaires */
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Garde de type pour un élément service brut */
function isServiceLike(x: unknown): x is ServiceApiMinimal {
  if (!isRecord(x)) return false;
  const hasId = "_id" in x || "id" in x;
  return hasId && "name" in x && "email" in x;
}

/** Normalise un service brut → ServiceRow, sinon null si données insuffisantes */
function normalizeService(x: ServiceApiMinimal): ServiceRow | null {
  const idRaw = x._id ?? x.id;
  const id =
    typeof idRaw === "string"
      ? idRaw
      : typeof idRaw === "number"
      ? String(idRaw)
      : "";

  const name = typeof x.name === "string" ? x.name : "";
  const email = typeof x.email === "string" ? x.email : "";
  const description =
    typeof x.description === "string" ? x.description : undefined;
  const createdAt = typeof x.createdAt === "string" ? x.createdAt : undefined;

  if (!id || !name || !email) return null;
  return { id, name, email, description, createdAt };
}

async function fetchServices(): Promise<ServiceRow[]> {
  // En prod, API_BASE est une URL absolue — `api.get` se charge de la joindre
  const data = await api.get<unknown | ServicesResponse>("/admin/services");

  const resp = (data ?? {}) as ServicesResponse;
  const rawArr: unknown[] = Array.isArray(resp.services)
    ? resp.services
    : Array.isArray(resp.items)
    ? resp.items
    : Array.isArray(data)
    ? (data as unknown[])
    : [];

  return rawArr
    .filter(isServiceLike)
    .map(normalizeService)
    .filter((s): s is ServiceRow => !!s);
}

/* ---------- Utils localStorage ---------- */
function loadServicesFromLS(): ServiceRow[] {
  try {
    const raw = localStorage.getItem(LS_SERVICES);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x: unknown) =>
        isRecord(x) &&
        typeof (x as ServiceRow).id === "string" &&
        typeof (x as ServiceRow).name === "string" &&
        typeof (x as ServiceRow).email === "string"
    ) as ServiceRow[];
  } catch {
    return [];
  }
}
function saveServicesToLS(list: ServiceRow[]) {
  localStorage.setItem(LS_SERVICES, JSON.stringify(list));
}

/* ---------- Carte Permission Podcasts ---------- */
function PermissionPodcastsCard() {
  const [open, setOpen] = useState(true);

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [boundId, setBoundId] = useState<string | null>(null);
  const [pickedId, setPickedId] = useState<string>("");
  const [flash, setFlash] = useState<{
    msg: string;
    tone: "ok" | "warn";
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // charge LS + réseau
  const refresh = async () => {
    setErr(null);
    try {
      const lsServices = loadServicesFromLS();
      if (lsServices.length) setServices(lsServices);

      const saved = localStorage.getItem(LS_PODCASTS_BINDING) || null;
      setBoundId(saved);

      const fromApi = await fetchServices();
      setServices(fromApi);
      saveServicesToLS(fromApi);

      const stillExists = !!saved && fromApi.some((s) => s.id === saved);
      setBoundId(stillExists ? saved : null);

      const nextPicked =
        (stillExists ? (saved as string) : "") ||
        (fromApi.length ? fromApi[0].id : "");
      setPickedId(nextPicked);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        if (e.status === 401 || e.status === 403) {
          // 🔇 ne rien afficher
        } else {
          const dataMsg =
            typeof e.data === "string"
              ? e.data
              : isRecord(e.data) && typeof e.data.message === "string"
              ? e.data.message
              : "";
          setErr(dataMsg || e.message || "Erreur de chargement");
        }
      } else {
        const raw =
          e instanceof Error
            ? e.message
            : "Impossible de charger les services.";
        if (/Réponse non-JSON|JSON invalide/i.test(raw)) {
          setErr(
            "Le serveur a renvoyé une page d’erreur HTML au lieu de JSON."
          );
        } else setErr(raw);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_SERVICES || e.key === LS_PODCASTS_BINDING) {
        // garder la page cohérente si un autre onglet modifie
        const ls = loadServicesFromLS();
        setServices(ls);
        setBoundId(localStorage.getItem(LS_PODCASTS_BINDING) || null);
        if (!pickedId && ls[0]) setPickedId(ls[0].id);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLinked = !!boundId;
  const selected = useMemo(
    () => (boundId ? services.find((s) => s.id === boundId) || null : null),
    [services, boundId]
  );

  const bindNow = () => {
    if (!pickedId) return;
    localStorage.setItem(LS_PODCASTS_BINDING, pickedId);
    setBoundId(pickedId);
    setFlash({ msg: "Service lié avec succès.", tone: "ok" });
    setTimeout(() => setFlash(null), 2200);
  };

  const unbind = () => {
    localStorage.removeItem(LS_PODCASTS_BINDING);
    setBoundId(null);
    setFlash({ msg: "Service dissocié.", tone: "warn" });
    setTimeout(() => setFlash(null), 2200);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur">
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-pink-500 opacity-80" />

      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0 rounded-xl border border-slate-200 dark:border-slate-800 p-2 bg-white/70 dark:bg-slate-900/50 shadow-sm">
            <motion.span
              initial={{ scale: 1 }}
              animate={{ rotate: [0, -4, 0, 4, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="inline-flex"
            >
              <HiMiniMicrophone className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
            </motion.span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-[15px] sm:text-base font-semibold text-slate-900 dark:text-white">
                Gérer les podcasts
              </h4>
              <span className="inline-flex items-center rounded-full border border-indigo-200/70 dark:border-indigo-800/60 px-2 py-0.5 text-[11px] font-medium tracking-wide text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-900/30">
                Module
              </span>
              {isLinked ? (
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800">
                  Lié {selected ? `: ${selected.name}` : ""}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-800">
                  Non lié
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
              Contrôle éditorial du catalogue de podcasts : épisodes, saisons,
              chapitrage, visuels et publication.
            </p>
          </div>
        </div>
        <HiMiniChevronDown
          className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          >
            <div className="p-4 sm:p-6 space-y-5">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
                <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    Lier à un{" "}
                    <span className="text-indigo-600">service podcasts</span>
                  </p>
                  <div className="flex items-center text-[12px] text-slate-500 gap-1">
                    <HiMiniInformationCircle className="h-4 w-4 shrink-0" />
                    <span>
                      Un seul service est utilisé pour les emails “podcasts”.
                    </span>
                  </div>
                </div>

                {err && (
                  <div className="rounded-md border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300 px-3 py-2 text-sm">
                    {err}
                  </div>
                )}

                {loading ? (
                  <div className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ) : services.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucun service. Créez d’abord un service dans l’onglet{" "}
                    <b>Services</b>.
                  </p>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <select
                      value={pickedId}
                      onChange={(e) => setPickedId(e.target.value)}
                      className="w-full md:max-w-md rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {s.email}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={bindNow}
                        disabled={!pickedId || pickedId === boundId}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                      >
                        <HiMiniLink className="h-4 w-4" />
                        Lier
                      </button>
                      <button
                        type="button"
                        onClick={unbind}
                        disabled={!boundId}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                      >
                        <HiMiniNoSymbol className="h-4 w-4" />
                        Dissocier
                      </button>
                    </div>
                  </div>
                )}

                {/* Feedback */}
                <AnimatePresence>
                  {flash && (
                    <motion.div
                      initial={{ y: -6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -6, opacity: 0 }}
                      className={[
                        "mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]",
                        flash.tone === "ok"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
                      ].join(" ")}
                    >
                      <HiMiniCheckCircle className="h-4 w-4" />
                      {flash.msg}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Vue principale ---------- */
export function PermissionsTab() {
  return (
    <div
      id="panel-permissions"
      role="tabpanel"
      aria-labelledby="tab-permissions"
      className="mt-4 space-y-4"
    >
      <SectionTitle>Gestion des permissions</SectionTitle>
      <div className="mx-auto w-full max-w-screen-xl px-2 sm:px-4">
        <Card className="space-y-4">
          <PermissionPodcastsCard />
        </Card>
      </div>
    </div>
  );
}
