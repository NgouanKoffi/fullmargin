// src/pages/communaute/public/community-details/tabs/Formations/formations.validation.ts
import type { CourseDraft, Lesson } from "./types";

export const MIN_PRICE_USD = 1;

// ✅ 3 étapes : 1 = infos / 2 = modules / 3 = prix
export type Step = 1 | 2 | 3;

/* --------- Étape 1 : infos générales --------- */
export function validateStep1(d: CourseDraft) {
  const messages: string[] = [];

  // Couverture obligatoire
  if (!d.coverFile && !d.coverPreview) {
    messages.push("Ajoute une photo de couverture (JPG/PNG).");
  }

  // Titre obligatoire
  if (d.title.trim().length < 3) {
    messages.push("Le titre doit contenir au moins 3 caractères.");
  }

  // Niveau obligatoire
  if (!d.level) {
    messages.push("Sélectionne un niveau.");
  }

  // Points d’apprentissage : pas obligatoires en nombre,
  // mais ceux qui existent ne doivent pas être vides.
  const empties = d.learnings
    .map((t, i) => ({ t, i }))
    .filter((x) => x.t.trim().length === 0)
    .map((x) => x.i + 1);

  if (empties.length > 0) {
    messages.push(`Certains points sont vides : ${empties.join(", ")}.`);
  }

  // 🟢 Description globale OPTIONNELLE
  const desc = (d.longDesc || "").trim();
  if (desc && desc.length < 30) {
    messages.push(
      "Si tu ajoutes une description globale, elle doit contenir au moins 30 caractères."
    );
  }

  return { ok: messages.length === 0, messages };
}

/* --------- Helpers modules / leçons --------- */

// ❗ Version simplifiée : on considère qu'il y a une ressource
// dès qu'il existe AU MOINS UN item dans la leçon.
function isLessonValid(l: Lesson, messages?: string[], path?: string) {
  const where = path ? ` (${path})` : "";
  let ok = true;

  // Titre de leçon obligatoire
  if (!l.title.trim()) {
    ok = false;
    messages?.push(`Une leçon sans titre${where}.`);
  }

  const items = (l.items ?? []).filter(Boolean);

  if (items.length === 0) {
    ok = false;
    messages?.push(
      `La leçon${where} doit contenir au moins une ressource (PDF ou vidéo).`
    );
  }

  return ok;
}

/* --------- Étape 2 : modules / leçons --------- */
export function validateStep2(d: CourseDraft) {
  const messages: string[] = [];

  if (d.modules.length === 0) {
    messages.push("Ajoute au moins un module.");
  }

  d.modules.forEach((m, mi) => {
    const base = `Module ${mi + 1}`;

    // Titre de module obligatoire
    if (!m.title.trim()) {
      messages.push(`${base} sans titre.`);
    }

    const lessons = m.lessons ?? [];

    if (lessons.length < 1) {
      messages.push(`${base} doit contenir au moins une leçon.`);
    }

    lessons.forEach((l, li) => {
      isLessonValid(l as Lesson, messages, `${base} > Leçon ${li + 1}`);
    });
  });

  return { ok: messages.length === 0, messages };
}

/* --------- Étape 3 : prix --------- */
export function validateStep3(d: CourseDraft) {
  const messages: string[] = [];

  if (d.priceType === "paid") {
    if (!(typeof d.price === "number" && d.price >= MIN_PRICE_USD)) {
      messages.push(`Le prix doit être au moins ${MIN_PRICE_USD} USD.`);
    }
  }

  return { ok: messages.length === 0, messages };
}

/* --------- Validation globale --------- */
export function validateAll(d: CourseDraft) {
  const v1 = validateStep1(d);
  const v2 = validateStep2(d);
  const v3 = validateStep3(d);

  const ok = v1.ok && v2.ok && v3.ok;

  return {
    ok,
    byStep: {
      1: v1,
      2: v2,
      3: v3,
    } as Record<Step, { ok: boolean; messages: string[] }>,
  };
}
