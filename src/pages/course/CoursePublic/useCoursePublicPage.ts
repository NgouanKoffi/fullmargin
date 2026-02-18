// src/pages/course/CoursePublic/useCoursePublicPage.ts
import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { NavigateFunction } from "react-router-dom";

import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";
import { useAuth } from "../../../auth/AuthContext";

import type { CourseSaved, ModuleT, Session } from "../CourseTypes";
import type { Review } from "../ReviewsBlock";

/* ------- Helper headers auth ------- */
function authHeaders(): HeadersInit {
  const t = (loadSession() as Session)?.token ?? "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export type UseCoursePublicPageResult = {
  // états principaux
  loading: boolean;
  error: string | null;
  course: CourseSaved | null;

  // infos user
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOwner: boolean;

  // formation / contenu
  modules: ModuleT[];
  modulesCount: number;
  lessonsCount: number;
  priceText: string;

  // avis
  reviews: Review[];
  setReviews: Dispatch<SetStateAction<Review[]>>;
  displayRating: number;
  totalReviews: number;

  // inscription & communauté
  enrolled: boolean;
  checkingEnroll: boolean;
  membershipChecking: boolean;
  membershipError: string | null;

  // CTA / paiement
  isBusy: boolean;
  primaryCtaLabel: string;
  primaryCtaClick: () => Promise<void> | void;

  // player
  playerHref: string;
};

export function useCoursePublicPage(
  courseId: string | undefined,
  navigate: NavigateFunction,
): UseCoursePublicPageResult {
  const auth = useAuth();
  const isAuthenticated = auth.status === "authenticated";

  // Infos user
  const session = loadSession() as Session;
  const userId: string | undefined = session?.user?._id || session?.user?.id;
  const roles: string[] = session?.user?.roles ?? [];
  const isAdmin = roles.includes("admin");

  const [course, setCourse] = useState<CourseSaved | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Inscription */
  const [checkingEnroll, setCheckingEnroll] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  /* Paiement */
  const [placing, setPlacing] = useState(false); // “redirection Stripe…”

  /* Contrôle d'abonnement à la communauté */
  const [membershipChecking, setMembershipChecking] = useState(false);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  /* Avis */
  const [reviews, setReviews] = useState<Review[]>([]);

  const isOwner = !!(
    course?.ownerId &&
    userId &&
    String(course.ownerId) === String(userId)
  );

  /* Prix & CTA */
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
    if (placing) return "Redirection vers le paiement…"; // ✅ Label plus clair
    return course.priceType === "free" ? "S’inscrire" : "Payer et s’inscrire";
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

  /** Vérifie l'abonnement à la communauté */
  const ensureCommunityMembership = async (): Promise<boolean> => {
    if (!course?.communityId) return true;

    try {
      setMembershipError(null);
      setMembershipChecking(true);

      const res = await fetch(
        `${API_BASE}/communaute/memberships/status/${encodeURIComponent(
          course.communityId,
        )}`,
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
          : "Impossible de vérifier ton abonnement à la communauté.",
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
          throw new Error(msg);
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

  /** Ouvre le checkout Stripe (paiement par carte) */
  const payAndEnroll = async () => {
    if (!courseId) return;
    setPlacing(true);
    try {
      const res = await fetch(
        `${API_BASE}/communaute/courses/${encodeURIComponent(
          courseId,
        )}/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: "{}",
        },
      );

      if (res.status === 401) {
        window.dispatchEvent(
          new CustomEvent("fm:open-account", { detail: { mode: "signin" } }),
        );
        return;
      }

      if (!res.ok) {
        let message = "Checkout impossible";
        try {
          const j = await res.json();
          if (
            j?.error === "NOT_COMMUNITY_MEMBER" ||
            j?.message?.includes("abonné à la communauté")
          ) {
            message = j?.message;
            setMembershipError(message);
          } else if (j?.message || j?.error) {
            message = j.message || j.error;
          }
        } catch {
          /* ignore */
        }
        alert(message);
        return;
      }

      const json = await res.json();
      const url = json?.data?.url;
      if (!url) return alert("URL de paiement manquante");
      window.location.assign(url);
    } catch {
      alert("Erreur réseau pendant l’ouverture du paiement");
    } finally {
      // On laisse placing à true car on va être redirigé, sauf si erreur
      // Mais ici on le remet à false en cas d'erreur pour débloquer le bouton
      // En cas de succès, la page se recharge donc ce n'est pas grave
      setTimeout(() => setPlacing(false), 2000);
    }
  };

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

    // Si gratuit -> inscription directe
    if (course.priceType === "free") {
      try {
        await enrollFree();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Inscription impossible";
        if (!msg.includes("abonné à la communauté")) {
          alert(msg);
        }
      }
      return;
    }

    // ✅ SI PAYANT : On lance DIRECTEMENT Stripe (plus de modal)
    await payAndEnroll();
  };

  /* Charger cours */
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${API_BASE}/communaute/courses/public/${encodeURIComponent(
            courseId || "",
          )}`,
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

  /* Statut inscription */
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
          `${API_BASE}/communaute/courses/${encodeURIComponent(
            courseId,
          )}/enrollment`,
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

  /* Charger avis */
  useEffect(() => {
    if (!courseId) return;
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/communaute/courses/${encodeURIComponent(
            courseId,
          )}/reviews`,
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
  };
}
