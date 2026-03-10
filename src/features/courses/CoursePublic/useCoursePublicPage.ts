// src/pages/course/CoursePublic/useCoursePublicPage.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { NavigateFunction } from "react-router-dom";

import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";
import { useAuth } from "@core/auth/AuthContext";

import type { CourseSaved, ModuleT, Session } from "../CourseTypes";
import type { Review } from "../ReviewsBlock";
import type { FeexPayConfig } from "@shared/components/payment/PaymentMethodModal";

export type PaymentLoadingMethod = "card" | "feexpay" | null;

function authHeaders(): HeadersInit {
  const t = (loadSession() as Session)?.token ?? "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export type UseCoursePublicPageResult = {
  loading: boolean;
  error: string | null;
  course: CourseSaved | null;

  isAuthenticated: boolean;
  isAdmin: boolean;
  isOwner: boolean;

  modules: ModuleT[];
  modulesCount: number;
  lessonsCount: number;
  priceText: string;

  reviews: Review[];
  setReviews: Dispatch<SetStateAction<Review[]>>;
  displayRating: number;
  totalReviews: number;

  enrolled: boolean;
  checkingEnroll: boolean;
  membershipChecking: boolean;
  membershipError: string | null;

  isBusy: boolean;
  primaryCtaLabel: string;
  primaryCtaClick: () => Promise<void> | void;

  paymentModalOpen: boolean;
  closePaymentModal: () => void;
  paymentLoadingMethod: PaymentLoadingMethod;
  handlePayCard: () => Promise<void>;

  // ✅ Fonction mise à jour pour le SDK
  handlePayFeexPay: () => Promise<FeexPayConfig | void>;
  handleFeexPaySuccess: (reference: string) => Promise<void>;

  playerHref: string;
};

