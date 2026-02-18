// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\ProductPreview.tsx
import type React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getPreviewProduct,
  publicShopUrl,
  type PublicProductFull,
  type Pricing,
} from "../lib/publicShopApi";
import {
  BadgeCheck,
  CheckCircle2,
  Share2,
  Store,
  Tag,
  Layers,
} from "lucide-react";

import BottomActionBar from "./components/ui/BottomActionBar";
import MediaViewer from "./components/media/MediaViewer";
import ReviewsPanel from "./components/reviews/ReviewsPanel";
import PromoCodeBox from "./components/PromoCodeBox";

import CategoryDrawer from "./CategoryDrawer";
import type { CategoryKey } from "./types";

import { useCartCount } from "../lib/cart";
import { useWishlistCount } from "../lib/wishlist";

import AddToCartCTA from "./ProductPreview/composants/actions/AddToCartCTA";
import BuyNowCTA from "./ProductPreview/composants/actions/BuyNowCTA";
import WishlistCTA from "./ProductPreview/composants/actions/WishlistCTA";

import { loadSession } from "../../../auth/lib/storage";
import {
  grantCheckoutGate,
  setCheckoutIntent,
} from "../../../router/checkoutGate";
import { API_BASE } from "../../../lib/api";

// 🔹 Viewer BlockNote réutilisé pour les descriptions
import { RichTextBN } from "../../course/CoursePlayer/RichTextBN";

// ✅ modularisé

import {
  formatPrice,
  money,
  labelType,
  getYouTubeEmbedUrl,
  openAuth,
} from "./ProductPreview/utils";
import StatusChip from "./components/StatusChip";
import { LockedFileCard, UnlockedFileLinkCard } from "./components/FileCards";
import DescriptionModal from "./components/DescriptionModal";

