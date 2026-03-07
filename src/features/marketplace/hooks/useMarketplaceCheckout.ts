// src/pages/marketplace/hooks/useMarketplaceCheckout.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";

import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";
import { useCartItems } from "@features/marketplace/lib/cart";
import {
  getCheckoutIntent,
  setCheckoutIntent,
  clearCheckoutIntent,
  grantCheckoutGate,
  revokeCheckoutGate,
} from "@core/router/checkoutGate";
import type { FeexPayConfig } from "@shared/components/payment/PaymentMethodModal";

/* ---------- Types locaux ---------- */
export type PublicPricing =
  | { mode: "one_time"; amount: number }
  | { mode: "subscription"; amount: number; interval: "month" | "year" };

export type PublicProductLite = {
  id: string;
  title: string;
  imageUrl?: string;
  pricing?: PublicPricing;

  // backend peut envoyer shop sous plusieurs formes
  shop?: unknown;
  shopId?: unknown;

  // fallback owner
  user?: unknown;
  owner?: unknown;
  ownerId?: unknown;
};

export type CartLine = { product: PublicProductLite; qty: number };
export type PromoMap = Map<string, string>;

export type PaymentLoadingMethod = "card" | "feexpay" | "crypto" | null;

export const fmtMoney = (n = 0, currency = "USD") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(n);

type CheckoutItemBase = { id: string; qty: number };
type CheckoutItemPayload = { id: string; qty: number; promoCode?: string };

type SessionUserLite = {
  email?: string;
  firstName?: string;
  lastName?: string;
};

type AppSessionLite = {
  token?: string;
  email?: string;
  user?: SessionUserLite;
};

type JsonRecord = Record<string, unknown>;

function isRecord(v: unknown): v is JsonRecord {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function getRecord(v: unknown): JsonRecord | null {
  return isRecord(v) ? v : null;
}

function getProp(obj: unknown, key: string): unknown {
  const r = getRecord(obj);
  return r ? r[key] : undefined;
}

function getStringProp(obj: unknown, key: string): string | undefined {
  const v = getProp(obj, key);
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function normalizeId(v: unknown): string {
  return String(v || "")
    .trim()
    .toLowerCase();
}

function extractBackendMessage(parsed: unknown, fallback: string): string {
  if (!isRecord(parsed)) return fallback;
  const msg =
    getStringProp(parsed, "message") ||
    getStringProp(parsed, "error") ||
    (isRecord(parsed.data)
      ? getStringProp(parsed.data, "message")
      : undefined) ||
    (isRecord(parsed.data) ? getStringProp(parsed.data, "error") : undefined);
  return msg || fallback;
}

function looksLikeSelfBuyMessage(msg: string): boolean {
  const m = (msg || "").toLowerCase();
  return (
    /self\s*-?\s*buy/.test(m) ||
    /own(ed)?/.test(m) ||
    /owner/.test(m) ||
    /author/.test(m) ||
    /auteur/.test(m) ||
    /propri(é|e)taire/.test(m) ||
    /votre\s+propre\s+produit/.test(m)
  );
}

const openAuth = (mode: "signin" | "signup" = "signin") =>
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } }),
  );

/* ---------- Config CRYPTO (shop ids autorisés) ---------- */
const DEFAULT_CRYPTO_SHOP_IDS = [
  "68f971180f9dc84da9c71591",
  "690c5b12a0a8e5278e8915a4",
];

const DEFAULT_CRYPTO_OWNER_IDS: string[] = [];

type ImportMetaEnvLike = {
  VITE_STRIPE_PUBLISHABLE_KEY?: string;
  VITE_CRYPTO_SHOP_IDS?: string;
  VITE_CRYPTO_OWNER_IDS?: string;
};
type ImportMetaLike = { env?: ImportMetaEnvLike };
type GlobalWithStripePK = { __STRIPE_PK__?: string };

function envCsv(key: keyof ImportMetaEnvLike): string[] {
  const raw = (import.meta as unknown as ImportMetaLike).env?.[key] || "";
  return raw
    .split(",")
    .map((x) => normalizeId(x))
    .filter(Boolean);
}

