// src/pages/marketplace/tabs/shop/ShopForm.tsx
import { useEffect, useRef, useState } from "react";
import { Loader2, Store, CheckCircle2 } from "lucide-react";
import { cardBase, NAME_MAX, DESC_MAX, SIGN_MAX } from "./constants";
import {
  validateDesc,
  validateName,
  validateSignature,
  validateSizeAvatar,
  validateSizeCover,
} from "./validators";
import TextInputWithCount from "./components/TextInputWithCount";
import TextAreaWithCount from "./components/TextAreaWithCount";
import ImagePicker from "./components/ImagePicker";
import SuccessAnimation from "./components/SuccessAnimation";
import TutorialVideoModal from "./components/TutorialVideoModal";
import {
  createShop,
  getMyShop,
  updateShop,
  type Shop as ApiShop,
} from "../../lib/shopApi";

/* ---------------- helpers ---------------- */

function setShopExistsFlag(exists: boolean) {
  try {
    sessionStorage.setItem("fm:shop:exists", exists ? "1" : "0");
    window.dispatchEvent(new Event("fm:shop-refresh"));
  } catch (err) {
    // non-bloquant (quota / navigation privée)
    if (typeof console !== "undefined") {
      console.debug("[ShopForm] sessionStorage unavailable:", err);
    }
  }
}

function preload(src?: string | null) {
  if (!src) return Promise.resolve();
  return new Promise<void>((res) => {
    const img = new Image();
    img.onload = img.onerror = () => res();
    img.src = src;
  });
}

const MIN_LOADER_MS = 400;

/* ---------------- UI: Skeleton ---------------- */

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-neutral-200 dark:bg-neutral-800 ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
    </div>
  );
}

/* ---------------- component ---------------- */

