// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\products\AddProductForm.tsx
import { useEffect, useState } from "react";
// AJOUT DE Loader2 ICI
import { Upload, X, Loader2 } from "lucide-react";

import {
  createProduct,
  getProduct,
  patchProduct,
  listUserCategories,
  type CategoryLite,
  type ProductFull,
} from "../../lib/productApi";
import { validateProduct, type FormError } from "./validation";
import { requiresVerification, badgeEligible, publicationDelay } from "./rules";

import type { Product, ProductType, Pricing } from "./types";
import { Card } from "./AddForm/ui";

import TypeSection from "./AddForm/TypeSection";
import DetailsSection from "./AddForm/DetailsSection";
import MediaSection from "./AddForm/MediaSection";
import PricingSection from "./AddForm/PricingSection";
import TermsSection from "./AddForm/TermsSection";
import SummaryPanel from "./AddForm/SummaryPanel";
import Modal from "./AddForm/Modal";

// 🔗 sera remplacé par ton vrai lien
const ROBOT_DOC_URL = "https://documentation.fullmargin.net/marketplace-robot/";

// ✅ Type local pour éviter any sur gallery / videoUrls
type ProductFullWithMedia = ProductFull & {
  gallery?: unknown;
  videoUrls?: unknown;
};

// ✅ Type qui accepte aussi la valeur vide
type MaybeProductType = ProductType | "";

