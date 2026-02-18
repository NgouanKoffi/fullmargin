// src/pages/communaute/private/community-details/tabs/CommunityProfil/about/AboutTabAdmin.tsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Upload, Trash2, Eye, Lock, Copy, Check } from "lucide-react";

import type {
  CommunityCreateFiles,
  CommunityCreatePayload,
  CommunityTradingCategory,
} from "../../types";
import {
  useCommunityDraft,
  type CommunityDraft,
} from "../../hooks/useCommunityDraft";
import { useAutoSlug } from "../../hooks/useSlugCheck";
import { useNameCheck } from "../../hooks/useNameCheck";

import type { ToastKind } from "../CommunityProfil/Toast";
import CategorySelect from "../CommunityProfil/CategorySelect";
import Toast from "../CommunityProfil/Toast";
import ImageLightbox from "../CommunityProfil/ImageLightbox";
import SuccessAnimation from "./SuccessAnimation";
import TutorialVideoModal from "./TutorialVideoModal";
import {
  createCommunity,
  updateCommunity,
} from "../../services/community.service";

/* ===== placeholders (light + dark) ===== */
const PH_COVER_LIGHT =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='360'>
    <rect width='100%' height='100%' rx='28' fill='#e2e8f0'/>
    <text x='50%' y='52%' text-anchor='middle' fill='rgba(15,23,42,.45)' font-family='Inter,Arial' font-size='26'>Image de couverture</text>
  </svg>`
  );

const PH_COVER_DARK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='360'>
    <rect width='100%' height='100%' rx='28' fill='#0f172a'/>
    <text x='50%' y='52%' text-anchor='middle' fill='rgba(226,232,240,.7)' font-family='Inter,Arial' font-size='26'>Image de couverture</text>
  </svg>`
  );

