import { useState, useEffect } from "react";
import { CATEGORIES } from "../utils/data";

export type LangFilter = "all" | "fr" | "en";

export function getUrlPodcastId(): string | null {
  try {
    const u = new URL(window.location.href);
    const id = u.searchParams.get("podcast");
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
}

export function setUrlPodcastId(id: string | null) {
  try {
    const u = new URL(window.location.href);
    if (!id) u.searchParams.delete("podcast");
    else u.searchParams.set("podcast", id);
    window.history.replaceState({}, "", u.toString());
  } catch {
    /* ignore */
  }
}

export function getUrlLang(): LangFilter {
  try {
    const u = new URL(window.location.href);
    const v = (u.searchParams.get("lang") || "").toLowerCase();
    return v === "fr" || v === "en" ? (v as LangFilter) : "all";
  } catch {
    return "all";
  }
}

export function setUrlLang(lang: LangFilter) {
  try {
    const u = new URL(window.location.href);
    if (lang === "all") u.searchParams.delete("lang");
    else u.searchParams.set("lang", lang);
    window.history.replaceState({}, "", u.toString());
  } catch {
    /* ignore */
  }
}

export function usePodcastsFilter() {
  const defaultCategory = (CATEGORIES[0] && CATEGORIES[0].label) || "Playlist";

  const [query, setQuery] = useState<string>("");
  const [active, setActive] = useState<string>(defaultCategory);
  const [language, setLanguage] = useState<LangFilter>(() => getUrlLang());
  const [showOnlyNew, setShowOnlyNew] = useState<boolean>(false);

  // Sync URL when language changes
  useEffect(() => {
    setUrlLang(language);
  }, [language]);

  return {
    query,
    setQuery,
    active,
    setActive,
    language,
    setLanguage,
    showOnlyNew,
    setShowOnlyNew,
  };
}
