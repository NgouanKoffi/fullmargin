// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\community-details\tabs\CommunityProfil\hooks\useCommunityDraft.ts
import { useEffect, useState } from "react";
import { fetchMyCommunity } from "../services/community.service";
import type { CommunityTradingCategory } from "../types";

export const LS_KEY = "fm.community.last"; // export pour purge externe
const SS_MY_SLUG = "fm:community:my-slug";

/** Shape typée du brouillon de communauté stocké localement */
export type CommunityDraft = {
  id?: string | null;
  name: string;
  slug: string;
  visibility: "public" | "private";
  category: CommunityTradingCategory;
  categoryOther?: string;
  description: string;
  coverUrl?: string;
  logoUrl?: string;
};

/** Valeurs par défaut si aucun cache n’existe */
export const DEFAULT_DRAFT: CommunityDraft = {
  id: null,
  name: "",
  slug: "",
  visibility: "public",
  // ⬇⬇⬇ ICI : on caste pour matcher CommunityTradingCategory
  category: "price_action" as CommunityTradingCategory,
  categoryOther: "",
  description: "",
  coverUrl: "",
  logoUrl: "",
};

function parseLocalStorageDraft(raw: string | null): CommunityDraft | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as Partial<CommunityDraft>;
    return {
      ...DEFAULT_DRAFT,
      ...obj,
      visibility: obj.visibility === "private" ? "private" : "public",
      category: (obj.category ?? "price_action") as CommunityTradingCategory,
    };
  } catch {
    return null;
  }
}

function persistDraft(next: CommunityDraft) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
}

function clearPersistedDraft() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* noop */
  }
  try {
    sessionStorage.removeItem(SS_MY_SLUG);
  } catch {
    /* noop */
  }
}

export function useCommunityDraft() {
  const [loading, setLoading] = useState(true);

  const [draft, setDraft] = useState<CommunityDraft | null>(
    () => parseLocalStorageDraft(localStorage.getItem(LS_KEY)) ?? DEFAULT_DRAFT
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await fetchMyCommunity();
        if (cancelled) return;

        if (me) {
          const payload: CommunityDraft = {
            id: me.id,
            name: me.name ?? "",
            slug: me.slug ?? "",
            visibility: me.visibility === "private" ? "private" : "public",
            category: (me.category ??
              "price_action") as CommunityTradingCategory,
            categoryOther: me.categoryOther ?? "",
            description: me.description ?? "",
            coverUrl: me.coverUrl ?? "",
            logoUrl: me.logoUrl ?? "",
          };
          setDraft(payload);
          persistDraft(payload);
        } else {
          // Aucune communauté côté serveur → purge cache + reset
          clearPersistedDraft();
          setDraft(DEFAULT_DRAFT);
        }
      } catch {
        // Erreur réseau → garde cache existant si présent
        setDraft((prev) => prev ?? DEFAULT_DRAFT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /** Merge-partial + persistance */
  function save(partial: Partial<CommunityDraft>) {
    setDraft((current) => {
      const base = current ?? DEFAULT_DRAFT;
      const next: CommunityDraft = { ...base, ...partial };
      persistDraft(next);
      return next;
    });
  }

  /** Reset manuel (utile si on implémente la suppression côté UI) */
  function reset() {
    clearPersistedDraft();
    setDraft(DEFAULT_DRAFT);
  }

  return { loading, draft, save, reset };
}
