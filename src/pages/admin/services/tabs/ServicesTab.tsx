// src/pages/admin/services/tabs/ServicesTab.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "./SharedComponents";
import { motion } from "framer-motion";
import {
  HiMiniPlus,
  HiMiniTrash,
  HiMiniEnvelope,
  HiMiniSparkles,
  HiMiniInformationCircle,
  HiMiniPencilSquare,
  HiMiniXMark,
} from "react-icons/hi2";
import { listSenderOptions, BREVO_EMAILS } from "../BrevoEmails/brevoEmails";
import { api, ApiError } from "../../../../lib/api";

/* ============================= Types ============================= */
type ServiceDoc = {
  _id: string;
  name: string;
  email: string;
  role?: string;
  description?: string;
  status?: "idle" | "active";
  enabled?: boolean;
  lastCheckAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type EmailOption = {
  id: string;
  label: string;
  email: string;
  disabled?: boolean;
};

// Réponse flexible de /admin/services
type ServicesResponse = {
  services?: unknown;
  items?: unknown;
};

/* ============================ Utils types ======================== */
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

// garde de type + normalisation pour un item service
function isServiceLike(
  x: unknown
): x is Partial<ServiceDoc> & Record<string, unknown> {
  if (!isRecord(x)) return false;
  const hasId =
    typeof x._id === "string" ||
    typeof (x as Record<string, unknown>).id === "string";
  const hasName = typeof x.name === "string";
  const hasEmail = typeof x.email === "string";
  return hasId && hasName && hasEmail;
}
function normalizeService(
  x: Partial<ServiceDoc> & Record<string, unknown>
): ServiceDoc {
  const id =
    typeof x._id === "string" ? x._id : (x.id as string | undefined) ?? ""; // déjà garanti par isServiceLike
  return {
    _id: id,
    name: String(x.name ?? ""),
    email: String(x.email ?? ""),
    role: typeof x.role === "string" ? x.role : undefined,
    description: typeof x.description === "string" ? x.description : undefined,
    status: x.status === "active" || x.status === "idle" ? x.status : undefined,
    enabled: typeof x.enabled === "boolean" ? x.enabled : undefined,
    lastCheckAt: typeof x.lastCheckAt === "string" ? x.lastCheckAt : null,
    createdAt: typeof x.createdAt === "string" ? x.createdAt : undefined,
    updatedAt: typeof x.updatedAt === "string" ? x.updatedAt : undefined,
  };
}

/* ============================ API calls ========================== */
async function fetchServices(): Promise<{ services: ServiceDoc[] }> {
  // ⚠️ important: pas de /api ici, api.ts gère la base (dev/prod)
  const data = await api.get<unknown | ServicesResponse>("/admin/services");
  const resp = (data ?? {}) as ServicesResponse;

  const raw: unknown[] = Array.isArray(resp.services)
    ? (resp.services as unknown[])
    : Array.isArray(resp.items)
    ? (resp.items as unknown[])
    : Array.isArray(data)
    ? (data as unknown[])
    : [];

  const services = raw.filter(isServiceLike).map(normalizeService);
  return { services };
}

async function createService(payload: {
  name: string;
  email: string;
  role?: string;
  description?: string;
}): Promise<{ service: ServiceDoc }> {
  return api.post<{ service: ServiceDoc }>("/admin/services", payload);
}

async function updateService(
  id: string,
  payload: Partial<Pick<ServiceDoc, "name" | "email">>
): Promise<{ service: ServiceDoc }> {
  return api.patch<{ service: ServiceDoc }>(`/admin/services/${id}`, payload);
}

async function deleteService(id: string): Promise<{ ok: true }> {
  return api.delete<{ ok: true }>(`/admin/services/${id}`);
}

/* =========================== UI Helpers ========================== */
function Note({
  tone = "info",
  children,
}: {
  tone?: "info" | "ok" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const map = {
    info: "text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-900/40 dark:border-slate-800",
    ok: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800",
    warn: "text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/30 dark:border-amber-800",
    danger:
      "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-900/30 dark:border-rose-800",
  }[tone];
  return (
    <div className={`rounded-xl border px-3 py-2 text-sm ${map}`}>
      {children}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-3 text-center">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-[12px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

/* ============================ Modal Edit ========================= */
function EditServiceModal({
  open,
  service,
  options,
  saving,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  service: ServiceDoc | null;
  options: EmailOption[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: { name: string; email: string }) => void;
}) {
  const [name, setName] = useState(service?.name || "");
  const [email, setEmail] = useState(service?.email || "");

  useEffect(() => {
    if (open) {
      setName(service?.name || "");
      setEmail(service?.email || "");
    }
  }, [open, service?.name, service?.email]);

  const optMap = useMemo(
    () => new Map(options.map((o) => [o.email, !!o.disabled])),
    [options]
  );

  const nameOk = name.trim().length >= 2;
  const emailOk = !!email && !(optMap.get(email) ?? false);
  const canSave = nameOk && emailOk && !saving;

  if (!open || !service) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[560px]">
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          className="m-0 rounded-t-2xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl"
        >
          {/* En-tête */}
          <div className="relative">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-pink-500 opacity-80" />
            <div className="pl-5 pr-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <p className="font-semibold">Modifier le service</p>
              <button
                onClick={onClose}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                title="Fermer"
                aria-label="Fermer"
              >
                <HiMiniXMark className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Corps */}
          <div className="p-4 sm:p-5 space-y-4">
            <div>
              <label className="text-sm font-medium">Nom</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                placeholder="Nom du service"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email expéditeur</label>
              <select
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              >
                {options.map((o) => (
                  <option
                    key={`edit-${o.id}`}
                    value={o.email}
                    disabled={o.disabled}
                  >
                    {o.label} — {o.email}
                    {o.disabled ? " (déjà utilisé)" : ""}
                  </option>
                ))}
              </select>
              {!emailOk && (
                <p className="mt-1 text-xs text-rose-600">
                  Choisis une adresse disponible (non utilisée par un autre
                  service).
                </p>
              )}
            </div>

            {error && <Note tone="danger">{error}</Note>}
          </div>

          {/* Pied */}
          <div className="sticky bottom-0 px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3 rounded-md text-sm border border-slate-300 dark:border-slate-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => onSave({ name: name.trim(), email })}
                disabled={!canSave}
                className="h-9 px-3 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================ Component ========================== */
export function ServicesTab() {
  const SENDER_OPTIONS: EmailOption[] = useMemo(() => listSenderOptions(), []);
  const [items, setItems] = useState<ServiceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // création
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string>(SENDER_OPTIONS[0]?.email || "");
  const [submitting, setSubmitting] = useState(false);

  // suppression
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // édition (modal)
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ServiceDoc | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetchServices();
        if (!cancel) setItems(r.services || []);
      } catch (e: unknown) {
        if (!cancel) {
          if (e instanceof ApiError) {
            if (e.status === 401 || e.status === 403) {
              // 🔇
              // setErr("..."); // (masqué)
            } else {
              const extra =
                typeof e.data === "string"
                  ? e.data
                  : isRecord(e.data) && typeof e.data.message === "string"
                  ? e.data.message
                  : "";
              setErr(extra || e.message || "Erreur de chargement");
            }
          } else {
            const raw = e instanceof Error ? e.message : "Erreur de chargement";
            if (/Réponse non-JSON|JSON invalide/i.test(raw)) {
              setErr("Le serveur a renvoyé une page HTML au lieu d’un JSON.");
            } else setErr(raw);
          }
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const usedEmails = useMemo(() => new Set(items.map((s) => s.email)), [items]);

  const createOptions: EmailOption[] = useMemo(
    () =>
      SENDER_OPTIONS.map((o) => ({ ...o, disabled: usedEmails.has(o.email) })),
    [SENDER_OPTIONS, usedEmails]
  );

  const editOptions: EmailOption[] = useMemo(() => {
    if (!editTarget)
      return SENDER_OPTIONS.map((o) => ({
        ...o,
        disabled: usedEmails.has(o.email),
      }));
    const usedByOthers = new Set(
      items.filter((s) => s._id !== editTarget._id).map((s) => s.email)
    );
    return SENDER_OPTIONS.map((o) => ({
      ...o,
      disabled: usedByOthers.has(o.email),
    }));
  }, [SENDER_OPTIONS, usedEmails, items, editTarget]);

  const stats = useMemo(() => {
    const total = items.length;
    const taken = total;
    const free = Math.max(BREVO_EMAILS.length - taken, 0);
    return { total, taken, free };
  }, [items]);

  const canCreate = name.trim().length >= 2 && email && !usedEmails.has(email);

  const onCreate = async () => {
    setErr(null);
    if (!canCreate || submitting) return;
    try {
      setSubmitting(true);
      const r = await createService({ name: name.trim(), email });
      setItems((prev) => [r.service, ...prev]);
      setName("");
      const firstFree = SENDER_OPTIONS.find(
        (e) => !usedEmails.has(e.email) && e.email !== email
      );
      setEmail(firstFree?.email || "");
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "Création impossible";
      setErr(raw);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (svc: ServiceDoc) => {
    if (!svc?._id || deletingId) return;
    try {
      setDeletingId(svc._id);
      await deleteService(svc._id);
      setItems((prev) => prev.filter((x) => x._id !== svc._id));
    } catch (e) {
      // tu peux afficher une note si besoin
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (svc: ServiceDoc) => {
    setEditErr(null);
    setEditTarget(svc);
    setEditOpen(true);
  };

  const saveEdit = async (payload: { name: string; email: string }) => {
    if (!editTarget || savingEdit) return;
    try {
      setSavingEdit(true);
      const r = await updateService(editTarget._id, payload);
      setItems((prev) =>
        prev.map((it) => (it._id === editTarget._id ? r.service : it))
      );
      setEditOpen(false);
      setEditTarget(null);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "Mise à jour impossible";
      setEditErr(raw);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div
      id="panel-services"
      role="tabpanel"
      aria-labelledby="tab-services"
      className="mt-4 space-y-4"
    >
      <div className="flex items-center gap-2">
        <SectionTitle>Services</SectionTitle>
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200/70 dark:border-indigo-800/60 px-2 py-0.5 text-[11px] text-indigo-700 dark:text-indigo-300">
          <HiMiniSparkles className="h-4 w-4" />
          attribution d’email
        </span>
      </div>

      <Card>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Note>
              Crée des services et assigne-leur un <b>email expéditeur</b>{" "}
              (Brevo). Un <b>même email</b> <u>ne peut pas</u> être utilisé par
              plusieurs services.
            </Note>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Kpi label="Services" value={String(stats.total)} />
            <Kpi label="Emails pris" value={String(stats.taken)} />
            <Kpi label="Emails libres" value={String(stats.free)} />
          </div>
        </div>

        <div className="mt-4 grid lg:grid-cols-3 gap-4">
          {/* Création */}
          <div className="lg:col-span-1">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur p-4 sm:p-5">
              <div className="absolute left-0 top-0 h-full w-px sm:w-1.5 bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-pink-500 opacity-80" />

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-semibold">
                      1
                    </span>
                    <p className="text-sm font-medium">Nom du service</p>
                  </div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex : Podcasts, Notifications, Analytics…"
                    className="w-full rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  />
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-semibold">
                      2
                    </span>
                    <p className="text-sm font-medium">Email expéditeur</p>
                  </div>
                  <select
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  >
                    {createOptions.map((o) => (
                      <option key={o.id} value={o.email} disabled={o.disabled}>
                        {o.label} — {o.email}
                        {o.disabled ? " (déjà utilisé)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 3 */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HiMiniInformationCircle className="h-5 w-5 text-slate-500" />
                    <p className="text-xs text-slate-500">
                      Les emails déjà liés sont grisés dans la liste.
                    </p>
                  </div>
                  {err ? (
                    <Note tone="danger">{err}</Note>
                  ) : (
                    <Note tone="ok">Prêt à créer</Note>
                  )}
                  <button
                    type="button"
                    onClick={onCreate}
                    disabled={!canCreate || submitting}
                    className="w-full inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    <HiMiniPlus className="h-4 w-4" />
                    {submitting ? "Création…" : "Créer le service"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Liste */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
                <p className="text-sm text-slate-500">
                  Aucun service pour l’instant. Crée ton premier service à
                  gauche.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {items.map((svc) => (
                  <motion.div
                    key={svc._id}
                    layout
                    className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 backdrop-blur p-4 sm:p-5"
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                  >
                    <div className="absolute left-0 top-0 h-full w-px sm:w-1.5 bg-gradient-to-b from-indigo-500 via-fuchsia-500 to-pink-500 opacity-80" />
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 bg-white/70 dark:bg-slate-900/50 shadow-sm">
                        <HiMiniEnvelope className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white truncate">
                              {svc.name || "Sans nom"}
                            </p>
                            <p className="text-[13px] text-slate-600 dark:text-slate-300 break-words">
                              &lt;{svc.email || "non défini"}&gt;
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Créé le{" "}
                              {svc.createdAt
                                ? new Date(svc.createdAt).toLocaleString(
                                    "fr-FR"
                                  )
                                : "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(svc)}
                              className="h-9 px-3 rounded-md text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                              title="Modifier"
                            >
                              <HiMiniPencilSquare className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(svc)}
                              disabled={deletingId === svc._id}
                              className="h-9 px-3 rounded-md text-sm border border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50"
                              title="Supprimer"
                            >
                              {deletingId === svc._id ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
                              ) : (
                                <HiMiniTrash className="h-4 w-4 text-rose-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Modal d’édition */}
      <EditServiceModal
        open={editOpen}
        service={editTarget}
        options={editOptions}
        saving={savingEdit}
        error={editErr}
        onClose={() => {
          setEditOpen(false);
          setEditTarget(null);
          setEditErr(null);
        }}
        onSave={saveEdit}
      />
    </div>
  );
}