const PH_LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'>
    <circle cx='128' cy='128' r='128' fill='#0f172a'/>
    <circle cx='128' cy='102' r='48' fill='#1f2937'/>
    <rect x='48' y='168' width='160' height='64' rx='32' fill='#1f2937'/>
  </svg>`
  );

type Props = {
  redirectAfterCreate?: boolean;
};

export default function AboutTabAdmin({ redirectAfterCreate = false }: Props) {
  const MIN_NAME_CHARS = 3;
  const MIN_DESCRIPTION_CHARS = 80;

  const navigate = useNavigate();
  const { loading, draft, save } = useCommunityDraft();

  // état principal
  const [name, setName] = useState<string>(draft?.name ?? "");
  const [originalSlug] = useState<string>(draft?.slug ?? "");
  const [visibility, setVisibility] = useState<"public" | "private">(
    draft?.visibility ?? "private"
  );
  const [category, setCategory] = useState<CommunityTradingCategory>(
    (draft?.category ?? "trading_markets") as CommunityTradingCategory
  );
  const [description, setDescription] = useState<string>(
    draft?.description ?? ""
  );

  const [touched, setTouched] = useState(false);

  const [cover, setCover] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState<string>(draft?.coverUrl ?? "");
  const [logoUrl, setLogoUrl] = useState<string>(draft?.logoUrl ?? "");

  const [communityId, setCommunityId] = useState<string | null>(
    draft?.id ?? null
  );
  const createdOnce = Boolean(communityId);

  const { checking: nameChecking, ok: nameOk } = useNameCheck(
    name,
    draft?.name
  );
  const { slug, status, checking, autoAdjusted } = useAutoSlug(
    name,
    originalSlug
  );

  // thème
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (document.documentElement.classList.contains("dark")) return true;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });
  useEffect(() => {
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mql?.addEventListener("change", handler);
    return () => mql?.removeEventListener("change", handler);
  }, []);

  // resync du draft
  useEffect(() => {
    if (!draft) return;
    if (touched) return;

    setName(draft.name ?? "");
    setDescription(draft.description ?? "");
    setVisibility((draft.visibility as "public" | "private") ?? "private");
    setCategory(
      (draft.category ?? "trading_markets") as CommunityTradingCategory
    );
    setCoverUrl(draft.coverUrl ?? "");
    setLogoUrl(draft.logoUrl ?? "");
    setCommunityId(draft.id ?? null);
    setCover(null);
    setLogo(null);
  }, [draft?.id, touched]); // eslint-disable-line react-hooks/exhaustive-deps

  // previews
  const coverPreview = useMemo(() => {
    if (cover) return URL.createObjectURL(cover);
    if (coverUrl) return coverUrl;
    return isDark ? PH_COVER_DARK : PH_COVER_LIGHT;
  }, [cover, coverUrl, isDark]);

  const logoPreview = useMemo(
    () => (logo ? URL.createObjectURL(logo) : logoUrl || PH_LOGO),
    [logo, logoUrl]
  );

  // lightbox
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const lbImages = useMemo(
    () => [
      { src: coverPreview, alt: "Image de couverture" },
      { src: logoPreview, alt: "Logo" },
    ],
    [coverPreview, logoPreview]
  );

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastKind, setToastKind] = useState<ToastKind>("success");
  const [toastMsg, setToastMsg] = useState("");

  // validation locale
  const hasCover = Boolean(cover) || Boolean(coverUrl);
  const hasLogo = Boolean(logo) || Boolean(logoUrl);
  const nameLen = name.trim().length;
  const descLen = description.trim().length;
  const nameOkLocal = nameLen >= MIN_NAME_CHARS;
  const descOkLocal = descLen >= MIN_DESCRIPTION_CHARS;

  const canSubmitLocal =
    nameOkLocal &&
    slug.trim().length >= 3 &&
    descOkLocal &&
    hasCover &&
    hasLogo &&
    status !== "error" &&
    !checking &&
    nameOk === true;

  const [serverSubmitting, setServerSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // success flow state
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  const [copiedSlug, setCopiedSlug] = useState(false);

  function updateDraft(partial: Partial<CommunityDraft>) {
    save(partial);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitLocal || serverSubmitting) return;

    const payload: CommunityCreatePayload = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      visibility,
      category,
      description: description.trim(),
    };
    const files: CommunityCreateFiles = { cover, logo };

    const isCreating = !createdOnce; // Track if this is a new community creation
    
    try {
      setServerError(null);
      setServerSubmitting(true);

      const out =
        createdOnce && communityId
          ? await updateCommunity(communityId, payload, files)
          : await createCommunity(payload, files);

      if (!createdOnce) setCommunityId(out.id);
      if (out.coverUrl) setCoverUrl(out.coverUrl);
      if (out.logoUrl) setLogoUrl(out.logoUrl);

      updateDraft({
        id: out.id || communityId || "new",
        name,
        slug: out.slug || slug,
        visibility,
        category,
        description,
        coverUrl: out.coverUrl || coverUrl,
        logoUrl: out.logoUrl || logoUrl,
      });

      // Store slug for header menu update
      const finalSlug = (out.slug || slug).trim().toLowerCase();
      try {
        sessionStorage.setItem("fm:community:my-slug", finalSlug);
        window.dispatchEvent(new Event("fm:community-refresh"));
      } catch {
        /* ignore */
      }

      if (isCreating) {
        // Show success animation, then tutorial modal
        setShowSuccessAnimation(true);
        // Don't navigate immediately if showing animation
        if (!redirectAfterCreate) {
          setCover(null);
          setLogo(null);
          setTouched(false);
        }
      } else {
        // Update flow - show toast
        setToastKind("success");
        setToastMsg("Modifications enregistrées.");
        setToastOpen(true);
        setCover(null);
        setLogo(null);
        setTouched(false);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setServerError(
        createdOnce
          ? "Mise à jour impossible. Réessaie."
          : "Création impossible. Réessaie."
      );
      setToastKind("error");
      setToastMsg(
        msg.includes("NAME_TAKEN")
          ? "Nom indisponible."
          : msg.includes("SLUG_TAKEN")
          ? "Slug indisponible."
          : createdOnce
          ? "Échec de la mise à jour."
          : "Échec de la création."
      );
      setToastOpen(true);
    } finally {
      setServerSubmitting(false);
    }
  }

  const handleSuccessAnimationComplete = () => {
    setShowSuccessAnimation(false);
    setShowTutorialModal(true);
  };

  const handleTutorialModalClose = () => {
    setShowTutorialModal(false);
    // Navigate after closing modal if redirectAfterCreate is true
    if (redirectAfterCreate && slug) {
      const finalSlug = slug.trim().toLowerCase();
      navigate(`/communaute/${finalSlug}`, { replace: true });
    }
  };

  const handleCopySlug = async () => {
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/communaute/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopiedSlug(true);
      setToastKind("success");
      setToastMsg("Lien de la communauté copié.");
      setToastOpen(true);
      setTimeout(() => setCopiedSlug(false), 2000);
    } catch {
      /* ignore */
    }
  };

  // 👉 n’ouvre le lightbox que s’il y a une vraie image
  const openLightbox = (i: number) => {
    if (i === 0 && !hasCover) return;
    if (i === 1 && !hasLogo) return;
    setLbIndex(i);
    setLbOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-500">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Chargement…
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* HEADER IMAGES */}
        <div className="relative">
          <div className="rounded-3xl border border-slate-100/70 dark:border-slate-800/60 bg-slate-50/80 dark:bg-slate-900/60 overflow-hidden shadow-lg shadow-slate-200/70 dark:shadow-slate-950/40">
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className={`block w-full ${
                hasCover ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <div className="h-40 sm:h-48 md:h-56 w-full relative">
                <img
                  src={coverPreview}
                  alt="Cover"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 to-slate-900/0 dark:from-slate-900/30 dark:to-slate-900/0 pointer-events-none" />
              </div>
            </button>

            {/* actions cover */}
            <div className="absolute right-4 top-4 z-10 flex gap-2">
              <label
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 ring-1 ring-black/10 shadow cursor-pointer dark:bg-slate-950 dark:text-slate-100"
                title="Changer la couverture"
              >
                <Upload className="h-5 w-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    setTouched(true);
                    setCover(e.target.files?.[0] ?? null);
                  }}
                />
              </label>
              {cover && (
                <button
                  type="button"
                  onClick={() => {
                    setTouched(true);
                    setCover(null);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-black/10 shadow dark:bg-slate-950 dark:text-slate-100"
                  title="Retirer la couverture"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* LOGO FLOTTANT */}
          <div className="absolute left-6 bottom-[-3.1rem] sm:bottom-[-3.4rem] z-20">
            <div className="relative">
              <button
                type="button"
                onClick={() => openLightbox(1)}
                className={`h-20 w-20 sm:h-24 sm:w-24 rounded-full ring-4 ring-white dark:ring-slate-900/80 overflow-hidden shadow-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center ${
                  hasLogo ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
              </button>
              <label
                className="absolute -right-2 -bottom-2 h-9 w-9 sm:h-10 sm:w-10 inline-flex items-center justify-center rounded-full bg-white/95 text-slate-900 ring-1 ring-black/10 shadow-lg cursor-pointer dark:bg-white dark:text-slate-900"
                title="Changer le logo"
              >
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    setTouched(true);
                    setLogo(e.target.files?.[0] ?? null);
                  }}
                />
              </label>
              {logo && (
                <button
                  type="button"
                  onClick={() => {
                    setTouched(true);
                    setLogo(null);
                  }}
                  className="absolute -right-2 -top-2 h-8 w-8 inline-flex items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-black/10 shadow dark:bg-slate-950 dark:text-slate-100"
                  title="Retirer le logo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FORMULAIRE PRINCIPAL */}
        <div className="mt-20 sm:mt-20 rounded-3xl bg-white/90 dark:bg-slate-900/40 border border-slate-100/70 dark:border-slate-800/60 p-4 sm:p-6 space-y-6">
          {/* identité */}
          <div className="space-y-4 mt-10">
            <div className="grid gap-5 lg:grid-cols-2">
              {/* nom */}
              <div className="lg:col-span-2">
                <label className="text-sm sm:text-[15px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  Nom de la communauté <span className="text-red-500">*</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    (min. {MIN_NAME_CHARS} caractères)
                  </span>
                </label>
                <input
                  value={name}
                  onChange={(e) => {
                    setTouched(true);
                    setName(e.target.value);
                  }}
                  placeholder="Ex: FULLMARGIN TRADERS"
                  className={`mt-2 w-full rounded-lg border bg-white dark:bg-slate-900/40 px-3.5 py-2.5 text-sm sm:text-[15px] outline-none focus:ring-2
                    ${
                      !nameOkLocal
                        ? "border-red-500/60 focus:ring-red-200/40"
                        : nameOk === false
                        ? "border-red-500/60 focus:ring-red-200/40"
                        : "border-slate-200/80 dark:border-slate-800 focus:ring-violet-200/40"
                    } text-slate-900 dark:text-slate-100`}
                />
                {!nameOkLocal ? (
                  <p className="mt-1 text-xs text-red-500">
                    Le nom doit faire au moins {MIN_NAME_CHARS} caractères.
                  </p>
                ) : nameChecking ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Vérification du nom…
                  </p>
                ) : nameOk === true ? (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">
                    Nom disponible.
                  </p>
                ) : nameOk === false ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Ce nom est déjà utilisé.
                  </p>
                ) : null}
              </div>

              {/* slug */}
              <div>
                <label className="text-sm sm:text-[15px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  Identifiant (slug URL)
                  {createdOnce && slug ? (
                    <button
                      type="button"
                      onClick={handleCopySlug}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Copier le lien complet"
                    >
                      {copiedSlug ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copier
                        </>
                      )}
                    </button>
                  ) : null}
                </label>
                <div className="mt-2 flex">
                  <span className="inline-flex items-center rounded-l-lg bg-slate-50 dark:bg-slate-900/60 border border-r-0 border-slate-200/80 dark:border-slate-800 px-2.5 text-xs sm:text-sm text-slate-500 dark:text-slate-300">
                    /communaute/
                  </span>
                  <input
                    value={slug}
                    readOnly
                    className="flex-1 rounded-r-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-3 py-2.5 text-sm sm:text-[15px] text-slate-900 dark:text-slate-100"
                  />
                </div>
                {checking ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Vérification du slug…
                  </p>
                ) : status === "ok" ? (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">
                    {autoAdjusted
                      ? "Slug ajusté automatiquement."
                      : "Slug disponible."}
                  </p>
                ) : status === "error" ? (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
                    Impossible de vérifier le slug maintenant.
                  </p>
                ) : null}
              </div>

              {/* catégorie */}
              <div>
                <label className="text-sm sm:text-[15px] font-medium text-slate-700 dark:text-slate-200">
                  Catégorie
                </label>
                <div className="mt-2">
                  <CategorySelect
                    value={category}
                    onChange={(val) => {
                      setTouched(true);
                      setCategory(val);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* paramètres */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                Paramètres
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200 px-2.5 py-0.5 text-[11px] uppercase tracking-wide">
                visibilité modifiable
              </span>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* visibilité */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900 dark:text-slate-200 flex items-center gap-1">
                  Statut de visibilité <span className="text-red-500">*</span>
                </label>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                  Choisis si ta communauté est visible par tous ou restreinte
                  aux membres.
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTouched(true);
                      setVisibility("public");
                    }}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm ring-1 transition
                      focus:outline-none
                      ${
                        visibility === "public"
                          ? "bg-violet-600 text-white ring-violet-700 hover:bg-violet-600 active:bg-violet-700"
                          : "bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-200 ring-black/10 dark:ring-white/10 hover:bg-white/80 dark:hover:bg-slate-900/60"
                      }`}
                  >
                    <Eye className="h-4 w-4" /> Publique
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTouched(true);
                      setVisibility("private");
                    }}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm ring-1 transition
                      focus:outline-none
                      ${
                        visibility === "private"
                          ? "bg-violet-600 text-white ring-violet-700 hover:bg-violet-600 active:bg-violet-700"
                          : "bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-200 ring-black/10 dark:ring-white/10 hover:bg-white/80 dark:hover:bg-slate-900/60"
                      }`}
                  >
                    <Lock className="h-4 w-4" /> Privée
                  </button>
                </div>
              </div>

              {/* description */}
              <div className="lg:col-span-2">
                <label className="text-sm sm:text-[15px] font-medium text-slate-900 dark:text-slate-200 flex items-center gap-2">
                  Description <span className="text-red-500">*</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    (min. {MIN_DESCRIPTION_CHARS} caractères)
                  </span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setTouched(true);
                    setDescription(e.target.value);
                  }}
                  rows={4}
                  placeholder="Présente clairement la communauté, sa méthode, ses règles, etc."
                  className="mt-2 w-full rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-3 py-2.5 text-sm sm:text-[15px] outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300/20 text-slate-900 dark:text-slate-100"
                />

                <div className="mt-1 flex items-center justify-between">
                  {!descOkLocal ? (
                    <p className="text-xs text-red-500">
                      Il manque {MIN_DESCRIPTION_CHARS - descLen} caractère
                      {MIN_DESCRIPTION_CHARS - descLen > 1 ? "s" : ""} dans la
                      description.
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-500">
                      Description suffisante.
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    {descLen}/{MIN_DESCRIPTION_CHARS}
                  </p>
                </div>

                {(!descOkLocal || !hasCover || !hasLogo) && (
                  <div className="mt-3 w-full rounded-lg bg-red-50 dark:bg-red-500/10 px-3.5 py-2.5 space-y-1 text-sm text-red-700 dark:text-red-200">
                    {!descOkLocal && (
                      <p>
                        La description doit faire au moins{" "}
                        {MIN_DESCRIPTION_CHARS} caractères.
                      </p>
                    )}
                    {!hasCover && (
                      <p>Une image de couverture est obligatoire.</p>
                    )}
                    {!hasLogo && (
                      <p>Un logo / photo de profil est obligatoire.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="submit"
              aria-busy={serverSubmitting}
              disabled={!canSubmitLocal || serverSubmitting}
              className={`inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl text-sm sm:text-[15px] font-semibold transition
                ${
                  canSubmitLocal && !serverSubmitting
                    ? "bg-violet-600 text-white hover:bg-violet-700"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                }`}
            >
              {serverSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {createdOnce ? "Mettre à jour" : "Créer la communauté"}
            </button>

            {/* Help button - only show if community exists */}
            {createdOnce && (
              <button
                type="button"
                onClick={() => setShowTutorialModal(true)}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-violet-200/60 dark:border-violet-700/40 text-sm font-medium text-violet-600 dark:text-violet-300 bg-violet-50/40 dark:bg-violet-900/20 hover:bg-violet-100/60 dark:hover:bg-violet-900/30 transition-colors"
                title="Revoir le tutoriel"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Comment ça marche
              </button>
            )}

            {createdOnce && (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-slate-200/60 dark:border-slate-700/40 text-sm font-medium text-slate-400 dark:text-slate-500 bg-slate-100/40 dark:bg-slate-800/20 cursor-not-allowed"
                title="Suppression désactivée pour le moment"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer la communauté
              </button>
            )}

            {serverError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {serverError}
              </p>
            )}
          </div>
        </div>
      </form>

      <Toast
        open={toastOpen}
        kind={toastKind}
        message={toastMsg}
        onClose={() => setToastOpen(false)}
      />
      <ImageLightbox
        open={lbOpen}
        images={lbImages}
        startAt={lbIndex}
        onClose={() => setLbOpen(false)}
      />

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