function fmtUSD(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export default function AddProductForm({
  editId,
  onSaved,
  onCancelEdit,
}: {
  editId?: string;
  onSaved?: () => void;
  onCancelEdit?: () => void;
}) {
  const isEdit = !!editId;

  // --- State
  const [type, setType] = useState<MaybeProductType>("");
  const [title, setTitle] = useState("");
  const [shortDescription, setShort] = useState("");
  const [longDescription, setLong] = useState("");

  // Catégorie (clé) + liste depuis API
  const [category, setCategory] = useState("");
  const [cats, setCats] = useState<CategoryLite[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [gallery, setGallery] = useState<string[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);

  // Fichier vendu
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string | undefined>();
  const [fileMime, setFileMime] = useState<string | undefined>();

  const [pricing, setPricing] = useState<Pricing>({
    mode: "one_time",
    amount: 0,
  });
  const [terms, setTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormError>({});
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [errorModal, setErrorModal] = useState<{
    open: boolean;
    title: string;
    message: string;
  }>({ open: false, title: "", message: "" });

  // Pop-up spécial robots
  const [robotModalOpen, setRobotModalOpen] = useState(false);

  // ✅ badge réellement attribué (vient du backend en édition)
  const [badgeGranted, setBadgeGranted] = useState(false);

  // ✅ abonnement uniquement pour robots
  const allowSubscription = type === "robot_trading";

  // ✅ garde-fou: si type != robot et pricing == subscription, on force one_time
  useEffect(() => {
    if (!allowSubscription && pricing.mode === "subscription") {
      setPricing({ mode: "one_time", amount: pricing.amount ?? 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowSubscription]);

  // Règles (si pas de type → valeurs neutres)
  const needsVerification = type ? requiresVerification[type] : false;

  // ⚠️ IMPORTANT:
  // canBadge = “candidat au badge” (selon type)
  // badgeGranted = badge réellement attribué (back)
  const canBadge = type ? badgeEligible[type] : false;

  const delay: "admin" | "immediate" = type
    ? publicationDelay[type]
    : "immediate";

  // helper conversion fichier -> dataURL
  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onerror = () => reject(fr.error ?? new Error("Lecture échouée"));
      fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : "");
      fr.readAsDataURL(file);
    });
  }

  /* ========= Charger la liste des catégories ========= */
  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        setCatsLoading(true);
        const data = await listUserCategories();
        if (!stop) setCats(data);
      } finally {
        if (!stop) setCatsLoading(false);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  /* ========= Sélection par défaut (création) ========= */
  useEffect(() => {
    if (!isEdit && !category && cats.length) {
      setCategory(cats[0].key);
    }
  }, [cats, isEdit, category]);

  /* ========= Charger les données en mode édition ========= */
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!editId) return;
      setLoadingEdit(true);
      try {
        const full = (await getProduct(editId)) as ProductFullWithMedia;
        if (!mounted) return;

        setType(full.type as MaybeProductType);
        setTitle(full.title || "");
        setShort(full.shortDescription || "");
        setLong(full.longDescription || "");
        setCategory(full.category || "");
        setImageUrl(full.imageUrl || undefined);

        // ✅ badge attribué (le vrai)
        setBadgeGranted(!!full.badgeEligible);

        // ✅ Galerie normalisée
        const normalizedGallery: string[] =
          Array.isArray(full.gallery) &&
          full.gallery.every((item) => typeof item === "string")
            ? (full.gallery as string[])
            : Array.isArray(full.images)
              ? full.images
              : full.imageUrl
                ? [full.imageUrl]
                : [];

        setGallery(normalizedGallery);

        // ✅ Vidéos normalisées
        const normalizedVideoUrls: string[] =
          Array.isArray(full.videoUrls) &&
          full.videoUrls.every((item) => typeof item === "string")
            ? (full.videoUrls as string[])
            : [];

        setVideoUrls(normalizedVideoUrls);

        // fichier (méta uniquement)
        setFileObj(null);
        setFileDataUrl(undefined);
        setFileName(full.fileName || undefined);
        setFileMime(full.fileMime || undefined);

        // ✅ normalise pricing si subscription sur un non-robot (legacy/bug)
        const loadedPricing = full.pricing;
        if (
          full.type !== "robot_trading" &&
          loadedPricing?.mode === "subscription"
        ) {
          setPricing({ mode: "one_time", amount: loadedPricing.amount ?? 0 });
        } else {
          setPricing(loadedPricing);
        }

        setTerms(full.termsAccepted ?? false);
        setErrors({});
      } catch (e) {
        setErrorModal({
          open: true,
          title: "Erreur",
          message:
            e instanceof Error ? e.message : "Chargement du produit impossible",
        });
      } finally {
        setLoadingEdit(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [editId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    if (!type) {
      setErrors((prev) => ({
        ...prev,
        type: "Veuillez choisir un type de produit.",
      }));
      setSubmitting(false);
      return;
    }

    const typedType = type as ProductType;

    // ✅ sécurité: abonnement uniquement pour robots
    if (typedType !== "robot_trading" && pricing.mode === "subscription") {
      setErrors((prev) => ({
        ...prev,
        pricing: "L’abonnement est disponible uniquement pour les robots.",
      }));
      setSubmitting(false);
      return;
    }

    // ✅ IMPORTANT: badgeEligible = badge réellement attribué (jamais auto à la création)
    // Sur création, badgeGranted est false → donc badgeEligible: false.
    const toValidate: Product = {
      id: editId || "temp",
      title,
      shortDescription,
      longDescription,
      category: category || undefined,
      type: typedType,
      imageUrl,
      fileName,
      fileMime,
      pricing,
      termsAccepted: terms,
      status: needsVerification ? "pending" : "published",
      badgeEligible: badgeGranted, // ✅ NE PLUS METTRE canBadge ICI
      createdAt: Date.now(),
    };

    const ve = validateProduct(toValidate);
    if (Object.keys(ve).length > 0) {
      setErrors(ve);
      setSubmitting(false);
      return;
    }

    try {
      // upload fichier si nouveau
      let dataUrlToSend = fileDataUrl;
      if (fileObj) {
        dataUrlToSend = await fileToDataUrl(fileObj);
        setFileDataUrl(dataUrlToSend);
      }

      const common = {
        title,
        shortDescription,
        longDescription,
        category: category || undefined,
        type: typedType,
        imageUrl,
        gallery,
        videoUrls,
        fileDataUrl: dataUrlToSend,
        fileName,
        fileMime,
        pricing,
        termsAccepted: terms,
      } as const;

      if (isEdit && editId) {
        await patchProduct(
          editId,
          common as unknown as Record<string, unknown>,
        );
      } else {
        await createProduct(
          common as unknown as {
            title: string;
            shortDescription: string;
            longDescription: string;
            category?: string;
            type: ProductType;
            imageUrl?: string;
            gallery?: string[];
            videoUrls?: string[];
            fileDataUrl?: string;
            fileName?: string;
            fileMime?: string;
            pricing: Pricing;
            termsAccepted: boolean;
          },
        );
      }

      window.dispatchEvent(new Event("fm:products-refresh"));

      if (!isEdit) {
        setErrors({});
        setType("");
        setTitle("");
        setShort("");
        setLong("");
        setImageUrl(undefined);
        setGallery([]);
        setVideoUrls([]);
        setFileObj(null);
        setFileDataUrl(undefined);
        setFileName(undefined);
        setFileMime(undefined);
        setPricing({ mode: "one_time", amount: 0 });
        setTerms(false);

        // ✅ reset badge (toujours false à la création)
        setBadgeGranted(false);
      }

      onSaved?.();
    } catch (err) {
      setErrorModal({
        open: true,
        title: "Erreur",
        message:
          err instanceof Error
            ? err.message
            : "Erreur lors de l’enregistrement",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const price = Number(pricing?.amount ?? 0) || 0;

  // changement type → pop-up robots + reset pricing si on quitte robot
  const handleTypeChange = (newType: MaybeProductType) => {
    setType(newType);

    if (newType !== "robot_trading" && pricing.mode === "subscription") {
      setPricing({ mode: "one_time", amount: pricing.amount ?? 0 });
    }

    if (!isEdit && newType === "robot_trading") {
      setRobotModalOpen(true);
    }
  };

  return (
    <form onSubmit={onSubmit} className="grid xl:grid-cols-3 gap-6 relative">
      {/* ✅ OVERLAY DE CHARGEMENT 
          S'affiche si on est en train de submit OU de charger les données d'édition
      */}
      {(submitting || loadingEdit) && (
        <div className="fixed inset-0 z-[60] bg-white/50 dark:bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center cursor-wait">
          <div className="bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 shadow-2xl rounded-2xl p-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95">
            <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
            <div className="text-lg font-medium">
              {loadingEdit
                ? "Chargement des données..."
                : "Mise en ligne en cours..."}
            </div>
            <div className="text-sm opacity-60">
              Merci de patienter, ne fermez pas la page.
            </div>
          </div>
        </div>
      )}

      {/* LEFT */}
      <div className="xl:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {isEdit ? "Modifier le produit" : "Ajouter un produit"}
          </h3>
          {isEdit && onCancelEdit ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              title="Annuler la modification"
            >
              <X className="w-4 h-4" />
              Annuler
            </button>
          ) : null}
        </div>

        {/* Catégorie */}
        <Card>
          <div className="space-y-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Catégorie</span>
              {catsLoading ? (
                <div className="text-sm opacity-70">
                  Chargement des catégories…
                </div>
              ) : cats.length > 0 ? (
                <select
                  value={category}
                  onChange={(ev) => setCategory(ev.target.value)}
                  className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Sélectionner…</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.key}>
                      {c.label} ({c.key})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm opacity-70">
                  Aucune catégorie disponible. Contactez l’administrateur.
                </div>
              )}
            </label>
          </div>
        </Card>

        <TypeSection
          type={type}
          onChangeType={handleTypeChange}
          needsVerification={needsVerification}
          canBadge={canBadge} // candidat
          badgeGranted={badgeGranted} // réel
          delay={delay}
        />

        <DetailsSection
          title={title}
          shortDescription={shortDescription}
          longDescription={longDescription}
          onChangeTitle={setTitle}
          onChangeShort={setShort}
          onChangeLong={setLong}
          errors={errors}
          showCategory={false}
        />

        <MediaSection
          imageUrl={imageUrl}
          fileName={fileName}
          gallery={gallery}
          videoUrls={videoUrls}
          onChangeImageUrl={setImageUrl}
          onChangeGallery={setGallery}
          onChangeVideoUrls={setVideoUrls}
          onChangeFile={({ file, name, mime }) => {
            setFileObj(file ?? null);
            setFileName(name);
            setFileMime(mime);
          }}
        />

        <PricingSection
          pricing={pricing}
          onChangePricing={setPricing}
          error={errors.pricing}
          allowSubscription={allowSubscription}
        />

        {/* Récap prix : Gratuit si 0 */}
        <Card>
          <div className="text-sm space-y-1" aria-live="polite">
            <div className="flex items-center justify-between">
              <span className="opacity-70">Prix saisi</span>
              <b>{price === 0 ? "Gratuit" : fmtUSD(price)}</b>
            </div>
          </div>
        </Card>

        <TermsSection
          checked={terms}
          onChange={setTerms}
          error={errors.termsAccepted}
        />
      </div>

      {/* RIGHT */}
      <div className="xl:col-span-1">
        <div className="xl:sticky xl:top-6 space-y-4">
          <SummaryPanel
            type={type}
            needsVerification={needsVerification}
            canBadge={canBadge}
            badgeGranted={badgeGranted}
            delay={delay}
          />

          <button
            type="submit"
            disabled={submitting || loadingEdit}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white px-4 py-3 text-sm font-medium hover:bg-violet-700 disabled:opacity-60"
          >
            {/* On garde l'icône, mais l'overlay gère le gros du feedback */}
            <Upload className="w-4 h-4" />
            {submitting
              ? isEdit
                ? "Mise à jour..."
                : "Envoi..."
              : isEdit
                ? "Enregistrer les modifications"
                : "Mettre en ligne"}
          </button>

          <Card>
            <div className="text-xs opacity-60">
              Statut cible :{" "}
              <b>{needsVerification ? "pending" : "published"}</b>
            </div>
          </Card>
        </div>
      </div>

      {/* Error modal */}
      <Modal
        open={errorModal.open}
        title={errorModal.title}
        onClose={() => setErrorModal((m) => ({ ...m, open: false }))}
        footer={
          <button
            type="button"
            onClick={() => setErrorModal((m) => ({ ...m, open: false }))}
            className="px-4 py-2 rounded-lg text-sm bg-violet-600 text-white hover:bg-violet-700"
          >
            OK
          </button>
        }
      >
        <div className="text-sm opacity-80 whitespace-pre-line">
          {errorModal.message}
        </div>
      </Modal>

      {/* Modal info robots */}
      <Modal
        open={robotModalOpen}
        title="Vous voulez vendre un robot de trading ?"
        onClose={() => setRobotModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRobotModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm bg-neutral-200 text-neutral-900 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => {
                if (ROBOT_DOC_URL)
                  window.open(ROBOT_DOC_URL, "_blank", "noopener,noreferrer");
                setRobotModalOpen(false);
              }}
              className="px-4 py-2 rounded-lg text-sm bg-violet-600 text-white hover:bg-violet-700"
            >
              Comment ça marche ?
            </button>
          </div>
        }
      >
        <div className="text-sm opacity-80 space-y-2">
          <p>
            Vous voulez vendre un robot de trading ? L'ajout de robot dans la
            marketplace nécessite un système plus complet que nous avons
            détaillé pour vous. Découvrez comment ça fonctionne
          </p>
        </div>
      </Modal>
    </form>
  );
}
