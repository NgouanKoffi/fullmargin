// src/pages/communaute/public/sections/groupes/GroupDetailsModal.tsx
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarClock,
  GraduationCap,
  Globe2,
  X,
  Lock,
  Unlock,
} from "lucide-react";
import type { PublicGroup, MembershipData } from "./types";

export type GroupDetailsModalProps = {
  group: PublicGroup;
  membership: MembershipData | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onToggleMembership: () => void;
};

export default function GroupDetailsModal(props: GroupDetailsModalProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-stretch sm:items-center justify-center px-0 sm:px-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
        onClick={props.onClose}
        aria-hidden
      />

      {/* MODAL */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[90vh] bg-slate-950/95 text-white shadow-2xl border border-white/10 rounded-none sm:rounded-3xl overflow-y-auto">
        <ModalContent {...props} />
      </div>
    </div>,
    document.body
  );
}

type ModalContentProps = GroupDetailsModalProps;

function ModalContent({
  group,
  membership,
  loading,
  error,
  onClose,
  onToggleMembership,
}: ModalContentProps) {
  const createdDate = group.createdAt
    ? new Date(group.createdAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const membersCount = membership?.membersCount ?? group.membersCount ?? 0;
  const isMember = membership?.isMember ?? false;
  const isOwner = membership?.isOwner ?? false;
  const canToggle = membership?.canToggle ?? !isOwner;
  const everMember = membership?.everMember ?? false;

  // fusion des infos course entre la liste et le membership
  const effectiveCourseId = group.courseId ?? membership?.courseId ?? null;
  const effectiveCourseTitle =
    group.courseTitle ?? membership?.courseTitle ?? null;

  const courseLink = effectiveCourseId
    ? `/communaute/formation/${encodeURIComponent(effectiveCourseId)}`
    : null;

  const primaryLabel = loading
    ? "Chargement…"
    : isMember
    ? "Quitter le groupe"
    : "Rejoindre le groupe";

  const hasCourseConfigured = !!effectiveCourseId;

  // 👉 Cas où il faut PAYER AVANT de rejoindre :
  // - groupe lié à une formation
  // - une courseId existe
  // - user PAS membre
  // - user JAMAIS membre
  // - le backend ne permet PAS de join (canToggle = false)
  // - pas owner
  const shouldShowPayButton =
    group.accessType === "course" &&
    hasCourseConfigured &&
    !!courseLink &&
    !isMember &&
    !everMember &&
    !canToggle &&
    !isOwner;

  return (
    <>
      {/* ---------- IMAGE EN HAUT ---------- */}
      <div className="relative">
        <div className="w-full bg-black">
          <div className="mx-auto max-w-3xl w-full flex justify-center">
            {group.coverUrl ? (
              <img
                src={group.coverUrl}
                alt={group.name}
                className="w-full h-auto max-h-[480px] object-contain"
              />
            ) : (
              <div className="w-full h-[260px] sm:h-[320px] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-indigo-600" />
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/70 backdrop-blur">
            {group.accessType === "free" ? (
              <Unlock className="h-3.5 w-3.5" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            {group.accessType === "free"
              ? "Accès libre"
              : "Accès réservé à une formation"}
          </span>
          {group.communityName && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/70 backdrop-blur">
              <Globe2 className="h-3.5 w-3.5" />
              {group.communityName}
            </span>
          )}
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ---------- CONTENU ---------- */}
      <div className="px-4 sm:px-8 py-5 space-y-5">
        {/* Titre + sous-titre */}
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-semibold">{group.name}</h3>
          <p className="text-sm text-slate-300">
            {group.accessType === "course"
              ? "Groupe réservé aux étudiants d’une formation."
              : "Groupe ouvert aux membres approuvés de la communauté."}
          </p>
          {isOwner && (
            <p className="text-xs font-semibold text-amber-300">
              Tu es l’administrateur de ce groupe.
            </p>
          )}
        </div>

        {/* Description */}
        {group.description ? (
          <p className="text-sm text-slate-200 whitespace-pre-line">
            {group.description}
          </p>
        ) : (
          <p className="text-sm text-slate-300">
            {group.accessType === "course"
              ? "Ce groupe est réservé aux étudiants d’une formation spécifique."
              : "Ce groupe est ouvert aux membres approuvés de la communauté."}
          </p>
        )}

        {/* 🔔 BANNIÈRE FORMATION */}
        {group.accessType === "course" && (
          <div className="rounded-2xl bg-violet-900/25 border border-violet-600/60 px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-start gap-2">
              <GraduationCap className="h-4 w-4 mt-0.5 shrink-0 text-violet-200" />
              <p className="text-violet-50">
                Ce groupe est lié à{" "}
                {effectiveCourseTitle ? (
                  <>
                    la formation{" "}
                    <span className="font-semibold">
                      {effectiveCourseTitle}
                    </span>
                    .
                  </>
                ) : (
                  <>une formation payante sur FullMargin.</>
                )}{" "}
                {!hasCourseConfigured ? (
                  <>
                    Aucune formation n’est actuellement associée à ce groupe.
                    Merci de contacter le responsable de la communauté pour
                    corriger la configuration.
                  </>
                ) : isOwner ? (
                  <>
                    Tu es{" "}
                    <span className="font-semibold">
                      le créateur / administrateur
                    </span>{" "}
                    de ce groupe. Tu y as toujours accès, même si la formation
                    est payante. Ton inscription éventuelle à la formation est
                    gérée séparément.
                  </>
                ) : isMember ? (
                  <>
                    Tu es déjà{" "}
                    <span className="font-semibold">membre de ce groupe</span>.
                    Tes droits d’accès restent liés à ta formation.
                  </>
                ) : shouldShowPayButton ? (
                  <>
                    Tu{" "}
                    <span className="font-semibold">
                      n’es pas encore inscrit
                    </span>{" "}
                    à cette formation. Pour rejoindre ce groupe, tu dois d’abord{" "}
                    <span className="font-semibold">payer la formation</span>.
                    Utilise le bouton{" "}
                    <span className="font-semibold">
                      « Payer la formation »
                    </span>{" "}
                    ci-dessous.
                  </>
                ) : (
                  <>
                    Tes droits d’accès à ce groupe dépendent de ton inscription
                    à la formation associée. Si tu es déjà inscrit, tu peux
                    rejoindre ou quitter le groupe librement.
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* 3 cartes d'info — UNE PAR LIGNE */}
        <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm">
          <InfoCard
            icon={<Users className="h-4 w-4 text-slate-400" />}
            label="Membres"
            value={`${membersCount} membre${membersCount > 1 ? "s" : ""}`}
          />
          <InfoCard
            icon={<CalendarClock className="h-4 w-4 text-slate-400" />}
            label="Création"
            value={createdDate || "Date inconnue"}
          />
          <InfoCard
            icon={
              group.accessType === "free" ? (
                <Unlock className="h-4 w-4 text-slate-400" />
              ) : (
                <Lock className="h-4 w-4 text-slate-400" />
              )
            }
            label="Type d’accès"
            value={
              group.accessType === "free"
                ? "Ouvert aux membres approuvés"
                : "Réservé aux étudiants de la formation"
            }
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/50 text-xs px-3 py-2 text-red-100">
            {error}
          </div>
        )}

        <p className="text-[11px] text-slate-400">
          Tu peux rejoindre ou quitter ce groupe à tout moment, sauf si le
          responsable de la communauté a restreint l’accès.
        </p>
      </div>

      {/* ---------- FOOTER ---------- */}
      <div className="px-4 sm:px-8 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-[11px] text-slate-400">
          Rejoins le groupe pour participer aux discussions et recevoir les
          nouvelles importantes.
        </p>

        {shouldShowPayButton ? (
          // Cas : il doit payer AVANT
          <Link
            to={courseLink as string}
            onClick={onClose}
            className="inline-flex items-center justify-center px-5 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-sm bg-violet-500 hover:bg-violet-600 text-white"
          >
            Payer la formation
          </Link>
        ) : (
          // Cas normal : join/leave
          canToggle &&
          !isOwner && (
            <button
              type="button"
              onClick={onToggleMembership}
              disabled={loading}
              className={`inline-flex items-center justify-center px-5 py-2 rounded-full text-xs sm:text-sm font-semibold shadow-sm disabled:opacity-70 ${
                isMember
                  ? "bg-slate-700 hover:bg-slate-800 text-white"
                  : "bg-violet-600 hover:bg-violet-700 text-white"
              }`}
            >
              {primaryLabel}
            </button>
          )
        )}
      </div>
    </>
  );
}

/* ---------- Petite carte d’info ---------- */

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 px-4 py-3 flex items-center gap-3">
      <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-50">{value}</p>
      </div>
    </div>
  );
}
