// src/pages/communaute/private/community-details/tabs/GROUP/EditGroupModal.tsx

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Globe2, Lock } from "lucide-react";

import { listCourses, type CourseSaved } from "../Formations/formations.api";
import {
  updateGroup,
  type GroupAccessType,
  type GroupUpdatePayload,
  type GroupLite,
} from "../../api/groups.api";

type Props = {
  communityId: string;
  group: GroupLite;
  onClose: () => void;
};

type AccessType = GroupAccessType;

type GroupWithDescription = GroupLite & {
  description?: string | null;
  visibility?: "public" | "private";
};

export default function EditGroupModal({ communityId, group, onClose }: Props) {
  const g = group as GroupWithDescription;

  const [groupName, setGroupName] = useState(g.name);
  const [groupDescription, setGroupDescription] = useState<string>(
    g.description ?? ""
  );
  const [accessType, setAccessType] = useState<AccessType>(g.accessType);
  const [selectedCourseId, setSelectedCourseId] = useState<string | "">(
    g.courseId || ""
  );

  // 🔐 visibilité initiale venant du backend
  const [visibility, setVisibility] = useState<"public" | "private">(
    g.visibility === "private" ? "private" : "public"
  );

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(g.coverUrl);

  const [courses, setCourses] = useState<CourseSaved[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      setLoadingCourses(true);
      try {
        const items = await listCourses(communityId);
        if (!cancel) setCourses(items);
      } catch {
        if (!cancel) setCourses([]);
      } finally {
        if (!cancel) setLoadingCourses(false);
      }
    };
    load();
    return () => {
      cancel = true;
    };
  }, [communityId]);

  const handleCoverChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    } else {
      setCoverPreview(g.coverUrl);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const name = groupName.trim();
    const description = groupDescription.trim() || null;

    if (!name) {
      setError("Le nom du groupe est obligatoire.");
      return;
    }

    // ✅ couverture obligatoire : soit l’ancienne, soit une nouvelle
    if (!coverPreview) {
      setError("Ajoute une photo de couverture pour ce groupe.");
      return;
    }

    if (accessType === "course" && !selectedCourseId) {
      setError(
        "Sélectionne une formation pour conditionner l’accès au groupe."
      );
      return;
    }

    const payload: GroupUpdatePayload & {
      description?: string | null;
      visibility?: "public" | "private";
    } = {
      name,
      accessType,
      courseId: accessType === "course" ? selectedCourseId : null,
      coverFile: coverFile || undefined,
      description,
      visibility, // 🔐 on envoie la nouvelle visibilité
    };

    try {
      setSaving(true);
      await updateGroup(g.id, payload);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("fm:toast", {
            detail: {
              title: "Groupe mis à jour",
              message: `Le groupe « ${name} » a été modifié avec succès.`,
              tone: "success",
            },
          })
        );

        window.dispatchEvent(
          new CustomEvent("fm:groups:refresh", {
            detail: { communityId },
          })
        );
      }

      onClose();
    } catch (e) {
      const msg =
        e instanceof Error && e.message
          ? e.message
          : "Impossible de mettre à jour le groupe pour le moment.";
      setError(msg);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("fm:toast", {
            detail: {
              title: "Erreur",
              message: msg,
              tone: "error",
            },
          })
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    groupName.trim().length > 0 &&
    !!coverPreview &&
    (accessType === "free" ||
      (accessType === "course" && !!selectedCourseId)) &&
    !saving;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-stretch sm:items-center justify-center px-0 sm:px-3 sm:py-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative w-full sm:max-w-lg max-h-[100vh] sm:max-h-[90vh] sm:rounded-2xl rounded-none bg-white dark:bg-slate-900 shadow-xl border border-black/5 dark:border-white/10 flex flex-col sm:my-0">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-black/5 dark:border-white/10">
          <h2 className="text-base sm:text-lg font-semibold">
            Modifier le groupe
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"
            aria-label="Fermer le modal"
          >
            ✕
          </button>
        </div>

        <div className="px-4 sm:px-5 py-4 overflow-y-auto flex-1">
          <form
            id="__group-edit-form"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* cover */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Photo de couverture <span className="text-red-500">*</span>
              </label>

              <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 overflow-hidden">
                {coverPreview ? (
                  <>
                    <img
                      src={coverPreview}
                      alt="Photo de couverture"
                      className="w-full h-40 sm:h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <label className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-md cursor-pointer hover:bg-white">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleCoverChange}
                        />
                        Changer l’image
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="h-36 sm:h-40 flex flex-col items-center justify-center gap-2 px-4 text-center">
                    <label className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-violet-600 text-white text-xs sm:text-sm font-semibold shadow-md cursor-pointer hover:bg-violet-700 transition">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleCoverChange}
                      />
                      Choisir une image
                    </label>
                    <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                      <p className="font-medium">
                        Aucune image sélectionnée pour l’instant.
                      </p>
                      <p>
                        Ajoute une belle bannière pour ton groupe.
                        <br />
                        Formats recommandés : JPG ou PNG, largeur 1200px
                        minimum.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {!coverPreview && (
                <p className="text-[11px] text-red-500 mt-1">
                  La photo de couverture est obligatoire pour ce groupe.
                </p>
              )}
            </div>

            {/* Nom */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Nom du groupe <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={120}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
                placeholder="Nom du groupe"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Description du groupe
              </label>
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
                maxLength={600}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/70 resize-y"
                placeholder="Explique l’objectif du groupe, le type de discussions, les règles clés…"
              />
              <p className="text-[11px] text-slate-400">
                Tu peux mettre à jour la description à tout moment.
              </p>
            </div>

            {/* Visibilité */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Visibilité du groupe
              </label>
              <div className="flex flex-col gap-2 text-xs sm:text-sm">
                <label className="inline-flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                    className="mt-[2px]"
                  />
                  <span>
                    <span className="font-medium inline-flex items-center gap-1">
                      <Globe2 className="h-3.5 w-3.5" />
                      Groupe public
                    </span>
                    <span className="block text-slate-500 dark:text-slate-400">
                      Le groupe apparaît dans l’onglet public “Groupes”.
                    </span>
                  </span>
                </label>

                <label className="inline-flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                    className="mt-[2px]"
                  />
                  <span>
                    <span className="font-medium inline-flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5" />
                      Groupe privé
                    </span>
                    <span className="block text-slate-500 dark:text-slate-400">
                      Le groupe est visible seulement pour les membres de la
                      communauté.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Type d'accès */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Type d’accès au groupe
              </label>
              <div className="flex flex-col gap-2 text-xs sm:text-sm">
                <label className="inline-flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accessType"
                    value="free"
                    checked={accessType === "free"}
                    onChange={() => setAccessType("free")}
                    className="mt-[2px]"
                  />
                  <span>
                    <span className="font-medium">Accès libre</span>
                    <span className="block text-slate-500 dark:text-slate-400">
                      Tous les membres de la communauté approuvés peuvent
                      rejoindre ce groupe sans condition.
                    </span>
                  </span>
                </label>

                <label className="inline-flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accessType"
                    value="course"
                    checked={accessType === "course"}
                    onChange={() => setAccessType("course")}
                    className="mt-[2px]"
                  />
                  <span>
                    <span className="font-medium">
                      Accès conditionné à une formation
                    </span>
                    <span className="block text-slate-500 dark:text-slate-400">
                      Seuls les étudiants inscrits à une formation spécifique
                      pourront accéder à ce groupe.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Liste des formations si course */}
            {accessType === "course" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Formation liée au groupe{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/70"
                >
                  <option value="">
                    {loadingCourses
                      ? "Chargement des formations…"
                      : "Sélectionne une formation"}
                  </option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}{" "}
                      {c.priceType === "paid"
                        ? `(${c.price ?? 0} ${c.currency ?? ""})`
                        : "(gratuite)"}
                    </option>
                  ))}
                </select>
                {!loadingCourses && courses.length === 0 && (
                  <p className="text-[11px] text-amber-500 mt-1">
                    Tu n’as pas encore de formation dans cette communauté.
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 text-xs px-3 py-2">
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="px-4 sm:px-5 py-3 border-t border-black/5 dark:border-white/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="__group-edit-form"
            disabled={!canSubmit}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-white inline-flex items-center gap-2 ${
              canSubmit
                ? "bg-violet-600 hover:bg-violet-700"
                : "bg-violet-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <span className="h-3 w-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                <span>Mise à jour…</span>
              </>
            ) : (
              "Enregistrer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