/* ---------- Stripe key ---------- */
function resolveStripePk(): string {
  const fromVite = (import.meta as unknown as ImportMetaLike).env
    ?.VITE_STRIPE_PUBLISHABLE_KEY;
  const fromGlobal = (globalThis as unknown as GlobalWithStripePK)
    .__STRIPE_PK__;
  return fromVite || fromGlobal || "pk_test_12345";
}

const STRIPE_PK = resolveStripePk();
const stripePromise = loadStripe(STRIPE_PK);

/* ---------- Helpers promos côté client ---------- */
function getPromoCodeForProduct(productId: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  const k = `fm:promo:${productId}`;
  const v = sessionStorage.getItem(k);
  return (v || "").trim() ? String(v).trim().toUpperCase() : null;
}

function normalizeQty(qty: unknown): number {
  const n = Number(qty);
  return Number.isFinite(n) ? Math.max(1, n) : 1;
}

function normalizeItems(
  items: readonly CheckoutItemBase[],
): CheckoutItemPayload[] {
  return items
    .map((x) => {
      const id = String(x.id || "").trim();
      const qty = normalizeQty(x.qty);
      const promoCode = id ? getPromoCodeForProduct(id) : null;
      if (!id) return null;
      return promoCode ? { id, qty, promoCode } : { id, qty };
    })
    .filter((x): x is CheckoutItemPayload => !!x);
}

/* ---------- Extraction shop/owner robuste (sans any) ---------- */
function extractShopOwnerIds(p: PublicProductLite): {
  shopId: string;
  ownerId: string;
} {
  const shopCandidate: unknown =
    p.shop ?? p.shopId ?? getProp(p, "shop_id") ?? getProp(p, "shopId");

  let shopId = "";
  let ownerId = "";

  if (typeof shopCandidate === "string") {
    shopId = normalizeId(shopCandidate);
  }

  if (!shopId && isRecord(shopCandidate)) {
    const sid =
      getProp(shopCandidate, "_id") ??
      getProp(shopCandidate, "id") ??
      getProp(shopCandidate, "shopId") ??
      getProp(shopCandidate, "shop_id");

    if (typeof sid === "string") shopId = normalizeId(sid);

    const ownerCandidate =
      getProp(shopCandidate, "user") ??
      getProp(shopCandidate, "owner") ??
      getProp(shopCandidate, "ownerId") ??
      getProp(shopCandidate, "userId");

    if (typeof ownerCandidate === "string") {
      ownerId = normalizeId(ownerCandidate);
    } else if (isRecord(ownerCandidate)) {
      const uid =
        getProp(ownerCandidate, "_id") ?? getProp(ownerCandidate, "id");
      if (typeof uid === "string") ownerId = normalizeId(uid);
    }
  }

  if (!shopId) {
    const explicit =
      p.shopId ?? getProp(p, "shop_id") ?? getProp(p, "shopId") ?? undefined;
    if (typeof explicit === "string") shopId = normalizeId(explicit);
  }

  if (!ownerId) {
    const ownerFallback: unknown =
      p.user ??
      p.owner ??
      p.ownerId ??
      getProp(p, "userId") ??
      getProp(p, "owner_id") ??
      undefined;

    if (typeof ownerFallback === "string") {
      ownerId = normalizeId(ownerFallback);
    } else if (isRecord(ownerFallback)) {
      const uid = getProp(ownerFallback, "_id") ?? getProp(ownerFallback, "id");
      if (typeof uid === "string") ownerId = normalizeId(uid);
    }
  }

  return { shopId, ownerId };
}