export default function ShopForm({ onReady }: { onReady?: () => void }) {
  const notified = useRef(false);
  const notifyOnce = () => {
    if (notified.current) return;
    notified.current = true;
    onReady?.();
  };

  // Etat de chargement pour le shimmer
  const [loading, setLoading] = useState(true);

  // form state
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [signature, setSignature] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [coverDataUrl, setCoverDataUrl] = useState<string | null>(null);

  // backend state
  const [shopId, setShopId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // success flow state
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // charge la boutique puis précharge les images, puis notifie parent
  useEffect(() => {
    let mounted = true;
    const started = performance.now();

    (async () => {
      let av: string | null = null;
      let cv: string | null = null;

      try {
        const s = await getMyShop();
        if (!mounted) return;

        if (s) {
          setShopId(s.id);
          setName(s.name || "");
          setDesc(s.desc || "");
          setSignature(s.signature || "");
          av = s.avatarUrl || null;
          cv = s.coverUrl || null;
          setAvatarDataUrl(av);
          setCoverDataUrl(cv);
          setShopExistsFlag(true);
        } else {
          setShopExistsFlag(false);
        }
      } catch {
        /* ok – form vierge */
      }

      // précharge visuels pour éviter “apparition en morceaux”
      await Promise.all([preload(av), preload(cv)]);
      if (!mounted) return;

      const elapsed = performance.now() - started;
      const wait = Math.max(0, MIN_LOADER_MS - elapsed);
      window.setTimeout(() => {
        if (!mounted) return;
        setLoading(false);
        notifyOnce();
      }, wait);
    })();

    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isValid =
    validateName(name) &&
    validateDesc(desc) &&
    validateSignature(signature) &&
    !!avatarDataUrl &&
    !!coverDataUrl;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || isSaving) return;

    const isCreating = !shopId; // Track if this is a new shop creation
    setIsSaving(true);
    setJustSaved(false);
    try {
      if (isCreating) {
        const created = await createShop({
          name,
          desc,
          signature,
          avatarUrl: avatarDataUrl || undefined,
          coverUrl: coverDataUrl || undefined,
        });
        setShopId(created.id);
        setShopExistsFlag(true);
        
        // Show success animation, then tutorial modal
        setShowSuccessAnimation(true);
      } else {
        await updateShop(shopId, {
          name,
          desc,
          signature,
          avatarUrl: avatarDataUrl || "",
          coverUrl: coverDataUrl || "",
        } as Partial<ApiShop>);
        setShopExistsFlag(true);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1400);
      }
    } catch (err) {
      console.error("[ShopForm] save error:", err);
      alert("Sauvegarde impossible. Réessaie dans un instant.");
    } finally {
      setIsSaving(false);
    }
  }

  const handleSuccessAnimationComplete = () => {
    setShowSuccessAnimation(false);
    setShowTutorialModal(true);
  };

  const handleTutorialModalClose = () => {
    setShowTutorialModal(false);
  };

  /* ----- rendu ----- */
  return (
    <>
      {/* keyframes shimmer (local) */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* SKELETON (pendant le chargement) */}
      {loading ? (
        <div className="space-y-6">
          {/* header skeleton */}
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-2xl" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40 rounded-md mb-2" />
              <Skeleton className="h-3 w-64 rounded-md" />
            </div>
          </div>

          {/* fields skeleton */}
          <section className={cardBase}>
            <div className="grid gap-4">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-28 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </section>

          {/* avatar skeleton */}
          <section className={cardBase}>
            <Skeleton className="mx-auto size-[164px] rounded-full" />
            <div className="mt-4 flex justify-center">
              <Skeleton className="h-9 w-44 rounded-xl" />
            </div>
            <div className="mt-2 flex justify-center">
              <Skeleton className="h-3 w-56 rounded" />
            </div>
          </section>

          {/* cover skeleton */}
          <section className={cardBase}>
            <Skeleton className="w-full max-w-3xl aspect-[16/9] rounded-xl mx-auto" />
            <div className="mt-4 flex justify-center">
              <Skeleton className="h-9 w-44 rounded-xl" />
            </div>
            <div className="mt-2 flex justify-center">
              <Skeleton className="h-3 w-72 rounded" />
            </div>
          </section>

          {/* CTA skeleton centré */}
          <div className="flex justify-center">
            <Skeleton className="h-11 w-48 rounded-2xl" />
          </div>
        </div>
      ) : (
        // FORM normal
        <form onSubmit={onSubmit} className="space-y-6">
          {/* En-tête */}
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                <Store className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Ma boutique</h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Renseignez les informations principales de votre boutique.
                </p>
              </div>
            </div>
            
            {/* Help button */}
            {shopId && (
              <button
                type="button"
                onClick={() => setShowTutorialModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600/10 px-4 py-2 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
                title="Revoir le tutoriel"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Comment ça marche
              </button>
            )}
          </header>

          {/* Infos de base */}
          <section className={cardBase}>
            <div className="grid gap-4">
              <TextInputWithCount
                label="Nom de la boutique"
                required
                value={name}
                onChange={setName}
                max={NAME_MAX}
                placeholder="Ex. Alpha Trading Tools"
              />
              <TextAreaWithCount
                label="Description"
                required
                value={desc}
                onChange={setDesc}
                max={DESC_MAX}
                placeholder="Décrivez rapidement votre boutique…"
                minHeightClass="min-h-[140px]"
              />
              <TextInputWithCount
                label="Signature"
                required
                value={signature}
                onChange={setSignature}
                max={SIGN_MAX}
                placeholder="Slogan court (ex. « Des outils précis, des décisions rapides. »)"
              />
            </div>
          </section>

          {/* Photo de profil */}
          <ImagePicker
            spec={{ label: "Photo de profil", shape: "round", maxBytes: 0 }}
            value={avatarDataUrl}
            onChange={setAvatarDataUrl}
            note="PNG/JPG • 512×512 min • < 2 Mo"
            validateSize={validateSizeAvatar}
          />

          {/* Image de couverture */}
          <ImagePicker
            spec={{
              label: "Image de couverture",
              shape: "rect-16x9",
              maxBytes: 0,
            }}
            value={coverDataUrl}
            onChange={setCoverDataUrl}
            note="16:9 recommandé • 1280×720 min • < 4 Mo"
            validateSize={validateSizeCover}
          />

          {/* CTA centré */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {justSaved && !isSaving && (
              <span
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/10 px-3 py-2 text-sm font-medium text-emerald-700
                           dark:bg-emerald-400/10 dark:text-emerald-300"
                aria-live="polite"
              >
                <CheckCircle2 className="size-4" />
                Enregistré !
              </span>
            )}

            <button
              type="submit"
              disabled={!isValid || isSaving}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-600/30
                         hover:bg-violet-500 active:scale-[.99]
                         disabled:opacity-60 disabled:cursor-not-allowed"
              aria-busy={isSaving}
              title={
                isValid
                  ? shopId
                    ? "Mettre à jour"
                    : "Créer ma boutique"
                  : "Remplissez tous les champs obligatoires"
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Enregistrement…
                </>
              ) : shopId ? (
                "Mettre à jour"
              ) : (
                "Créer ma boutique"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Success Animation */}
      {showSuccessAnimation && (
        <SuccessAnimation onComplete={handleSuccessAnimationComplete} />
      )}

      {/* Tutorial Video Modal */}
      <TutorialVideoModal
        isOpen={showTutorialModal}
        onClose={handleTutorialModalClose}
      />
    </>
  );
}