export function useCoursePublicPage(
  courseId: string | undefined,
  navigate: NavigateFunction,
): UseCoursePublicPageResult {
  const auth = useAuth();
  const isAuthenticated = auth.status === "authenticated";
  const session = loadSession() as Session;
  const userId: string | undefined = session?.user?._id || session?.user?.id;
  const roles: string[] = session?.user?.roles ?? [];
  const isAdmin = roles.includes("admin");

  const [course, setCourse] = useState<CourseSaved | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [checkingEnroll, setCheckingEnroll] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const [placing, setPlacing] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoadingMethod, setPaymentLoadingMethod] =
    useState<PaymentLoadingMethod>(null);

  // ✅ ETAT POUR STOCKER LA COMMANDE FEEXPAY EN COURS
  const [pendingFeexPayOrderId, setPendingFeexPayOrderId] = useState<
    string | null
  >(null);

  const [membershipChecking, setMembershipChecking] = useState(false);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);

  const isOwner = !!(
    course?.ownerId &&
    userId &&
    String(course.ownerId) === String(userId)
  );

  const priceText = useMemo(() => {
    if (!course) return "-";
    return course.priceType === "free"
      ? "Gratuit"
      : typeof course.price === "number"
        ? `${course.price} ${course.currency || "USD"}`
        : "-";
  }, [course]);

  const primaryCtaLabel = useMemo(() => {
    if (!course) return "S’inscrire";
    if (isOwner) return "Voir la formation (auteur)";
    if (isAdmin) return "Voir la formation (admin)";
    if (enrolled) return "Suivre la formation";
    if (membershipChecking) return "Vérification…";
    if (enrolling) return "Inscription en cours…";
    if (placing) return "Redirection...";
    return course.priceType === "free" ? "S’inscrire" : "S'inscrire";
  }, [
    course,
    enrolled,
    isOwner,
    isAdmin,
    placing,
    enrolling,
    membershipChecking,
  ]);

  const playerHref = useMemo(() => {
    if (!course) return "";
    return `/communaute/courses/${course.id}/learn`;
  }, [course]);

  const goToLearning = () => {
    if (!playerHref) return;
    navigate(playerHref);
  };

  const closePaymentModal = () => {
    if (!placing) setPaymentModalOpen(false);
  };

  const ensureCommunityMembership = async (): Promise<boolean> => {
    if (!course?.communityId) return true;
    try {
      setMembershipError(null);
      setMembershipChecking(true);
      const res = await fetch(
        `${API_BASE}/communaute/memberships/status/${encodeURIComponent(course.communityId)}`,
        { headers: { ...authHeaders() } },
      );
      if (res.status === 401) {
        window.dispatchEvent(
          new CustomEvent("fm:open-account", { detail: { mode: "signin" } }),
        );
        return false;
      }
      if (!res.ok) throw new Error("Impossible de vérifier l'abonnement.");
      const json = await res.json().catch(() => ({}));
      const status = json?.data?.status || "none";
      if (status !== "approved") {
        setMembershipError(
          "Pour cette formation, tu dois d’abord t’abonner à la communauté avant de t’inscrire ou de payer.",
        );
        return false;
      }
      setMembershipError(null);
      return true;
    } catch (e) {
      setMembershipError(
        e instanceof Error
          ? e.message
          : "Impossible de vérifier ton abonnement.",
      );
      return false;
    } finally {
      setMembershipChecking(false);
    }
  };

  const enrollFree = async () => {
    if (!courseId) return;
    setEnrolling(true);
    try {
      const res = await fetch(
        `${API_BASE}/communaute/courses/${encodeURIComponent(courseId)}/enroll`,
        { method: "POST", headers: { ...authHeaders() } },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg = j?.message || j?.error || "Inscription impossible.";
        if (
          j?.error === "NOT_COMMUNITY_MEMBER" ||
          msg.includes("abonné à la communauté")
        ) {
          setMembershipError(msg);
        }
        throw new Error(msg);
      }
      setEnrolled(true);
      setCourse((prev) =>
        prev
          ? { ...prev, enrollmentCount: (prev.enrollmentCount || 0) + 1 }
          : prev,
      );
    } finally {
      setEnrolling(false);
    }
  };

  const handlePayCard = async () => {
    if (!courseId) return;
    setPlacing(true);
    setPaymentLoadingMethod("card");
    try {
      const url = `${API_BASE}/courses/payments/${encodeURIComponent(courseId)}/checkout`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ method: "stripe" }),
      });
      if (res.status === 401) {
        window.dispatchEvent(
          new CustomEvent("fm:open-account", { detail: { mode: "signin" } }),
        );
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(json?.message || json?.error || "Erreur de paiement");

      const redirectUrl = json.data?.url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error("URL de paiement Stripe manquante");
      }
    } catch (e: unknown) {
      console.error(e);
      const errorMessage =
        e instanceof Error
          ? e.message
          : "Erreur réseau pendant l’ouverture du paiement Stripe.";
      alert(errorMessage);
    } finally {
      setPaymentLoadingMethod(null);
      setTimeout(() => setPlacing(false), 2000);
    }
  };

  // ✅ NOUVELLE LOGIQUE FEEXPAY SDK AVEC CONVERSION CFA
  const handlePayFeexPay = async (): Promise<FeexPayConfig | void> => {
    if (!courseId) return;
    setPlacing(true);
    setPaymentLoadingMethod("feexpay");

    try {
      const url = `${API_BASE}/courses/payments/${encodeURIComponent(courseId)}/checkout`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ method: "feexpay" }),
      });

      if (res.status === 401) {
        window.dispatchEvent(
          new CustomEvent("fm:open-account", { detail: { mode: "signin" } }),
        );
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.ok)
        throw new Error(
          json?.message || json?.error || "Erreur init Mobile Money",
        );

      const orderId = json.data?.orderId;
      if (!orderId) throw new Error("ID de commande manquant");

      setPendingFeexPayOrderId(orderId);

      // 🔄 ✅ LOGIQUE DE CONVERSION USD -> CFA (XOF)
      const CONVERSION_RATE = 655;
      const dollarAmount = course?.price || 0;
      const amountInCfa = Math.round(dollarAmount * CONVERSION_RATE);

      return {
        amount: amountInCfa, // On transmet le montant converti
        customId: orderId,
        description: `Cours : ${course?.title || "Formation"}`,
        feature: "course",
      };
    } catch (e: unknown) {
      console.error(e);
      const errorMessage =
        e instanceof Error
          ? e.message
          : "Erreur lors de l'initialisation Mobile Money.";
      alert(errorMessage);
    } finally {
      setPaymentLoadingMethod(null);
      setPlacing(false);
    }
  };

  const handleFeexPaySuccess = useCallback(
    async (reference: string) => {
      if (!pendingFeexPayOrderId || !courseId) return;

      setPaymentModalOpen(false);

      window.location.assign(
        `/communaute/courses/result?order=${pendingFeexPayOrderId}&course=${courseId}&provider=feexpay&reference=${encodeURIComponent(reference)}`,
      );
    },
    [pendingFeexPayOrderId, courseId],
  );

  const primaryCtaClick = async () => {
    if (!isAuthenticated) {
      window.dispatchEvent(
        new CustomEvent("fm:open-account", { detail: { mode: "signin" } }),
      );
      return;
    }
    if (!course) return;
    if (isOwner || isAdmin || enrolled) {
      goToLearning();
      return;
    }
    const canContinue = await ensureCommunityMembership();
    if (!canContinue) return;
    if (course.priceType === "free") {
      try {
        await enrollFree();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Inscription impossible";
        if (!msg.includes("abonné à la communauté")) alert(msg);
      }
      return;
    }
    setPaymentModalOpen(true);
  };

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${API_BASE}/communaute/courses/public/${encodeURIComponent(courseId || "")}`,
          { headers: { ...authHeaders() } },
        );
        if (!res.ok) throw new Error("Cours introuvable");
        const json = await res.json();
        const data: CourseSaved = json?.data ?? json;
        if (!cancel) setCourse(data);
      } catch (e) {
        if (!cancel)
          setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [courseId]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!courseId || !isAuthenticated) {
        setEnrolled(false);
        return;
      }
      try {
        setCheckingEnroll(true);
        const res = await fetch(
          `${API_BASE}/communaute/courses/${encodeURIComponent(courseId)}/enrollment`,
          { headers: { ...authHeaders() } },
        );
        if (!res.ok) throw new Error("Lecture statut impossible");
        const json = await res.json();
        if (!cancel) setEnrolled(!!json?.data?.enrolled);
      } catch {
        if (!cancel) setEnrolled(false);
      } finally {
        if (!cancel) setCheckingEnroll(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [courseId, isAuthenticated]);

  useEffect(() => {
    if (!courseId) return;
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/communaute/courses/${encodeURIComponent(courseId)}/reviews`,
          { headers: { ...authHeaders() } },
        );
        if (!res.ok) throw new Error("Impossible de charger les avis");
        const json = await res.json();
        const list: Review[] = (json?.data ?? json) || [];
        if (!cancel) setReviews(list);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancel = true;
    };
  }, [courseId]);

  const modules: ModuleT[] = course?.modules ?? [];
  const modulesCount = modules.length;
  const lessonsCount = modules.reduce(
    (n, m) => n + (m.lessons?.length || 0),
    0,
  );
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
      : 0;
  const displayRating =
    (course?.ratingAvg ?? undefined) !== undefined
      ? course?.ratingAvg || 0
      : averageRating;
  const totalReviews = course?.reviewsCount ?? reviews.length ?? 0;
  const isBusy = checkingEnroll || enrolling || placing || membershipChecking;

  return {
    loading,
    error,
    course,
    isAuthenticated,
    isAdmin,
    isOwner,
    modules,
    modulesCount,
    lessonsCount,
    priceText,
    reviews,
    setReviews,
    displayRating,
    totalReviews,
    enrolled,
    checkingEnroll,
    membershipChecking,
    membershipError,
    isBusy,
    primaryCtaLabel,
    primaryCtaClick,
    playerHref,
    paymentModalOpen,
    closePaymentModal,
    paymentLoadingMethod,
    handlePayCard,
    handlePayFeexPay,
    handleFeexPaySuccess,
  };
}