export function useMarketplaceCheckout() {
  const navigate = useNavigate();
  const location = useLocation();

  const session = (loadSession?.() ?? null) as AppSessionLite | null;
  const token: string | null = session?.token ?? null;

  const isLoggedIn = !!token;

  const rawCart = useCartItems() as CheckoutItemBase[];

  const { isRenewCheckout, renewProductId } = useMemo(() => {
    const sp = new URLSearchParams(location.search || "");
    const renew = sp.get("renew") === "1";
    const pid = (sp.get("product") || "").trim();
    return { isRenewCheckout: renew, renewProductId: pid || "" };
  }, [location.search]);

  const renewIntent = useMemo(() => {
    if (!isRenewCheckout || !renewProductId) return null;
    return {
      mode: "buy_now" as const,
      items: [{ id: renewProductId, qty: 1 }],
    };
  }, [isRenewCheckout, renewProductId]);

  const storedIntent = getCheckoutIntent();
  const intent = renewIntent || storedIntent;

  useEffect(() => {
    if (!renewIntent) return;
    clearCheckoutIntent();
    setCheckoutIntent(renewIntent.items);
    grantCheckoutGate();
  }, [renewProductId, isRenewCheckout, renewIntent]);

  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [firstLoadDone, setFirstLoadDone] = useState<boolean>(false);
  const [placing, setPlacing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // ✅ ETAT POUR STOCKER LA COMMANDE FEEXPAY EN COURS
  const [pendingFeexPayOrderId, setPendingFeexPayOrderId] = useState<
    string | null
  >(null);

  const prevSigRef = useRef<string>("");
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [ownedTitles, setOwnedTitles] = useState<string[]>([]);

  const [stripeReady, setStripeReady] = useState(false);
  useEffect(() => {
    let alive = true;
    stripePromise.then(() => alive && setStripeReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoadingMethod, setPaymentLoadingMethod] =
    useState<PaymentLoadingMethod>(null);

  const openPaymentModal = () => setPaymentModalOpen(true);
  const closePaymentModal = () => {
    if (!placing) setPaymentModalOpen(false);
  };

  const idsParam = useMemo(() => {
    const src = intent ? intent.items : rawCart;
    return src
      .map((it) => String(it.id))
      .sort()
      .join(",");
  }, [intent, rawCart]);

  const qtySig = useMemo(() => {
    const src = intent ? intent.items : rawCart;
    return src
      .map((it) => `${String(it.id)}:${normalizeQty(it.qty)}`)
      .sort()
      .join("|");
  }, [intent, rawCart]);

  useEffect(() => {
    const sig = `${idsParam}|${qtySig}`;
    if (sig === prevSigRef.current && firstLoadDone) return;
    prevSigRef.current = sig;

    let alive = true;

    if (!idsParam) {
      setLines([]);
      setLoading(false);
      setOwnedIds(new Set());
      setOwnedTitles([]);
      setFirstLoadDone(true);
      return () => {
        alive = false;
      };
    }

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${API_BASE}/marketplace/public/products?ids=${encodeURIComponent(
            idsParam,
          )}`,
          { cache: "no-store" },
        );
        if (!alive) return;

        if (!res.ok) {
          setError("Impossible de charger les produits");
          setLoading(false);
          setFirstLoadDone(true);
          return;
        }

        const json = (await res.json()) as {
          data?: { items?: PublicProductLite[] };
        };
        if (!alive) return;

        const products = (json?.data?.items ?? []) as PublicProductLite[];

        const src = intent ? intent.items : rawCart;
        const qtyMap = new Map(
          src.map((i) => [String(i.id), normalizeQty(i.qty)]),
        );

        const merged: CartLine[] = products
          .map((p) => ({
            product: p,
            qty: Math.max(1, Number(qtyMap.get(p.id) || 1)),
          }))
          .filter((l) => l.qty > 0);

        setLines(merged);
      } catch {
        setError("Erreur réseau lors du chargement des produits");
      } finally {
        if (alive) {
          setLoading(false);
          setFirstLoadDone(true);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [idsParam, qtySig, intent, rawCart, firstLoadDone]);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!isLoggedIn || lines.length === 0) {
        if (!alive) return;
        setOwnedIds(new Set());
        setOwnedTitles([]);
        return;
      }

      if (!token) return;

      const checks = await Promise.allSettled(
        lines.map(async ({ product }) => {
          const r = await fetch(
            `${API_BASE}/marketplace/profile/products/${encodeURIComponent(
              product.id,
            )}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          return { id: product.id, isMine: r.ok, title: product.title };
        }),
      );

      if (!alive) return;

      const mine = checks
        .filter(
          (
            x,
          ): x is PromiseFulfilledResult<{
            id: string;
            isMine: boolean;
            title: string;
          }> => x.status === "fulfilled",
        )
        .map((x) => x.value)
        .filter((x) => x.isMine);

      setOwnedIds(new Set(mine.map((m) => m.id)));
      setOwnedTitles(mine.map((m) => m.title));
    })();

    return () => {
      alive = false;
    };
  }, [isLoggedIn, lines, token]);

  const promoMap: PromoMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of lines) {
      const code = getPromoCodeForProduct(l.product.id);
      if (code) m.set(l.product.id, code);
    }
    return m;
  }, [lines]);

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (s, l) =>
          s +
          (l.product.pricing?.amount || 0) *
            (Number.isFinite(l.qty) ? l.qty : 1),
        0,
      ),
    [lines],
  );

  const isFreeOrder = subtotal <= 0;
  const hasSelfBuy = ownedIds.size > 0;

  const selfBuyMsg =
    hasSelfBuy && ownedTitles.length
      ? `Impossible d’acheter votre produit car vous en êtes l’auteur : ${ownedTitles.join(
          ", ",
        )}.`
      : hasSelfBuy
        ? "Impossible d’acheter votre produit car vous en êtes l’auteur."
        : "";

  const disabledForPayment = placing || hasSelfBuy;

  const cryptoAllowedShopIds = useMemo(() => {
    const fromEnv = envCsv("VITE_CRYPTO_SHOP_IDS");
    const all = [...DEFAULT_CRYPTO_SHOP_IDS, ...fromEnv]
      .map(normalizeId)
      .filter(Boolean);
    return new Set(all);
  }, []);

  const cryptoAllowedOwnerIds = useMemo(() => {
    const fromEnv = envCsv("VITE_CRYPTO_OWNER_IDS");
    const all = [...DEFAULT_CRYPTO_OWNER_IDS, ...fromEnv]
      .map(normalizeId)
      .filter(Boolean);
    return new Set(all);
  }, []);

  const cryptoEligible = useMemo(() => {
    if (lines.length === 0) return false;

    return lines.every(({ product }) => {
      const { shopId, ownerId } = extractShopOwnerIds(product);
      const okShop = shopId ? cryptoAllowedShopIds.has(shopId) : false;
      const okOwner = ownerId ? cryptoAllowedOwnerIds.has(ownerId) : false;
      return okShop || okOwner;
    });
  }, [lines, cryptoAllowedShopIds, cryptoAllowedOwnerIds]);

  function leaveToCart() {
    clearCheckoutIntent();
    revokeCheckoutGate();
    navigate("/marketplace/dashboard?tab=cart");
  }

  function leaveToShop() {
    clearCheckoutIntent();
    revokeCheckoutGate();
    navigate("/marketplace?cat=produits");
  }

  async function handleFreeOrder() {
    if (placing || !isFreeOrder) return;
    if (hasSelfBuy) {
      setError(
        selfBuyMsg ||
          "Impossible d’acheter votre produit car vous en êtes l’auteur.",
      );
      return;
    }
    if (!token) {
      openAuth("signin");
      return;
    }

    setPlacing(true);
    setError("");

    try {
      const baseItems: readonly CheckoutItemBase[] = intent
        ? intent.items
        : rawCart;
      const items = normalizeItems(baseItems);

      const res = await fetch(`${API_BASE}/payments/checkout/free`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          meta: isRenewCheckout
            ? { renew: true, product: renewProductId }
            : undefined,
        }),
      });

      if (res.status === 401) {
        openAuth("signin");
        return;
      }

      if (!res.ok) {
        const msg =
          (await res.text().catch(() => "")) ||
          "Impossible de valider la commande gratuite";
        setError(msg);
        return;
      }

      clearCheckoutIntent();
      revokeCheckoutGate();
      setPaymentModalOpen(false);
      navigate("/marketplace/dashboard?tab=orders");
    } catch {
      setError("Erreur réseau pendant la validation de la commande gratuite");
    } finally {
      setPlacing(false);
    }
  }

  async function handleStripeCheckout() {
    if (placing || subtotal <= 0) return;
    if (!stripeReady) {
      setError("Carte en initialisation… Réessayez dans quelques secondes.");
      return;
    }
    if (hasSelfBuy) {
      setError(
        selfBuyMsg ||
          "Impossible d’acheter votre produit car vous en êtes l’auteur.",
      );
      return;
    }
    if (!token) {
      openAuth("signin");
      return;
    }

    setPlacing(true);
    setError("");

    try {
      const baseItems: readonly CheckoutItemBase[] = intent
        ? intent.items
        : rawCart;
      const items = normalizeItems(baseItems);

      const res = await fetch(`${API_BASE}/payments/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items,
          meta: isRenewCheckout
            ? { renew: true, product: renewProductId }
            : undefined,
        }),
      });

      if (res.status === 401) {
        openAuth("signin");
        return;
      }

      if (!res.ok) {
        const msg = (await res.text().catch(() => "")) || "Checkout impossible";
        setError(msg);
        return;
      }

      const json = (await res.json()) as {
        ok?: boolean;
        data?: { url?: string };
      };
      const url = json?.data?.url;

      if (!url) {
        setError("URL de paiement manquante");
        return;
      }

      clearCheckoutIntent();
      revokeCheckoutGate();
      window.location.assign(url);
    } catch {
      setError("Erreur réseau pendant l’ouverture du paiement");
    } finally {
      setPlacing(false);
    }
  }

  async function handlePayCard() {
    if (hasSelfBuy || subtotal <= 0) return;
    setPaymentLoadingMethod("card");
    await handleStripeCheckout();
    setPaymentLoadingMethod(null);
  }

  async function handlePayFeexPay(): Promise<FeexPayConfig | void> {
    if (placing || subtotal <= 0) return;
    if (hasSelfBuy) {
      setError(
        selfBuyMsg ||
          "Impossible d’acheter votre produit car vous en êtes l’auteur.",
      );
      return;
    }
    if (!token) {
      openAuth("signin");
      return;
    }

    setPaymentLoadingMethod("feexpay");
    setPlacing(true);
    setError("");

    try {
      const baseItems: readonly CheckoutItemBase[] = intent
        ? intent.items
        : rawCart;
      const items = normalizeItems(baseItems);

      const res = await fetch(`${API_BASE}/payments/checkout/feexpay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      if (res.status === 401) {
        openAuth("signin");
        return;
      }

      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        data?: { orderId?: string; amount?: number };
      };

      if (!res.ok || !json.ok || !json.data?.orderId) {
        throw new Error(
          json.error || json.message || "Impossible d'initialiser Mobile Money",
        );
      }

      // ✅ ON SAUVEGARDE L'ORDER ID POUR LA REDIRECTION !
      setPendingFeexPayOrderId(json.data.orderId);

      // 🔄 ✅ LOGIQUE DE CONVERSION USD -> CFA (XOF)
      // On multiplie le montant en dollars par le taux de change pour FeexPay.
      // Si le backend n'a pas déjà renvoyé un montant converti dans json.data.amount,
      // on applique un taux (ici 655 par défaut, à ajuster selon ton besoin).
      const CONVERSION_RATE = 655;
      const dollarAmount = json.data.amount || subtotal;
      const amountInCfa = Math.round(dollarAmount * CONVERSION_RATE);

      return {
        amount: amountInCfa, // On passe le montant converti en Francs CFA
        customId: json.data.orderId,
        description: "Commande Marketplace",
        feature: "marketplace",
      };
    } catch (err: unknown) {
      console.error("[Marketplace] FeexPay error:", err);
      const msg = err instanceof Error ? err.message : "Erreur réseau FeexPay";
      setError(msg);
    } finally {
      setPlacing(false);
      setPaymentLoadingMethod(null);
    }
  }

  // ✅ REDIRECTION VERS LA PAGE DE TRANSITION (RESULT)
  const handleFeexPaySuccess = useCallback(
    async (reference: string) => {
      if (!pendingFeexPayOrderId) return;

      setPaymentModalOpen(false);

      // On redirige vers notre nouvelle page de transition /marketplace/result
      // C'est elle qui fera le fetch verify-sdk proprement
      window.location.assign(
        `/marketplace/result?order=${pendingFeexPayOrderId}&provider=feexpay&reference=${encodeURIComponent(reference)}`,
      );
    },
    [pendingFeexPayOrderId],
  );

  async function handlePayCrypto(network = "USDT") {
    if (placing || subtotal <= 0) return;
    if (hasSelfBuy) {
      setError(
        selfBuyMsg ||
          "Impossible d’acheter votre produit car vous en êtes l’auteur.",
      );
      return;
    }
    if (!token) {
      openAuth("signin");
      return;
    }
    if (!cryptoEligible) {
      setError("Le paiement crypto n'est pas disponible pour cette boutique.");
      return;
    }

    setPaymentLoadingMethod("crypto");
    setPlacing(true);
    setError("");

    try {
      const baseItems: readonly CheckoutItemBase[] = intent
        ? intent.items
        : rawCart;
      const items = normalizeItems(baseItems);

      const email = session?.user?.email || session?.email;
      const url = `${API_BASE}/payments/checkout/crypto`;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          network,
          customer_email: email,
        }),
      });

      if (resp.status === 401) {
        openAuth("signin");
        return;
      }

      const json: unknown = await resp.json().catch(() => ({}));

      if (!resp.ok || !isRecord(json) || !json.ok) {
        const rawMsg = isRecord(json)
          ? (json.error ?? json.message)
          : undefined;
        if (typeof rawMsg === "string" && looksLikeSelfBuyMessage(rawMsg)) {
          setError(
            "Impossible d’acheter votre produit car vous en êtes l’auteur.",
          );
        } else {
          setError(
            extractBackendMessage(
              json,
              "Erreur lors de la création de la commande.",
            ),
          );
        }
        return;
      }

      const data = isRecord(json.data) ? json.data : null;
      const reference = data ? (data.reference as string) : undefined;
      const amount = data ? (data.amount as number) : undefined;
      const orderId = data ? (data.orderId as string) : undefined;

      if (typeof reference === "string" && reference.trim()) {
        const phoneNumber = "33652395381";
        const message = `Bonjour,\n\nJe souhaite payer ma commande Marketplace #${String(
          orderId ?? "",
        )} en Crypto.\n\n🔹 Référence : ${reference}\n🔹 Montant : ${String(
          amount ?? "",
        )} $\n🔹 Réseau : ${network}\n🔹 Compte : ${String(email ?? "")}\n\nCi-joint la preuve de paiement 👇`;

        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
          message,
        )}`;

        clearCheckoutIntent();
        revokeCheckoutGate();
        setPaymentModalOpen(false);

        window.open(whatsappUrl, "_blank");
        navigate("/marketplace/dashboard?tab=orders");
      } else {
        setError("Référence de paiement manquante.");
      }
    } catch (err: unknown) {
      console.error("[Marketplace] crypto error:", err);
      setError("Erreur réseau lors de la création du paiement crypto.");
    } finally {
      setPlacing(false);
      setPaymentLoadingMethod(null);
    }
  }

  return {
    isLoggedIn,
    lines,
    loading,
    firstLoadDone,
    ownedIds,
    ownedTitles,
    promoMap,
    subtotal,
    isFreeOrder,
    error,
    placing,
    stripeReady,
    hasSelfBuy,
    disabledForPayment,
    cryptoEligible,
    leaveToCart,
    leaveToShop,
    paymentModalOpen,
    openPaymentModal,
    closePaymentModal,
    paymentLoadingMethod,
    handleFreeOrder,
    handlePayCard,
    handlePayFeexPay,
    handleFeexPaySuccess, // ✅ EXPORT DE LA FONCTION POUR LE MODAL
    handlePayCrypto,
    isRenewCheckout,
    renewProductId,
  };
}
