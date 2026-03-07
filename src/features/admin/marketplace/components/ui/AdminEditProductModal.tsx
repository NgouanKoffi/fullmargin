import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Save, X } from "lucide-react";
import type {
  AdminCategory,
  AdminProductFull,
  PatchProductBody,
} from "../../api/types";
import { getAdminProduct, adminProductFileUrl } from "../../api/client";

/* --- IMPORTS BLOCKNOTE INTÉGRÉS --- */
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/mantine/style.css";

/* ========== Props ========== */
export type AdminEditProductModalProps = {
  open: boolean;
  productId: string | null;
  onClose: () => void;
  onSave: (id: string, patch: PatchProductBody) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onRestore?: (id: string) => void | Promise<void>;
  categories: AdminCategory[];
};

/* ========== UI helpers ========== */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 ${
        props.className ?? ""
      }`}
    />
  );
}

function Tag({
  children,
  color = "green",
}: {
  children: React.ReactNode;
  color?: "amber" | "green" | "violet";
}) {
  const cls =
    color === "amber"
      ? "bg-amber-600/15 text-amber-700 dark:text-amber-300"
      : color === "violet"
        ? "bg-violet-600/15 text-violet-700 dark:text-violet-300"
        : "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${cls}`}
    >
      {children}
    </span>
  );
}

/* ========== COMPOSANT ÉDITEUR INTERNE (Code BlockNote isolé ici) ========== */
function AdminBlockNoteEditor({
  initialContent,
  onChange,
}: {
  initialContent?: string;
  onChange: (json: string) => void;
}) {
  // Détection auto du thème Dark/Light pour l'éditeur
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const updateTheme = () =>
      setTheme(root.classList.contains("dark") ? "dark" : "light");
    updateTheme();
    const obs = new MutationObserver(updateTheme);
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const editor = useCreateBlockNote({
    initialContent: useMemo(() => {
      if (!initialContent) return undefined;

      try {
        // 1. Essai de parsing JSON standard
        let parsed = JSON.parse(initialContent);

        // 2. CORRECTION DOUBLE ENCODAGE : Si le résultat est encore une string, on re-parse
        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch {
            // Si ça échoue, c'est juste du texte
          }
        }

        // 3. Si c'est un tableau de blocs valide
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as PartialBlock[];
        }

        // 4. Support ancien format objet { content: [...] }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (parsed?.content && Array.isArray((parsed as any).content)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (parsed as any).content as PartialBlock[];
        }

        // Si vide ou invalide mais parsé
        return undefined;
      } catch {
        // 5. FALLBACK TEXTE BRUT : Si ce n'est pas du JSON valide, on l'affiche comme texte
        // Cela règle le problème où tu voyais rien ou du code cassé.
        return [
          {
            type: "paragraph",
            content: [{ type: "text", text: initialContent }],
          },
        ] as PartialBlock[];
      }
    }, [initialContent]),
  });

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 overflow-hidden min-h-[150px]">
      <BlockNoteView
        editor={editor}
        theme={theme}
        onChange={() => {
          // On renvoie toujours une string JSON propre
          onChange(JSON.stringify(editor.document));
        }}
      />
    </div>
  );
}

