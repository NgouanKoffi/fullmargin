// C:\Users\ADMIN\Desktop\fullmargin-site\src/pages/admin/Messages/TemplatesTab.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_EMAIL_TEMPLATES,
  type EmailTemplate,
} from "../../../data/defaultEmailTemplates";
import TemplatesTable from "./templates/TemplatesTable";
import TemplateEditor from "./templates/TemplateEditor";
import { api } from "../../../lib/api";

type View = "list" | "edit";

type ApiTemplate = {
  id: string;
  name: string;
  description: string;
  subject: string;
  html: string;
  slug: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ApiListResponse = { items: ApiTemplate[] };

type TemplateItem = EmailTemplate & {
  dbId?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function safeStr(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (isRecord(err)) {
    const msg = err["message"];
    const response = err["response"];

    // Axios-like (si jamais) : err.response.data.error
    if (isRecord(response)) {
      const data = response["data"];
      if (isRecord(data)) {
        const e = data["error"];
        if (isNonEmptyString(e)) return e;
      }
    }

    if (isNonEmptyString(msg)) return msg;
  }
  return fallback;
}

// ✅ api.ts retourne directement le JSON parsé, pas { data: ... }.
// Donc "res" est déjà le payload.
function parseListResponse(res: unknown): ApiListResponse {
  if (isRecord(res) && Array.isArray(res["items"])) {
    return { items: res["items"] as ApiTemplate[] };
  }
  return { items: [] };
}

function parseTemplateResponse(res: unknown): ApiTemplate | null {
  if (!isRecord(res)) return null;
  return {
    id: safeStr(res["id"]),
    name: safeStr(res["name"]),
    description: safeStr(res["description"]),
    subject: safeStr(res["subject"]),
    html: safeStr(res["html"]),
    slug: safeStr(res["slug"]),
    createdAt: (res["createdAt"] as string | null | undefined) ?? null,
    updatedAt: (res["updatedAt"] as string | null | undefined) ?? null,
  };
}

function makeKeyFromApi(t: ApiTemplate) {
  const slug = safeStr(t.slug).trim();
  return slug || `custom:${t.id}`;
}

function toTemplateItemFromApi(t: ApiTemplate): TemplateItem {
  const key = makeKeyFromApi(t);
  return {
    id: key,
    name: safeStr(t.name),
    description: safeStr(t.description),
    subject: safeStr(t.subject),
    html: safeStr(t.html),
    dbId: t.id,
    createdAt: t.createdAt ?? null,
    updatedAt: t.updatedAt ?? null,
  };
}

function mergeDefaultsWithServer(serverItems: ApiTemplate[]): TemplateItem[] {
  const bySlug = new Map<string, TemplateItem>();
  const extras: TemplateItem[] = [];

  for (const raw of serverItems) {
    const item = toTemplateItemFromApi(raw);
    const slug = safeStr(raw.slug).trim();
    if (slug) bySlug.set(slug, item);
    else extras.push(item);
  }

  const defaultIds = new Set(DEFAULT_EMAIL_TEMPLATES.map((d) => d.id));

  const mergedDefaults: TemplateItem[] = DEFAULT_EMAIL_TEMPLATES.map((def) => {
    const db = bySlug.get(def.id);
    if (!db) return { ...def };
    return {
      ...def,
      ...db,
      id: def.id,
      dbId: db.dbId,
      createdAt: db.createdAt ?? null,
      updatedAt: db.updatedAt ?? null,
    };
  });

  const serverOnly: TemplateItem[] = [];
  for (const [slug, item] of bySlug.entries()) {
    if (!defaultIds.has(slug)) serverOnly.push(item);
  }

  return [...mergedDefaults, ...serverOnly, ...extras];
}

export default function TemplatesTab() {
  const [items, setItems] = useState<TemplateItem[]>(DEFAULT_EMAIL_TEMPLATES);
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const dirtyRef = useRef<Set<string>>(new Set());

  // ✅ FIX Timeout type: cross-env (DOM + Node typings)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = useMemo(
    () => items.find((t) => t.id === selectedId) || null,
    [items, selectedId],
  );

  const loadFromServer = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // ✅ IMPORTANT: ne PAS préfixer par /api (api.ts le fait déjà)
      const res = await api.get<ApiListResponse>("/admin/mail/templates");
      const parsed = parseListResponse(res);

      const server = parsed.items ?? [];
      const merged = mergeDefaultsWithServer(server);
      setItems(merged);
    } catch (e: unknown) {
      setLoadError(getErrorMessage(e, "Impossible de charger les templates."));
      setItems(DEFAULT_EMAIL_TEMPLATES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFromServer();
  }, [loadFromServer]);

  const openEditor = useCallback((id: string) => {
    setSelectedId(id);
    setView("edit");
    setSaveError(null);
  }, []);

  const backToList = useCallback(() => {
    setView("list");
    setSaveError(null);
  }, []);

  const updateTemplate = useCallback((next: EmailTemplate) => {
    setItems((arr) =>
      arr.map((t) => (t.id === next.id ? { ...t, ...next } : t)),
    );
    dirtyRef.current.add(next.id);
  }, []);

  const getSlugFromId = useCallback((id: string) => {
    const raw = safeStr(id).trim();
    if (raw.startsWith("custom:")) return "";
    return raw;
  }, []);

  const checkDuplicateSlug = useCallback(
    (currentId: string, slug: string) => {
      if (!slug) return null;
      const clash = items.find((t) => t.id === slug && t.id !== currentId);
      return clash ? `Slug déjà utilisé : "${slug}"` : null;
    },
    [items],
  );

  const persistTemplate = useCallback(
    async (tpl: TemplateItem) => {
      const currentId = tpl.id;
      const slug = getSlugFromId(tpl.id);

      const dupErr = checkDuplicateSlug(currentId, slug);
      if (dupErr) {
        setSaveError(dupErr);
        return;
      }

      setSaving(true);
      setSaveError(null);

      try {
        const payload = {
          name: safeStr(tpl.name).trim(),
          description: safeStr(tpl.description),
          subject: safeStr(tpl.subject),
          html: safeStr(tpl.html),
          slug,
        };

        if (!isNonEmptyString(payload.name) || payload.name.length < 2) {
          setSaveError("Nom invalide (min 2 caractères).");
          return;
        }

        let saved: ApiTemplate | null = null;

        if (tpl.dbId) {
          // ✅ IMPORTANT: ne PAS préfixer par /api
          const res = await api.put(
            `/admin/mail/templates/${tpl.dbId}`,
            payload,
          );
          saved = parseTemplateResponse(res);
        } else {
          const res = await api.post("/admin/mail/templates", payload);
          saved = parseTemplateResponse(res);
        }

        const nextDbId = saved?.id || tpl.dbId;
        const nextSlug = safeStr(saved?.slug).trim() || tpl.id;

        setItems((arr) =>
          arr.map((x) => {
            if (x.id !== currentId) return x;
            return {
              ...x,
              id: nextSlug,
              name: safeStr(saved?.name ?? x.name),
              description: safeStr(saved?.description ?? x.description),
              subject: safeStr(saved?.subject ?? x.subject),
              html: safeStr(saved?.html ?? x.html),
              dbId: nextDbId,
              createdAt: saved?.createdAt ?? x.createdAt ?? null,
              updatedAt: saved?.updatedAt ?? x.updatedAt ?? null,
            };
          }),
        );

        if (selectedId === currentId && nextSlug !== currentId) {
          setSelectedId(nextSlug);
          dirtyRef.current.delete(currentId);
          dirtyRef.current.add(nextSlug);
        } else {
          dirtyRef.current.delete(currentId);
        }

        setLastSavedAt(new Date().toLocaleString("fr-FR"));
      } catch (e: unknown) {
        setSaveError(getErrorMessage(e, "Échec de sauvegarde."));
      } finally {
        setSaving(false);
      }
    },
    [checkDuplicateSlug, getSlugFromId, selectedId],
  );

  // ✅ Autosave debounced (deps complets)
  useEffect(() => {
    if (view !== "edit" || !selected) return;
    if (!dirtyRef.current.has(selected.id)) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      void persistTemplate(selected);
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    };
  }, [
    view,
    selected,
    persistTemplate,
    selected?.name,
    selected?.description,
    selected?.subject,
    selected?.html,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-skin-muted">
          {loading ? "Chargement des templates…" : "Templates chargés."}
          {lastSavedAt ? (
            <span className="ml-2">Dernière sauvegarde : {lastSavedAt}</span>
          ) : null}
          {saving ? <span className="ml-2">• Sauvegarde…</span> : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl ring-1 ring-skin-border/20 hover:bg-skin-tile text-sm"
            onClick={() => void loadFromServer()}
            disabled={loading}
          >
            Rafraîchir
          </button>

          {view === "edit" && selected ? (
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl ring-1 ring-skin-border/20 hover:bg-skin-tile text-sm"
              onClick={() => void persistTemplate(selected)}
              disabled={saving || loading}
              title="Forcer la sauvegarde maintenant"
            >
              Sauvegarder
            </button>
          ) : null}
        </div>
      </div>

      {loadError ? (
        <div className="rounded-xl ring-1 ring-red-500/20 bg-red-500/10 p-3 text-sm">
          <div className="font-semibold">Erreur de chargement</div>
          <div className="text-skin-base/90">{loadError}</div>
          <div className="text-xs text-skin-muted mt-1">
            Affichage fallback (defaults).
          </div>
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-xl ring-1 ring-red-500/20 bg-red-500/10 p-3 text-sm">
          <div className="font-semibold">Erreur de sauvegarde</div>
          <div className="text-skin-base/90">{saveError}</div>
        </div>
      ) : null}

      {view === "list" && <TemplatesTable items={items} onEdit={openEditor} />}

      {view === "edit" && selected && (
        <TemplateEditor
          value={selected}
          onChange={updateTemplate}
          onBack={backToList}
        />
      )}

      {view === "edit" && !selected && (
        <TemplatesTable items={items} onEdit={openEditor} />
      )}
    </div>
  );
}
