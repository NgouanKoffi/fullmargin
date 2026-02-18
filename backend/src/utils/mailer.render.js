// backend/src/utils/mailer.render.js

const ENV_FROM_NAME =
  process.env.MAIL_FROM_NAME || process.env.APP_NAME || "FullMargin";

const APP_URL =
  process.env.APP_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://fullmargin.net"
    : "http://localhost:5173");

/** ✅ Support WhatsApp */
const SUPPORT_WHATSAPP_E164 =
  process.env.SUPPORT_WHATSAPP_E164 || "33652395381";

function getPath(ctx, path) {
  if (!path) return undefined;
  const parts = String(path).split(".");
  let acc = ctx;
  for (const k of parts) {
    if (acc == null) return undefined;
    if (typeof acc !== "object") return undefined;
    if (!(k in acc)) return undefined;
    acc = acc[k];
  }
  return acc;
}

// ✅ FONCTION CORRIGÉE : Gère les boucles (Arrays) pour afficher les listes
function renderSections(tpl, ctx) {
  if (!tpl) return "";
  return tpl.replace(
    /\{\{\#\s*([a-zA-Z0-9_.]+)\s*\}\}([\s\S]*?)\{\{\/\s*\1\s*\}\}/g,
    (_m, path, inner) => {
      const isLen = /\.length$/.test(path);
      const basePath = isLen ? path.replace(/\.length$/, "") : path;
      const val = getPath(ctx, basePath);

      // 1. C'est un TABLEAU (et on ne demande pas la longueur) => BOUCLE
      if (Array.isArray(val) && !isLen) {
        if (val.length === 0) return "";
        // On répète le contenu pour chaque item
        return val
          .map((item) => {
            // On fusionne le contexte global avec l'item courant
            // pour que {{user.firstName}} marche encore dans la boucle
            const scope = { ...ctx, ...item };

            // On traite récursivement les sous-sections
            const parsedInner = renderSections(inner, scope);

            // On remplace les variables IMMÉDIATEMENT avec le scope de l'item
            return renderVars(parsedInner, scope);
          })
          .join("");
      }

      // 2. C'est une CONDITION (Boolean ou check de longueur)
      let truthy = false;
      if (isLen) {
        if (Array.isArray(val)) truthy = val.length > 0;
        else if (typeof val === "string") truthy = val.length > 0;
        else truthy = val ? 1 : 0; // Fallback
      } else {
        truthy = Array.isArray(val) ? val.length > 0 : !!val;
      }

      return truthy ? inner : "";
    },
  );
}

function renderVars(tpl, ctx) {
  if (!tpl) return "";
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_m, path) => {
    const val = getPath(ctx, path);
    return val == null ? "" : String(val);
  });
}

function renderTemplate(tpl, ctx) {
  if (!tpl) return "";
  // On traite d'abord les sections (boucles/conditions), puis les variables restantes
  return renderVars(renderSections(tpl, ctx), ctx);
}

function stripHtml(html = "") {
  return String(html)
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li>/gi, " • ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function normalizeCtx(ctx = {}) {
  const next = { ...ctx };
  const toLiHtml = (arr) => arr.map((n) => `<li>${String(n)}</li>`).join("");

  if (Array.isArray(next.addedNames))
    next.addedNames = toLiHtml(next.addedNames);
  if (Array.isArray(next.removedNames))
    next.removedNames = toLiHtml(next.removedNames);

  if (!next.app) next.app = {};
  if (!next.app.name) next.app.name = ENV_FROM_NAME;
  if (!next.app.url) next.app.url = APP_URL;

  // ✅ Support ctx (WhatsApp)
  if (!next.support) next.support = {};
  if (!next.support.whatsappNumber)
    next.support.whatsappNumber = SUPPORT_WHATSAPP_E164;
  if (!next.support.whatsappUrl)
    next.support.whatsappUrl = `https://wa.me/${next.support.whatsappNumber}`;

  return next;
}

function fmtFrDate(isoOrDate) {
  if (!isoOrDate) return "";
  try {
    const d =
      isoOrDate instanceof Date ? isoOrDate : new Date(String(isoOrDate));
    if (!Number.isFinite(d.getTime())) return "";
    return d
      .toLocaleString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replaceAll("\u202f", " ");
  } catch {
    return "";
  }
}

function computeExpiryLabel(expiresAt, isLifetime) {
  if (isLifetime) return "Accès illimité";
  const fr = fmtFrDate(expiresAt);
  return fr || "—";
}

module.exports = {
  getPath,
  renderSections,
  renderVars,
  renderTemplate,
  stripHtml,
  normalizeCtx,
  fmtFrDate,
  computeExpiryLabel,
};