/* ========== MODAL PRINCIPAL ========== */
export default function AdminEditProductModal({
  open,
  productId,
  onClose,
  onSave,
  categories,
}: AdminEditProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<AdminProductFull | null>(null);

  // Champs du formulaire
  const [title, setTitle] = useState("");
  // On utilise ces états pour stocker le JSON stringifié
  const [shortDescription, setShort] = useState("");
  const [longDescription, setLong] = useState("");

  const [categoryKey, setCategoryKey] = useState("");
  const [type, setType] = useState<string>("robot_trading");
  const [status, setStatus] = useState<string>("pending");
  const [amount, setAmount] = useState<number>(0);
  const [mode, setMode] = useState<"one_time" | "subscription">("one_time");
  const [interval, setInterval] = useState<"month" | "year">("month");

  // Tri des catégories
  const categoryOptions = useMemo(
    () =>
      [...(categories || [])].sort((a, b) =>
        (a.label || a.key).localeCompare(b.label || b.key, "fr"),
      ),
    [categories],
  );

  useEffect(() => {
    let stop = false;
    async function load() {
      if (!open || !productId) {
        setData(null);
        return;
      }
      setLoading(true);
      try {
        const r = await getAdminProduct(productId);
        if (!r.ok) throw new Error(r.error);
        if (stop) return;

        const p = r.data.product;
        setData(p);
        setTitle(p.title ?? "");

        // On charge le contenu brut (qui peut être du JSON ou du texte)
        // L'éditeur interne se chargera de le "nettoyer" à l'affichage
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyP = p as any;
        // On vérifie si une version JSON existe (nouveau format), sinon on prend la version texte (ancien format)
        setShort(anyP.shortDescriptionJson || p.shortDescription || "");
        setLong(anyP.longDescriptionJson || p.longDescription || "");

        setCategoryKey(p.category?.key ?? "");
        setType(p.type ?? "robot_trading");
        setStatus(p.status ?? "pending");
        const pr = p.pricing;
        setMode(pr?.mode === "subscription" ? "subscription" : "one_time");
        setAmount(Number(pr?.amount ?? 0));
        setInterval(
          pr?.mode === "subscription"
            ? pr.interval === "year"
              ? "year"
              : "month"
            : "month",
        );
      } catch (e) {
        console.error(e);
      } finally {
        if (!stop) setLoading(false);
      }
    }
    load();
    return () => {
      stop = true;
    };
  }, [open, productId]);

  if (!open) return null;

  const fileName = data?.fileName || "fichier";
  const hasFile = !!data?.fileUrl;
  const downloadUrl =
    hasFile && productId
      ? adminProductFileUrl(productId, fileName, "attachment")
      : undefined;

  async function handleSave() {
    if (!productId) return;
    setSaving(true);
    try {
      // Pour l'indexation (recherche), on extrait un texte brut approximatif
      // Mais on sauvegarde surtout le JSON structuré
      const extractRawText = (jsonStr: string) => {
        try {
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            return parsed
              .map((b: any) =>
                Array.isArray(b.content)
                  ? b.content.map((c: any) => c.text || "").join("")
                  : "",
              )
              .join("\n");
          }
        } catch {
          return jsonStr;
        }
        return jsonStr;
      };

      const patch: PatchProductBody = {
        title,

        // On envoie le JSON dans le champ JSON pour l'affichage riche
        // @ts-expect-error: Champ ajouté dynamiquement si types.ts pas à jour
        shortDescriptionJson: shortDescription,
        // On envoie le texte brut dans le champ classique pour compatibilité
        shortDescription: extractRawText(shortDescription),

        longDescriptionJson: longDescription,
        longDescription: extractRawText(longDescription),

        categoryKey: categoryKey || undefined,
        type,
        status,
        pricing:
          mode === "subscription"
            ? { mode, amount, interval }
            : { mode: "one_time", amount },
      };
      await onSave(productId, patch);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const hasCurrentCategory =
    !!categoryKey && categoryOptions.some((c) => c.key === categoryKey);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 grid place-items-center p-0 sm:p-6">
        <div className="w-full h-full sm:h-auto sm:max-h-[90vh] max-w-full sm:max-w-2xl md:max-w-3xl bg-white dark:bg-neutral-950 shadow-2xl ring-1 ring-black/10 dark:ring-white/10 rounded-none sm:rounded-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-black/10 dark:border-white/10">
            <div className="min-w-0">
              <h3 className="text-base font-semibold truncate">
                Éditer le produit {data ? `— ${data.title}` : ""}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                {data?.badgeEligible && <Tag color="violet">Vérifié</Tag>}
                <Tag color="green">{data?.status || "—"}</Tag>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body (scrollable) */}
          <div className="min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-5 pb-40 sm:pb-16">
            {/* File Section */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Fichier vendu</div>
              <div className="rounded-xl ring-1 ring-black/10 dark:ring-white/10 bg-neutral-50 dark:bg-neutral-900 px-3 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {loading ? (
                    <div className="inline-flex items-center gap-2 opacity-70">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Chargement…</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium truncate">
                        {hasFile ? fileName : "Aucun fichier"}
                      </div>
                      {!hasFile && <div className="text-xs opacity-60">—</div>}
                    </>
                  )}
                </div>

                {hasFile ? (
                  <a
                    href={downloadUrl}
                    download={fileName || undefined}
                    className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 text-white px-3 py-2 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger
                  </a>
                ) : (
                  <span className="text-sm opacity-60">—</span>
                )}
              </div>
            </div>

            {/* FORM */}
            <Field label="Titre">
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre du produit"
              />
            </Field>

            {/* ✅ RESUME (Éditeur Riche Interne) */}
            <Field label="Résumé (Rich Text)">
              {!loading && (
                <AdminBlockNoteEditor
                  key={"short-" + productId} // Force refresh quand le produit change
                  initialContent={shortDescription}
                  onChange={setShort}
                />
              )}
            </Field>

            {/* ✅ DESCRIPTION (Éditeur Riche Interne) */}
            <Field label="Description détaillée (Rich Text)">
              {!loading && (
                <AdminBlockNoteEditor
                  key={"long-" + productId} // Force refresh quand le produit change
                  initialContent={longDescription}
                  onChange={setLong}
                />
              )}
            </Field>

            <Field label="Catégorie">
              {categoryOptions.length > 0 ? (
                <select
                  value={
                    hasCurrentCategory
                      ? categoryKey
                      : (categoryOptions[0]?.key ?? "")
                  }
                  onChange={(e) => setCategoryKey(e.target.value)}
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {!hasCurrentCategory && categoryKey && (
                    <option value={categoryKey}>
                      (Ancienne) {categoryKey}
                    </option>
                  )}
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.key}>
                      {c.label} ({c.key})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm opacity-70">
                  Aucune catégorie disponible. Créez-en une dans l’onglet «
                  Catégories ».
                </div>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Type">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="robot_trading">robot_trading</option>
                  <option value="indicator">indicator</option>
                  <option value="mt4_mt5">mt4_mt5</option>
                  <option value="ebook_pdf">ebook_pdf</option>
                  <option value="template_excel">template_excel</option>
                </select>
              </Field>

              <Field label="Statut">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="pending">pending</option>
                  <option value="published">published</option>
                  <option value="suspended">suspended</option>
                  <option value="rejected">rejected</option>
                  <option value="draft">draft</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Mode de prix">
                <select
                  value={mode}
                  onChange={(e) =>
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setMode(e.target.value as any)
                  }
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="one_time">one_time</option>
                  <option value="subscription">subscription</option>
                </select>
              </Field>
              <Field label="Montant">
                <TextInput
                  type="number"
                  step="0.01"
                  value={Number.isFinite(amount) ? amount : 0}
                  onChange={(e) => setAmount(parseFloat(e.target.value || "0"))}
                />
              </Field>
              {mode === "subscription" && (
                <Field label="Intervalle">
                  <select
                    value={interval}
                    onChange={(e) =>
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setInterval(e.target.value as any)
                    }
                    className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="month">month</option>
                    <option value="year">year</option>
                  </select>
                </Field>
              )}
            </div>
          </div>

          {/* Footer (collant) */}
          <div className="sticky bottom-0 flex flex-col sm:flex-row items-center justify-end gap-2 px-4 sm:px-6 py-3 border-t border-black/10 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 backdrop-blur">
            <button
              onClick={onClose}
              className="w-full sm:w-auto rounded-lg px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/5"
            >
              Fermer
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 text-white px-3 py-2 hover:bg-violet-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
