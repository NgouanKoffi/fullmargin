// src/pages/admin/Messages/SignatureTab.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Save,
  RotateCcw,
  ImagePlus,
  Link as LinkIcon,
  Scissors,
  Copy,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  notifySuccess,
  notifyError,
  notifyInfo,
  notifyWarning,
} from "../../../components/Notification";
import { api, ApiError } from "../../../lib/api";

/**
 * ⚠️ Nécessite que <NotificationHost /> soit monté globalement (ex: dans App.tsx)
 */

type SigState = {
  fromName: string;
  fromEmail: string;
  signatureHtml: string;
};

/** Utilitaire simple pour concaténer des classes Tailwind de manière conditionnelle. */
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const LS_KEY = "admin:mail:signature";
// On ne met PAS /api ici : `api` préfixe déjà avec VITE_API_BASE
const API_SIGNATURE = "/admin/mail/signature";
const UPLOAD_ENDPOINT = "/admin/mail/signature/upload-image";

/* ===================== Component ===================== */

export default function SignatureTab() {
  const [state, setState] = useState<SigState>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw) as SigState;
    } catch {
      // ignore malformed localStorage content
    }

    return {
      fromName: "",
      fromEmail: "",
      signatureHtml: DEFAULT_SIGNATURE_HTML,
    };
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [resetOpen, setResetOpen] = useState(false); // ← modal reset
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const canSave = useMemo(() => {
    return (
      state.fromEmail.trim().length > 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.fromEmail)
    );
  }, [state.fromEmail]);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  // Charge depuis le backend (robuste, via client `api`)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const json = await api.get<{ settings?: Partial<SigState> }>(
          API_SIGNATURE,
        );
        const s = json?.settings || {};
        if (!cancelled) {
          setState({
            fromName: typeof s.fromName === "string" ? s.fromName : "",
            fromEmail: typeof s.fromEmail === "string" ? s.fromEmail : "",
            signatureHtml:
              typeof s.signatureHtml === "string"
                ? s.signatureHtml
                : DEFAULT_SIGNATURE_HTML,
          });
        }
      } catch (e: unknown) {
        if (!cancelled) {
          let msg = e instanceof Error ? e.message : "Chargement impossible.";
          if (e instanceof ApiError) {
            if (e.status === 401)
              msg = "Accès refusé (401). Vérifie ta session.";
            else if (e.status === 403)
              msg = "Accès refusé (403). Rôle admin requis.";
            else if (
              typeof e.data === "string" &&
              e.data.startsWith("<!doctype")
            )
              msg = "Le serveur a renvoyé une page HTML au lieu d’un JSON.";
          } else if (/<!doctype html/i.test(msg)) {
            msg = "Le serveur a renvoyé une page HTML au lieu d’un JSON.";
          }
          setError(msg);
          try {
            notifyError("Impossible de charger la signature.", "Erreur");
          } catch {
            // noop si host notifications absent
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onChange =
    (k: keyof SigState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setState((s) => ({ ...s, [k]: e.target.value }));
    };

  function insertAtCursor(snippet: string) {
    const ta = taRef.current;
    if (!ta) {
      setState((s) => ({
        ...s,
        signatureHtml: (s.signatureHtml || "") + snippet,
      }));
      return;
    }
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    const next = ta.value.slice(0, start) + snippet + ta.value.slice(end);
    setState((s) => ({ ...s, signatureHtml: next }));

    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  /** Enregistrement factorisé (utilisé par le bouton et par la réinitialisation) */
  async function saveSignature(payload: SigState) {
    // Le client `api` sérialise `json` et gère l'en-tête Content-Type
    await api.put(API_SIGNATURE, payload);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || loading) return;
    setSavedOk(false);
    setError(null);
    try {
      setSaving(true);
      await saveSignature(state);
      setSavedOk(true);
      notifySuccess("Signature enregistrée avec succès.");
      setTimeout(() => setSavedOk(false), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Enregistrement impossible.";
      setError(msg);
      notifyError("Échec de l’enregistrement de la signature.", "Erreur");
    } finally {
      setSaving(false);
    }
  }

  // ——— Ouvre le modal de confirmation (au lieu d’un alert)
  function openResetModal() {
    setResetOpen(true);
  }

  // ——— Confirme la réinitialisation + enregistre automatiquement
  function confirmReset() {
    const reset: SigState = {
      fromName: "",
      fromEmail: "",
      signatureHtml: DEFAULT_SIGNATURE_HTML,
    };
    // Applique localement
    setState(reset);
    setResetOpen(false);

    // Enregistre côté backend (sans passer par la validation du bouton)
    (async () => {
      setSaving(true);
      try {
        await saveSignature(reset);
        notifyInfo("Signature réinitialisée et enregistrée.", "Info");
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 1500);
      } catch (e: unknown) {
        const msg =
          e instanceof Error
            ? e.message
            : "Échec de l’enregistrement après réinitialisation.";
        setError(msg);
        notifyError(msg, "Erreur");
      } finally {
        setSaving(false);
      }
    })();
  }

  function copyHtml() {
    navigator.clipboard
      .writeText(state.signatureHtml)
      .then(() => {
        setCopied(true);
        notifySuccess("HTML copié dans le presse-papiers.");
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        notifyWarning("Impossible de copier le HTML.", "Attention");
      });
  }

  async function handleFiles(files: FileList | null) {
    setUploadError(null);
    if (!files || !files.length) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      const msg = "Le fichier doit être une image.";
      setUploadError(msg);
      notifyWarning(msg, "Attention");
      return;
    }
    try {
      setUploading(true);
      const { url } = await uploadImage(file);
      if (!url) throw new Error("URL d’image manquante.");
      const imgSnippet = `<img src="${url}" alt="" style="max-width:180px;height:auto;vertical-align:middle;border:0;outline:none;text-decoration:none" />`;
      insertAtCursor(imgSnippet);
      notifySuccess("Image importée et insérée.");
    } catch {
      // Fallback: data URL
      try {
        const dataUrl = await readAsDataUrl(file);
        const imgSnippet = `<img src="${dataUrl}" alt="" style="max-width:180px;height:auto;vertical-align:middle;border:0;outline:none;text-decoration:none" />`;
        insertAtCursor(imgSnippet);
        notifyWarning(
          "Cloudinary indisponible, image intégrée en base64.",
          "Attention",
        );
      } catch (e2: unknown) {
        const msg =
          e2 instanceof Error ? e2.message : "Échec de l'import de l'image.";
        setUploadError(msg);
        notifyError(msg, "Erreur");
      }
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  /* --------------------------------- UI --------------------------------- */

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Colonne principale : Formulaire & Outils */}
        <form onSubmit={handleSave} className="space-y-6 lg:col-span-3">
          {/* Carte expéditeur */}
          <div className="rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900/50 p-4 sm:p-5 space-y-4">
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
              Expéditeur par défaut
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Nom
                </label>
                <input
                  value={state.fromName}
                  onChange={onChange("fromName")}
                  placeholder="FullMargin"
                  disabled={loading}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500 transition"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Email
                </label>
                <input
                  value={state.fromEmail}
                  onChange={onChange("fromEmail")}
                  placeholder="noreply@fullmargin.net"
                  disabled={loading}
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500 transition"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1.5">
                  Utilisé si aucun <code>sender</code> n’est fourni lors de
                  l’envoi.
                </p>
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Carte éditeur signature */}
          <div className="rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 bg-white dark:bg-zinc-900/50">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    insertAtCursor(
                      `<hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0" />`,
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800 text-sm transition"
                  title="Insérer un séparateur"
                  disabled={loading}
                >
                  <Scissors className="w-4 h-4" />
                  <span>Séparateur</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    insertAtCursor(
                      `<a href="https://fullmargin.net" target="_blank" rel="noreferrer" style="color:#7c3aed;text-decoration:none">fullmargin.net</a>`,
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800 text-sm transition"
                  title="Insérer un lien vers le site"
                  disabled={loading}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Lien</span>
                </button>

                <label className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800 text-sm cursor-pointer transition">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                    disabled={loading || uploading}
                  />
                  <ImagePlus className="w-4 h-4" />
                  <span>{uploading ? "Import…" : "Image"}</span>
                </label>
              </div>
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={copyHtml}
                  disabled={loading}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-inset text-sm transition-all",
                    copied
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-300 dark:ring-emerald-800"
                      : "ring-zinc-200 hover:bg-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800",
                  )}
                  title="Copier le HTML"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copied ? "Copié !" : "Copier"}</span>
                </button>
                <button
                  type="button"
                  onClick={openResetModal}
                  disabled={loading}
                  className="inline-flex items-center justify-center p-2 rounded-xl ring-1 ring-inset ring-zinc-200 hover:bg-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800 text-sm transition"
                  title="Réinitialiser"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Editor & Drop zone */}
            <div className="p-3 sm:p-4">
              <textarea
                ref={taRef}
                value={state.signatureHtml}
                onChange={onChange("signatureHtml")}
                rows={12}
                placeholder="Collez votre code HTML ici..."
                disabled={loading}
                className="w-full rounded-xl border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-800 p-3 font-mono text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500 transition"
              />

              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                className={cn(
                  "mt-3 rounded-xl border-2 border-dashed p-4 text-center text-sm transition-colors",
                  uploading
                    ? "border-violet-500/50 bg-violet-500/5 dark:bg-violet-900/10"
                    : "border-zinc-300 hover:border-violet-400 dark:border-zinc-700 dark:hover:border-violet-600",
                )}
              >
                <div className="text-zinc-500 dark:text-zinc-400">
                  {uploading
                    ? "Import de l’image…"
                    : "Glissez-déposez une image ici."}
                </div>
                {uploadError && (
                  <div className="text-xs text-red-600 dark:text-red-500 mt-2">
                    {uploadError}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSave || saving || loading}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 font-semibold transition",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600",
                canSave && !loading
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : "bg-zinc-200 text-zinc-500 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-400",
              )}
            >
              <Save className="w-4 h-4" />
              {saving
                ? "Enregistrement…"
                : savedOk
                  ? "Enregistré !"
                  : "Enregistrer"}
            </button>
          </div>
        </form>

        {/* Colonne secondaire : Prévisualisation */}
        <aside className="space-y-4 lg:col-span-2 lg:sticky lg:top-6 self-start">
          <h3 className="text-base font-semibold text-zinc-600 dark:text-zinc-300">
            Aperçu
          </h3>
          <div className="rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-700 bg-white dark:bg-black p-4 sm:p-5">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-zinc-700">
              <b>De :</b> {state.fromName || "Expéditeur"} &lt;
              {state.fromEmail || "email@exemple.com"}&gt;
            </div>
            <div
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: state.signatureHtml }}
            />
          </div>

          <div className="rounded-2xl ring-1 ring-amber-300/50 bg-amber-50/70 p-4 text-xs text-amber-900 dark:bg-amber-900/20 dark:text-amber-200 dark:ring-amber-500/30">
            <b className="font-semibold">Rappel :</b> Pour une compatibilité
            maximale, privilégiez des images hébergées et optimisées (~180px de
            large max).
          </div>
        </aside>
      </div>

      {/* Modal de réinitialisation */}
      <ResetConfirmModal
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={confirmReset}
      />
    </>
  );
}

