// src/pages/podcasts/ShadowHtml.tsx
import { useEffect, useRef } from "react";

/** Sanitize simple : enlève <script>, on* et javascript: */
function sanitizeHtml(raw?: string): string {
  if (!raw) return "";
  let s = raw;
  s = s.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "");
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(
    /\s(href|src)\s*=\s*(['"]?)\s*javascript:[^'"]*\2/gi,
    ' $1="#"'
  );
  return s;
}

/**
 * Dans chaque bloc <style>, remplace :root → :host
 * pour que les variables CSS fonctionnent dans le Shadow DOM.
 */
function retargetRootToHost(html: string): string {
  return html.replace(
    /<style(\s[^>]*)?>([\s\S]*?)<\/style>/gi,
    (
      _m: string,
      attrs: string | undefined,
      css: string | undefined
    ): string => {
      // Marque _m comme “utilisé” pour satisfaire TS (noUnusedParameters)
      void _m;

      const a = attrs ?? "";
      const c = css ?? "";

      // Remplace uniquement le pseudo-sélecteur exact ":root" (pas ":root-xxx")
      const patchedCss = c.replace(
        /(^|[^-])(:root)(\b)/g,
        (_m2: string, pre: string, _root: string, post: string): string => {
          return `${pre}:host${post}`;
        }
      );

      return `<style${a}>${patchedCss}</style>`;
    }
  );
}

export default function ShadowHtml({ html }: { html?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    if (!shadowRef.current) {
      shadowRef.current = hostRef.current.attachShadow({ mode: "open" });
    }

    const safe = sanitizeHtml(html || "");
    const patched = retargetRootToHost(safe);

    // Wrapper minimal : on laisse hériter la typo/couleurs du site,
    // mais ton CSS (scopé .podx + variables dans :host) prendra la main.
    const doc = `
<base target="_blank">
<div class="__root">${patched}</div>`;

    const root = shadowRef.current!;
    while (root.firstChild) root.removeChild(root.firstChild);
    const tpl = document.createElement("template");
    tpl.innerHTML = doc;
    root.appendChild(tpl.content.cloneNode(true));
  }, [html]);

  return <div ref={hostRef} />;
}
