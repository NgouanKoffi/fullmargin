// src/pages/communaute/public/community-details/tabs/CommunityProfil/hooks/useSlugCheck.ts
import { useEffect, useRef, useState } from "react";
import { checkSlugAvailable } from "../services/community.service";

/** Hook existant : vérifie un slug saisi/manuellement (compat) */
export function useSlugCheck(slug: string, originalSlug: string) {
  const [checking, setChecking] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!slug.trim()) {
      setOk(null);
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const available = await checkSlugAvailable(slug);
        const same =
          slug.trim().toLowerCase() === originalSlug.trim().toLowerCase();
        setOk(available || same ? true : available === null ? null : false);
      } catch {
        setOk(null);
      } finally {
        setChecking(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [slug, originalSlug]);

  return { checking, ok };
}

/* ===========================
 * Nouveau : génération auto
 * =========================== */

function toSlug(v: string) {
  return v
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

type AutoStatus = "idle" | "checking" | "ok" | "error";

/**
 * Génère automatiquement un slug depuis `name`.
 * - Anti-flicker (spinner n’apparaît qu’après ~350ms)
 * - Résolution auto des collisions : base, base-2, base-3, …
 * - Si edition et égal à originalSlug → considéré comme OK
 */
export function useAutoSlug(name: string, originalSlug?: string) {
  const [slug, setSlug] = useState<string>("");
  const [status, setStatus] = useState<AutoStatus>("idle");
  const [autoAdjusted, setAutoAdjusted] = useState<boolean>(false);

  // Anti-flicker: contrôler l’affichage du spinner
  const [showChecking, setShowChecking] = useState<boolean>(false);
  const spinnerTimer = useRef<number | null>(null);

  // Invalidation “soft” des runs précédents
  const lastRunId = useRef(0);

  useEffect(() => {
    const base = toSlug(name || "");
    if (!base) {
      setSlug("");
      setStatus("idle");
      setAutoAdjusted(false);
      setShowChecking(false);
      return;
    }

    const runId = ++lastRunId.current;

    const debounce = window.setTimeout(() => {
      if (runId !== lastRunId.current) return;

      setStatus("checking");
      setAutoAdjusted(false);

      if (spinnerTimer.current) window.clearTimeout(spinnerTimer.current);
      spinnerTimer.current = window.setTimeout(() => {
        if (runId === lastRunId.current) setShowChecking(true);
      }, 350);

      (async () => {
        try {
          // Cas édition : base identique à l’original -> OK direct
          if (
            originalSlug &&
            base.trim().toLowerCase() === originalSlug.trim().toLowerCase()
          ) {
            if (runId !== lastRunId.current) return;
            setSlug(base);
            setStatus("ok");
            setAutoAdjusted(false);
            setShowChecking(false);
            return;
          }

          // Teste base, puis ajoute -2, -3, ...
          let candidate = base;
          let available = await checkSlugAvailable(candidate);

          if (!available) {
            let suffix = 2;
            while (suffix < 50) {
              if (runId !== lastRunId.current) return;
              candidate = `${base}-${suffix}`;

              if (
                originalSlug &&
                candidate === originalSlug.trim().toLowerCase()
              ) {
                available = true;
                break;
              }
              const ok = await checkSlugAvailable(candidate);
              if (ok) {
                available = true;
                break;
              }
              suffix++;
            }
          }

          if (runId !== lastRunId.current) return;

          if (available) {
            setSlug(candidate);
            setStatus("ok");
            setAutoAdjusted(candidate !== base);
          } else {
            // Fallback rare si tout pris : suffix aléatoire court
            const fallback = `${base}-${Math.random()
              .toString(36)
              .slice(2, 6)}`;
            setSlug(fallback);
            setStatus("ok");
            setAutoAdjusted(true);
          }
        } catch {
          if (runId !== lastRunId.current) return;
          setSlug(base);
          setStatus("error");
          setAutoAdjusted(false);
        } finally {
          // ✅ pas de `return` dans finally (no-unsafe-finally)
          if (runId === lastRunId.current) {
            if (spinnerTimer.current) window.clearTimeout(spinnerTimer.current);
            setShowChecking(false);
          }
        }
      })();
    }, 250); // debounce input

    return () => {
      window.clearTimeout(debounce);
      if (spinnerTimer.current) window.clearTimeout(spinnerTimer.current);
      setShowChecking(false);
    };
  }, [name, originalSlug]);

  return {
    slug,
    status,
    // pour l’UI: n’affiche “Vérification…” que si le délai a expiré
    checking: status === "checking" && showChecking,
    autoAdjusted,
  };
}