/* ---------------- Modal de confirmation (réinitialisation) ---------------- */

function ResetConfirmModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  // Lock scroll + Escape
  useEffect(() => {
    if (!open) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-[1px]">
      <div className="absolute inset-0 grid place-items-center px-3">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-title"
          className="w-full max-w-md rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 id="reset-title" className="font-semibold">
              Réinitialiser la signature ?
            </h3>
            <button
              onClick={onCancel}
              className="ml-auto rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Fermer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 py-4 text-sm text-zinc-600 dark:text-zinc-300">
            Cette action remettra à zéro le nom, l’email expéditeur et le HTML
            de la signature puis <b>enregistrera automatiquement</b> ces
            valeurs. Voulez-vous continuer ?
          </div>

          <div className="px-4 pb-4 flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded-xl px-3 py-2 ring-1 ring-zinc-200 dark:ring-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="rounded-xl px-3 py-2 bg-violet-600 text-white hover:bg-violet-700 text-sm"
            >
              Réinitialiser et enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Utilitaires & constantes locales ---------------- */

const DEFAULT_SIGNATURE_HTML = `
<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
  <p style="margin: 0; font-weight: 700;">L'équipe FullMargin</p>
  <p style="margin: 4px 0 0; font-size: 12px; color: #666;">
    Support Client • <a href="https://fullmargin.net" target="_blank" rel="noreferrer" style="color: #7c3aed; text-decoration: none;">fullmargin.net</a>
  </p>
</div>
`.trim();

async function uploadImage(file: File): Promise<{ url?: string }> {
  const fd = new FormData();
  fd.append("file", file);
  // Utilise `api` directement pour laisser le navigateur gérer le boundary
  return api<{ url?: string }>(UPLOAD_ENDPOINT, {
    method: "POST",
    body: fd,
  });
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(new Error("Lecture du fichier impossible"));
    fr.readAsDataURL(file);
  });
}
