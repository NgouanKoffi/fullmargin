// src/pages/communaute/private/community-details/tabs/Formations/AssignCourseAccessModal.tsx
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type { CourseSavedWithAgg } from "../Formations";
import type { CommunityMemberLite } from "../../components/CommunityMembersList";
import { API_BASE } from "../../../../../../lib/api";
import { loadSession } from "../../../../../../auth/lib/storage";

type Props = {
  open: boolean;
  onClose: () => void;
  communityId: string;
  member: CommunityMemberLite;
  courses: CourseSavedWithAgg[];
};

export function AssignCourseAccessModal({
  open,
  onClose,
  member,
  courses,
}: Props) {
  const paidCourses = useMemo(
    () => courses.filter((c) => c.priceType === "paid"),
    [courses]
  );

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = API_BASE.replace(/\/+$/, "");

  useEffect(() => {
    if (!open) return;
    if (!paidCourses.length) {
      setSelectedCourseId(null);
      setEnrolled(null);
      return;
    }
    // par défaut : première formation payante
    setSelectedCourseId(paidCourses[0].id);
  }, [open, paidCourses]);

  const withAuthHeaders = () => {
    const session = loadSession() as { token?: string } | null;
    const token = session?.token;
    if (!token) return null;

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const showToast = (detail: {
    title: string;
    message: string;
    tone: "success" | "error" | "warning" | "info";
  }) => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("fm:toast", { detail }));
  };

  // 🔍 Vérifier si ce membre est déjà inscrit au cours sélectionné
  useEffect(() => {
    if (!open) return;
    if (!selectedCourseId) {
      setEnrolled(null);
      return;
    }

    const headers = withAuthHeaders();
    if (!headers) {
      setEnrolled(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setChecking(true);
        setError(null);

        const url = `${base}/communaute/courses/${selectedCourseId}/admin-enrollment?userId=${encodeURIComponent(
          member.id
        )}`;

        const res = await fetch(url, { headers });
        const json = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok || json.ok === false) {
          throw new Error(
            json?.error ||
              json?.message ||
              "Impossible de lire l’état d’inscription."
          );
        }

        setEnrolled(!!json.data?.enrolled);
      } catch (e) {
        if (cancelled) return;
        setEnrolled(null);
        setError(
          e instanceof Error
            ? e.message
            : "Impossible de lire l’état d’inscription."
        );
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedCourseId, member.id]);

  if (!open) return null;

  const selectedCourse =
    paidCourses.find((c) => c.id === selectedCourseId) || null;

  const handlePrimaryAction = async () => {
    if (!selectedCourse || busy) return;

    const headers = withAuthHeaders();
    if (!headers) {
      showToast({
        title: "Connexion requise",
        message:
          "Connecte-toi pour pouvoir inscrire manuellement un abonné à une formation.",
        tone: "warning",
      });
      return;
    }

    setBusy(true);
    setError(null);

    const isCurrentlyEnrolled = !!enrolled;
    const endpoint = isCurrentlyEnrolled
      ? `${base}/communaute/courses/${selectedCourse.id}/admin-unenroll`
      : `${base}/communaute/courses/${selectedCourse.id}/admin-enroll`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ userId: member.id }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json.ok === false) {
        throw new Error(
          json?.error ||
            json?.message ||
            (isCurrentlyEnrolled
              ? "Retrait d’accès impossible."
              : "Inscription manuelle impossible.")
        );
      }

      if (isCurrentlyEnrolled) {
        setEnrolled(false);
        showToast({
          title: "Accès retiré",
          message: `${member.fullName} n’a plus accès à « ${selectedCourse.title} ».`,
          tone: "success",
        });
      } else {
        setEnrolled(true);
        showToast({
          title: "Inscription effectuée",
          message: `${member.fullName} a été inscrit(e) à « ${selectedCourse.title} » comme s’il/elle avait payé le cours.`,
          tone: "success",
        });
      }
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : isCurrentlyEnrolled
          ? "Retrait d’accès impossible."
          : "Inscription manuelle impossible.";
      setError(msg);
      showToast({
        title: "Erreur",
        message: msg,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  // 🔹 Contenu du modal
  const modalContent = (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Gérer les accès de {member.fullName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sélectionne une formation payante puis inscris ou retire l’accès
              pour cet abonné.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
          >
            ✕
          </button>
        </div>

        {paidCourses.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Il n’y a actuellement aucune formation payante dans cette
            communauté. L’inscription manuelle sert surtout à débloquer des
            accès payants.
          </p>
        ) : (
          <>
            {/* Select des cours payants */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Formation payante
              </label>
              <select
                value={selectedCourseId || ""}
                onChange={(e) => setSelectedCourseId(e.target.value || null)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/80 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/70"
              >
                {paidCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {(c.currency || "USD").toUpperCase()}{" "}
                    {typeof c.price === "number" ? c.price.toFixed(2) : "0.00"}
                  </option>
                ))}
              </select>
            </div>

            {/* Etat d’inscription */}
            {selectedCourse && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2">
                <span>
                  {checking
                    ? "Vérification de l’état d’accès…"
                    : enrolled === true
                    ? `Actuellement : déjà inscrit à « ${selectedCourse.title} ».`
                    : enrolled === false
                    ? `Actuellement : n’a pas accès à « ${selectedCourse.title} ».`
                    : "Impossible de déterminer l’état d’accès pour le moment."}
                </span>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            {/* Boutons */}
            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70"
              >
                Fermer
              </button>
              <button
                type="button"
                disabled={busy || checking || !selectedCourse}
                onClick={handlePrimaryAction}
                className="px-4 py-1.5 rounded-full text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 inline-flex items-center gap-2 disabled:opacity-60"
              >
                {busy && (
                  <span className="h-3 w-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                )}
                <span>
                  {enrolled ? "Retirer l’accès" : "Inscrire à ce cours"}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // 🔹 Portal vers le body pour éviter que le parent coupe le modal
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  // Fallback (SSR)
  return modalContent;
}