/* ----------------------- Page ----------------------- */
export default function ProductPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();

  const [data, setData] = useState<PublicProductFull | null>(null);
  const [loading, setLoading] = useState(true);

  const [owned, setOwned] = useState(false);
  const [ownershipLoading, setOwnershipLoading] = useState(false);

  const [isOwner, setIsOwner] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [category, setCategory] = useState<CategoryKey>("produits");
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const onSelectCategory = useCallback((key: CategoryKey) => {
    setCategory(key);
    setDrawerOpen(false);
  }, []);

  // 🆕 modal description
  const [descModalOpen, setDescModalOpen] = useState(false);

  // 🆕 état pour le feedback "Lien copié"
  const [copied, setCopied] = useState(false);

  // 🆕 URL publique du produit (ici on prend simplement l'URL actuelle)
  const productShareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href.split("#")[0];
  }, []);

  // 🆕 prix effectif après promo
  const [effectivePricing, setEffectivePricing] = useState<Pricing | null>(
    null,
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        if (!id) return;
        const p = await getPreviewProduct(id);
        if (alive) setData(p);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // reset du prix effectif quand le produit change
  useEffect(() => {
    setEffectivePricing(null);
  }, [data?.id, data?.pricing?.amount, data?.pricing?.mode]);

  // Vérifie la possession (commandes)
  useEffect(() => {
    let alive = true;
    (async () => {
      const token = loadSession()?.token;
      if (!token || !data?.id) {
        if (alive) setOwned(false);
        return;
      }
      try {
        setOwnershipLoading(true);
        const r = await fetch(
          `${API_BASE}/marketplace/profile/orders?scope=purchases`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
        );
        if (!r.ok) throw new Error("Ownership check failed");
        const j: {
          data?: {
            items?: Array<{
              status: string;
              items?: Array<{ product: string }>;
            }>;
          };
        } = await r.json();
        const list = j?.data?.items ?? [];
        const has = list.some(
          (o) =>
            (o.status === "succeeded" || o.status === "processing") &&
            (o.items ?? []).some(
              (it) => String(it.product) === String(data.id),
            ),
        );
        if (alive) setOwned(has);
      } catch {
        if (alive) setOwned(false);
      } finally {
        if (alive) setOwnershipLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [data?.id]);

  // Vérifie si l’utilisateur est le propriétaire du produit
  useEffect(() => {
    let alive = true;
    (async () => {
      const token = loadSession()?.token;
      if (!token || !data?.id) {
        if (alive) setIsOwner(false);
        return;
      }
      try {
        const r = await fetch(`${API_BASE}/marketplace/shops/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (r.ok) {
          const j: {
            data?: { shop?: { id?: string; _id?: string; slug?: string } };
          } = await r.json();
          const myId = String(j?.data?.shop?.id ?? j?.data?.shop?._id ?? "");
          const mySlug = String(j?.data?.shop?.slug ?? "");
          const prodShopId = String(data?.shop?.id ?? "");
          const prodSlug = String(data?.shop?.slug ?? "");
          if (
            (myId && prodShopId && myId === prodShopId) ||
            (mySlug && prodSlug && mySlug === prodSlug)
          ) {
            if (alive) setIsOwner(true);
            return;
          }
        }
        const r2 = await fetch(`${API_BASE}/marketplace/products/${data.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (alive) setIsOwner(r2.ok);
      } catch {
        if (alive) setIsOwner(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [data?.id, data?.shop?.id, data?.shop?.slug]);

  const images = useMemo<string[]>(
    () =>
      data?.images?.length
        ? data.images
        : data?.imageUrl
          ? [data.imageUrl]
          : [],
    [data?.images, data?.imageUrl],
  );

  // 🆕 vidéos associées au produit (YouTube, etc.)
  const videoUrls = useMemo<string[]>(
    () => (data?.videoUrls && data.videoUrls.length ? data.videoUrls : []),
    [data?.videoUrls],
  );

  // Acheter maintenant
  const navigateCheckout = useCallback(async () => {
    if (!data) return;
    const isLoggedIn = !!loadSession()?.token;
    if (!isLoggedIn) {
      openAuth("signin");
      return;
    }
    setCheckoutIntent([{ id: data.id, qty: 1 }]);
    grantCheckoutGate();
    navigate("/marketplace/checkout");
  }, [data, navigate]);

  // 🆕 handler pour partager / copier le lien
  const handleShare = useCallback(async () => {
    if (!productShareUrl) return;

    try {
      // d'abord, on tente le partage natif si dispo
      if (
        typeof navigator !== "undefined" &&
        (navigator as any).share &&
        data?.title
      ) {
        await (navigator as any).share({
          title: data.title,
          text: "Découvre ce produit sur FullMargin Marketplace",
          url: productShareUrl,
        });
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
        return;
      }

      // sinon fallback: copier dans le presse-papiers
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(productShareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = productShareUrl;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [productShareUrl, data?.title]);

  /* ---------- Rendu ---------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl p-6 lg:p-8 pb-32">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2">
          {/* Left Col (Image) */}
          <div className="aspect-[4/3] rounded-3xl animate-pulse bg-neutral-200/70 dark:bg-neutral-800/40" />

          {/* Right Col (Content) */}
          <div className="space-y-6">
            <div className="h-4 w-20 rounded animate-pulse bg-neutral-200/70 dark:bg-neutral-800/40" />
            <div className="h-10 w-3/4 rounded-xl animate-pulse bg-neutral-200/70 dark:bg-neutral-800/40" />
            <div className="h-6 w-1/3 rounded animate-pulse bg-neutral-200/70 dark:bg-neutral-800/40" />
            <div className="h-40 rounded-2xl animate-pulse bg-neutral-200/70 dark:bg-neutral-800/40" />
            <div className="h-14 rounded-2xl animate-pulse bg-neutral-200/70 dark:bg-neutral-800/40" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center pt-20">
        <div className="inline-flex size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
          <Layers className="size-8 text-neutral-400" />
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-br from-neutral-800 to-neutral-500 dark:from-neutral-200 dark:to-neutral-500 bg-clip-text text-transparent">
          Produit introuvable
        </h2>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          Ce produit n'existe pas ou a été retiré de la vente.
        </p>
        <button
          onClick={() => navigate("/marketplace")}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-neutral-900 px-6 font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
        >
          Retour au catalogue
        </button>
      </div>
    );
  }

  const displayedPricing = effectivePricing ?? data.pricing;
  const isFree = displayedPricing?.amount === 0;

  const shopHref = data.shop?.slug
    ? publicShopUrl(data.shop.slug)
    : data.shop?.id
      ? publicShopUrl(data.shop.id)
      : undefined;

  // Contenu réutilisable pour le modal + l’aperçu
  const shortContent: React.ReactNode =
    data.shortDescriptionJson && data.shortDescriptionJson.length ? (
      <RichTextBN json={JSON.stringify(data.shortDescriptionJson)} />
    ) : data.shortDescription ? (
      <p>{data.shortDescription}</p>
    ) : null;

  const longContent: React.ReactNode =
    data.longDescriptionJson && data.longDescriptionJson.length ? (
      <RichTextBN json={JSON.stringify(data.longDescriptionJson)} />
    ) : data.longDescription ? (
      <p>{data.longDescription}</p>
    ) : null;

  return (
    <div className="bg-neutral-50/50 dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-32">
        {/*
          GRID LAYOUT:
          - Mobile: Stacked
          - Desktop (lg): 2 colonnes (55% image / 45% sticky content)
        */}
        <div className="lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:items-start">
          {/* GAUCHE: Images + Description (Desktop only) + Reviews */}
          <div className="space-y-10 min-w-0">
            {/* Gallery */}
            <div className="rounded-3xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5 bg-white dark:bg-neutral-900 shadow-sm">
              <MediaViewer
                images={images}
                title={data.title}
                badgeEligible={data.badgeEligible}
                className="w-full aspect-[4/3] object-cover"
              />
            </div>

            {/* Description (visible on mobile, but conceptually grouped here) */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  À propos du produit
                </h3>
              </div>

              {shortContent && (
                <div className="text-neutral-600 dark:text-neutral-300 leading-relaxed overflow-hidden">
                  {shortContent}
                </div>
              )}

              {longContent && (
                <div className="relative group">
                  <div
                    className={`relative overflow-hidden transition-all duration-500 ${
                      descModalOpen ? "max-h-none" : "max-h-[300px]"
                    }`}
                  >
                    <div className="text-neutral-600 dark:text-neutral-300">
                      {longContent}
                    </div>
                    {!descModalOpen && (
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-neutral-50 dark:from-[#0a0a0a] to-transparent flex items-end justify-center pb-2">
                        <button
                          onClick={() => setDescModalOpen(true)}
                          className="px-4 py-2 bg-white/80 dark:bg-neutral-800/80 backdrop-blur rounded-full text-sm font-medium shadow-sm hover:bg-white dark:hover:bg-neutral-700 transition ring-1 ring-black/5 dark:ring-white/10"
                        >
                          Lire la suite
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Vidéos */}
            {videoUrls.length > 0 && (
              <section className="space-y-4 pt-6 border-t border-black/5 dark:border-white/5">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  Vidéos
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {videoUrls.map((url, idx) => {
                    const embed = getYouTubeEmbedUrl(url);
                    return embed ? (
                      <div
                        key={idx}
                        className="relative w-full overflow-hidden rounded-2xl aspect-video bg-black shadow-sm ring-1 ring-white/10"
                      >
                        <iframe
                          src={embed}
                          title={`Vidéo ${idx + 1}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-neutral-900 ring-1 ring-black/5 dark:ring-white/10 hover:ring-violet-500/30 transition shadow-sm"
                      >
                        <span className="truncate text-sm font-medium text-neutral-700 dark:text-neutral-300 max-w-[80%]">
                          {url}
                        </span>
                        <div className="size-8 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                          <Layers className="size-4" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Avis */}
            <div className="pt-6 border-t border-black/5 dark:border-white/5">
              <ReviewsPanel productId={data.id} />
            </div>
          </div>

          {/* DROITE: Sticky Info Panel */}
          <div className="mt-8 lg:mt-0 lg:sticky lg:top-24 space-y-8">
            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-6 shadow-xl shadow-neutral-200/50 dark:shadow-none ring-1 ring-black/5 dark:ring-white/5">
              {/* Header Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {data.badgeEligible && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Certifié
                      </span>
                    )}
                    <StatusChip status={data.status} />
                  </div>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    title={copied ? "Lien copié !" : "Partager"}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
                  {data.title}
                </h1>

                {/* Meta list */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <Store className="w-4 h-4 shrink-0" />
                    <span>Vendu par</span>
                    {data.shop?.name ? (
                      shopHref ? (
                        <Link
                          to={shopHref}
                          className="font-medium text-neutral-900 dark:text-neutral-200 underline decoration-neutral-300 dark:decoration-neutral-600 underline-offset-4 hover:decoration-violet-500 transition"
                        >
                          {data.shop.name}
                        </Link>
                      ) : (
                        <span className="font-medium text-neutral-900 dark:text-neutral-200">
                          {data.shop.name}
                        </span>
                      )
                    ) : (
                      <span>Inconnu</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <Tag className="w-4 h-4 shrink-0" />
                    <span>
                      {labelType(data.type)}
                      {data.category && ` • ${data.category}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="my-6 border-t border-dashed border-neutral-200 dark:border-neutral-800" />

              {(data.fileName || data.fileMime || data.fileUrl) && (
                <div className="mb-6">
                  {owned ? (
                    <UnlockedFileLinkCard
                      to="/marketplace/dashboard?tab=orders&subtab=downloads"
                      fileName={data.fileName}
                      fileMime={data.fileMime}
                    />
                  ) : (
                    <LockedFileCard
                      fileName={data.fileName}
                      fileMime={data.fileMime}
                    />
                  )}
                </div>
              )}

              {/* Price & Cart Actions */}
              <div className="space-y-5">
                <div className="flex items-baseline gap-2">
                  {isFree ? (
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      Gratuit
                    </span>
                  ) : (
                    <span className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                      {formatPrice(displayedPricing)}
                    </span>
                  )}
                  {!isFree && effectivePricing && (
                    <span className="text-sm line-through text-neutral-400">
                      {formatPrice(data.pricing)}
                    </span>
                  )}
                </div>

                {!isFree && (
                  <PromoCodeBox
                    productId={data.id}
                    pricing={data.pricing}
                    money={money}
                    onApplied={(res) => {
                      setEffectivePricing(res.final);
                      if (typeof sessionStorage !== "undefined" && res?.code) {
                        sessionStorage.setItem(
                          `fm:promo:${data.id}`,
                          String(res.code).toUpperCase(),
                        );
                      }
                    }}
                    onCleared={() => {
                      setEffectivePricing(null);
                      if (typeof sessionStorage !== "undefined") {
                        sessionStorage.removeItem(`fm:promo:${data.id}`);
                      }
                    }}
                  />
                )}

                {/* Actions Panel */}
                <div className="pt-2 space-y-3">
                  {owned ? (
                    <div className="flex items-start gap-3 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl ring-1 ring-emerald-100 dark:ring-emerald-900/30">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                          Vous possédez ce produit
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-400/80">
                          Retrouvez vos fichiers dans{" "}
                          <Link
                            to="/marketplace/dashboard?tab=orders&subtab=downloads"
                            className="underline underline-offset-2 hover:text-emerald-900 dark:hover:text-emerald-200"
                          >
                            vos téléchargements
                          </Link>
                          .
                        </p>
                      </div>
                    </div>
                  ) : isOwner ? (
                    <div className="flex items-center gap-3 p-4 bg-sky-50 dark:bg-sky-900/10 rounded-2xl ring-1 ring-sky-100 dark:ring-sky-900/30 text-sky-700 dark:text-sky-300">
                      <BadgeCheck className="w-5 h-5 shrink-0" />
                      <p className="text-sm font-medium">
                        Ceci est votre produit. Vous ne pouvez pas l'acheter.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <BuyNowCTA onClick={navigateCheckout} />
                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <AddToCartCTA productId={data.id} />
                        <WishlistCTA productId={data.id} />
                      </div>
                      <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 pt-2">
                        Paiement sécurisé · Accès immédiat
                      </p>
                    </div>
                  )}

                  {ownershipLoading && (
                    <div className="text-center text-xs text-neutral-400 animate-pulse">
                      Vérification de l’accès...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomActionBar
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onWishlist={() => navigate("/marketplace/dashboard?tab=wishlist")}
        onCart={() => navigate("/marketplace/dashboard?tab=cart")}
        onExplore={openDrawer}
      />

      <CategoryDrawer
        id="market-categories-drawer"
        open={drawerOpen}
        onClose={closeDrawer}
        onSelect={onSelectCategory}
        selected={category}
      />

      <DescriptionModal
        open={descModalOpen}
        onClose={() => setDescModalOpen(false)}
        title={data.title}
        short={shortContent}
        long={longContent}
      />
    </div>
  );
}

