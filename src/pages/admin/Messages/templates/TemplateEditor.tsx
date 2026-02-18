// src/pages/admin/Messages/templates/TemplateEditor.tsx
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Save, ImagePlus, Link as LinkIcon } from "lucide-react";
import type { EmailTemplate } from "../../../../data/defaultEmailTemplates";
import {
  notifyError,
  notifySuccess,
} from "../../../../components/Notification";
import { api, ApiError } from "../../../../lib/api";

/* ===================== Types ===================== */
type TemplateValue = EmailTemplate & {
  dbId?: string; // id DB (_id) si existant
  slug?: string; // identifiant stable optionnel
};

type Props = {
  value: TemplateValue;
  onChange: (next: TemplateValue) => void;
  onBack: () => void;
};

/* ===================== Constantes ===================== */
/** ⚠️ Important: pas de /api ici; `api` préfixe déjà avec VITE_API_BASE */
const UPLOAD_ENDPOINT = "/admin/mail/upload-image";

/* ===================== Composant ===================== */
export default function TemplateEditor({ value, onChange, onBack }: Props) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  function patch<K extends keyof TemplateValue>(k: K, v: TemplateValue[K]) {
    onChange({ ...value, [k]: v });
  }

  const canSave = useMemo(
    () => (value.name || "").trim().length >= 2,
    [value.name],
  );

  /* -------- Insertion utilitaire dans le <textarea> -------- */
  function insertAtCursor(snippet: string) {
    const ta = taRef.current;
    const current = String(value.html || "");
    if (!ta) {
      patch("html", current + snippet);
      return;
    }
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const next = current.slice(0, start) + snippet + current.slice(end);
    patch("html", next);

    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  /* -------- Upload image puis insertion <img> -------- */
  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);

    // Pas de Content-Type manuel → boundary géré par le navigateur
    const resp = await api<{ url?: string }>(UPLOAD_ENDPOINT, {
      method: "POST",
      body: fd,
    });

    if (!resp?.url) throw new Error("Réponse d’upload invalide");
    return resp.url;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      notifyError("Le fichier doit être une image.");
      return;
    }
    try {
      setUploading(true);
      const url = await uploadImage(file);
      const imgSnippet =
        `<img src="${url}" alt="" ` +
        `style="max-width:640px;height:auto;vertical-align:middle;border:0;outline:none;text-decoration:none" />`;
      insertAtCursor(imgSnippet);
      notifySuccess("Image insérée.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Échec de l’upload.";
      notifyError(msg);
    } finally {
      setUploading(false);
    }
  }

  /* -------- Helpers snippets -------- */
  function insertLink() {
    insertAtCursor(
      `<a href="{{app.url}}" target="_blank" rel="noreferrer" style="color:#7c3aed;text-decoration:none">{{app.name}}</a>`,
    );
  }

  /* -------- Save vers backend -------- */
  async function handleSave() {
    if (!canSave || saving) return;
    try {
      setSaving(true);
      const payload = {
        name: value.name,
        description: value.description || "",
        subject: value.subject || "",
        html: value.html || "",
        slug: value.slug || value.id || "",
      };

      const isUpdate = !!value.dbId;
      const endpoint = isUpdate
        ? `/admin/mail/templates/${value.dbId}`
        : `/admin/mail/templates`;
      const method = isUpdate ? "PUT" : "POST";

      const data = await api<{
        id?: string;
        name?: string;
        description?: string;
        subject?: string;
        html?: string;
        slug?: string;
      }>(endpoint, { method, json: payload });

      onChange({
        ...value,
        dbId: data?.id ?? value.dbId,
        name: data?.name ?? value.name,
        description: data?.description ?? value.description ?? "",
        subject: data?.subject ?? value.subject ?? "",
        html: data?.html ?? value.html ?? "",
        slug: data?.slug ?? value.slug,
      });
      notifySuccess(isUpdate ? "Modèle mis à jour." : "Modèle créé.");
    } catch (e) {
      let msg =
        e instanceof Error ? e.message : "Erreur durant l’enregistrement.";
      if (e instanceof ApiError) {
        if (e.status === 401 || e.status === 403) {
          // 🔇
          // notifyError(msg); // (masqué)
        } else if (
          typeof e.data === "string" &&
          e.data.startsWith("<!doctype")
        ) {
          msg = "Le serveur a renvoyé une page HTML au lieu d’un JSON.";
          notifyError(msg);
        } else {
          notifyError(msg);
        }
      } else {
        notifyError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  /* -------- Raccourci clavier Cmd/Ctrl+S -------- */
  function onKeyDown(e: React.KeyboardEvent) {
    const cmd = e.metaKey || e.ctrlKey;
    if (cmd && e.key.toLowerCase() === "s") {
      e.preventDefault();
      void handleSave();
    }
  }

  return (
    <div
      className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface overflow-hidden"
      onKeyDown={onKeyDown}
    >
      {/* Top bar – responsive */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-skin-border/15">
        <button
          onClick={onBack}
          className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ring-1 ring-skin-border/20 hover:bg-skin-tile text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Retour</span>
        </button>

        {/* Titre */}
        <h3
          className="
            order-2 sm:order-none
            basis-full sm:basis-auto
            min-w-0 flex-1
            text-sm font-semibold truncate sm:ml-2
          "
          title={value.name || "Édition du modèle"}
        >
          {value.name || "Édition du modèle"}
          {value.dbId && (
            <span className="ml-2 text-xs font-normal text-skin-muted">
              ({value.dbId})
            </span>
          )}
        </h3>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            title="Ctrl/Cmd+S"
            className={[
              "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm",
              canSave && !saving
                ? "bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                : "bg-skin-tile text-skin-muted cursor-not-allowed",
            ].join(" ")}
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">
              {saving ? "Enregistrement…" : "Sauvegarder"}
            </span>
          </button>
        </div>
      </div>

      {/* Editor form */}
      <div className="p-4 sm:p-6 space-y-5">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Nom interne</label>
            <input
              value={value.name}
              onChange={(e) => patch("name", e.target.value)}
              className="mt-1 w-full rounded-xl border border-skin-border/30 bg-transparent px-3 py-2"
              placeholder="Ex: Relance facture"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="text-sm font-medium">Slug (optionnel)</label>
            <input
              value={value.slug || value.id || ""}
              onChange={(e) => patch("slug", e.target.value)}
              className="mt-1 w-full rounded-xl border border-skin-border/30 bg-transparent px-3 py-2"
              placeholder="ex: billing.invoice_reminder"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium">Sujet</label>
            <input
              value={value.subject || ""}
              onChange={(e) => patch("subject", e.target.value)}
              className="mt-1 w-full rounded-xl border border-skin-border/30 bg-transparent px-3 py-2"
              placeholder="Ex: {{user.firstName}}, votre facture est prête"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <input
            value={value.description || ""}
            onChange={(e) => patch("description", e.target.value)}
            className="mt-1 w-full rounded-xl border border-skin-border/30 bg-transparent px-3 py-2"
            placeholder="Usage court du modèle (ex: confirmation d’inscription)"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-skin-border/20 hover:bg-skin-tile text-sm cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <ImagePlus className="w-4 h-4" />
            <span>{uploading ? "Envoi..." : "Insérer une image"}</span>
          </label>

          <button
            type="button"
            onClick={insertLink}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-skin-border/20 hover:bg-skin-tile text-sm"
            title="Insérer un lien vers l’app"
          >
            <LinkIcon className="w-4 h-4" />
            Lien vers l’app
          </button>
        </div>

        <div>
          <label className="text-sm font-medium">Contenu (HTML)</label>
          <textarea
            ref={taRef}
            value={value.html || ""}
            onChange={(e) => patch("html", e.target.value)}
            rows={16}
            className="mt-1 w-full rounded-xl border border-skin-border/30 bg-transparent px-3 py-2 font-mono text-sm"
            placeholder="HTML du template…"
          />
          <p className="text-xs text-skin-muted mt-1">
            Variables (exemples) : <code>{`{{user.firstName}}`}</code>,{" "}
            <code>{`{{app.name}}`}</code>, <code>{`{{app.url}}`}</code>.
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-3 pt-1">
          <div className="text-sm text-skin-muted">Aperçu</div>
          <div className="rounded-2xl ring-1 ring-skin-border/20 bg-white text-black p-4">
            <div className="text-xs text-gray-600 mb-3">
              <b>Sujet:</b> {renderVars(value.subject || "", SAMPLE_CTX)}
            </div>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: renderVars(value.html || "", SAMPLE_CTX),
              }}
            />
          </div>
          <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-3 text-xs text-skin-muted">
            L’aperçu remplace uniquement les variables simples{" "}
            <code>{`{{a.b}}`}</code>. Les sections conditionnelles (ex:{" "}
            <code>{`{{#cond}}...{{/cond}}`}</code>) ne sont pas évaluées ici.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== Preview helpers ===================== */
type Primitive = string | number | boolean | null | undefined;
type TemplateContext = { [key: string]: Primitive | TemplateContext };

const SAMPLE_CTX = {
  user: { firstName: "Alex", lastName: "Dupont", email: "alex@example.com" },
  app: { name: "FullMargin", url: "https://fullmargin.net" },
  service: { name: "Support" },
  code: "123456",
  minutes: 10,
  addedNames: "<li>Service A</li><li>Service B</li>",
  removedNames: "<li>Service X</li>",
  becameAgent: true,
  lostAgent: false,
  wasDemoted: false,
} satisfies Record<string, unknown>;

function getPath(ctx: unknown, keys: string[]): unknown {
  let cur: unknown = ctx;
  for (const k of keys) {
    if (
      cur &&
      typeof cur === "object" &&
      k in (cur as Record<string, unknown>)
    ) {
      cur = (cur as Record<string, unknown>)[k];
    } else {
      return "";
    }
  }
  return cur ?? "";
}

function renderVars(tpl: string, ctx: TemplateContext): string {
  if (!tpl) return "";
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_m, path) => {
    const val = getPath(ctx, String(path).split("."));
    return String(val ?? "");
  });
}
