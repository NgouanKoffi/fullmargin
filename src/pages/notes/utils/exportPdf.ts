import { getNote } from "../api";
import type { Rec } from "./preview";

/** Helpers HTML */
const escapeHTML = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null;

function renderInlines(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .map((node) => {
      if (!isRec(node)) return "";
      const t = node.type as string | undefined;

      if (t === "link") {
        const href =
          isRec(node) && typeof (node as Rec).href === "string"
            ? ((node as Rec).href as string)
            : "#";
        const inner = renderInlines((node as Rec).content);
        return `<a href="${escapeHTML(href)}">${inner || escapeHTML(href)}</a>`;
      }

      if (t === "text") {
        const raw =
          typeof (node as Rec).text === "string"
            ? escapeHTML((node as Rec).text as string)
            : "";
        const styles = isRec((node as Rec).styles)
          ? ((node as Rec).styles as Rec)
          : {};
        let out = raw;
        if ((styles as Rec).code) out = `<code>${out}</code>`;
        if ((styles as Rec).bold) out = `<strong>${out}</strong>`;
        if ((styles as Rec).italic) out = `<em>${out}</em>`;
        if ((styles as Rec).underline) out = `<u>${out}</u>`;
        if ((styles as Rec).strike) out = `<s>${out}</s>`;
        return out;
      }

      if (Array.isArray((node as Rec).content))
        return renderInlines((node as Rec).content);
      return "";
    })
    .join("");
}

function blockToHTML(block: unknown): string {
  if (!isRec(block)) return "";
  const type = (block.type as string) || "paragraph";
  const props = (isRec(block.props) ? (block.props as Rec) : {}) as Rec;
  const content = Array.isArray(block.content) ? block.content : [];

  if (type === "heading") {
    const level =
      typeof props.level === "number"
        ? Math.min(3, Math.max(1, props.level))
        : 2;
    return `<h${level}>${renderInlines(content)}</h${level}>`;
  }

  if (type === "blockquote" || type === "quote")
    return `<blockquote>${renderInlines(content)}</blockquote>`;

  if (type === "image" && typeof props.url === "string") {
    const cap =
      typeof props.caption === "string" && props.caption.trim()
        ? `<figcaption>${escapeHTML(props.caption.trim())}</figcaption>`
        : "";
    return `<figure><img src="${escapeHTML(
      props.url
    )}" alt="" />${cap}</figure>`;
  }

  if (
    /bullet|list|check/i.test(type) ||
    (Array.isArray((block as Rec).children) &&
      ((block as Rec).children as unknown[]).length > 0)
  ) {
    const text =
      renderInlines(content) ||
      (Array.isArray((block as Rec).children)
        ? (((block as Rec).children as unknown[]) || [])
            .map((b) => blockToHTML(b))
            .join(" ")
        : "");
    return `<p>${escapeHTML(text.replace(/<[^>]*>/g, ""))}</p>`;
  }

  if (/code/i.test(type)) {
    const raw =
      renderInlines(content) ||
      (typeof (props as Rec).text === "string"
        ? escapeHTML((props as Rec).text as string)
        : "");
    return `<pre><code>${raw}</code></pre>`;
  }

  return `<p>${renderInlines(content)}</p>`;
}

function docToHTML(doc: unknown, title: string): string {
  const blocks = Array.isArray(doc) ? doc : [];
  const body = blocks.map(blockToHTML).join("\n");

  const css = `
    @page { size: A4; margin: 18mm 16mm 24mm 16mm; }
    :root { color-scheme: light; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans"; color:#111827; }
    h1 { font-size: 24pt; margin: 0 0 12pt; line-height: 1.2; }
    h2 { font-size: 18pt; margin: 16pt 0 6pt; }
    h3 { font-size: 14pt; margin: 12pt 0 6pt; }
    p { font-size: 11pt; line-height: 1.5; margin: 0 0 8pt; }
    a { color: #2563eb; text-decoration: underline; }
    blockquote { margin: 8pt 0; padding: 8pt 12pt; border-left: 3pt solid #ddd; background: #f8fafc; }
    figure { margin: 10pt 0 12pt; }
    img { max-width: 100%; height: auto; border-radius: 6pt; }
    figcaption { font-size: 9pt; color: #6b7280; margin-top: 4pt; }
    pre { background: #f6f8fa; padding: 10pt; border-radius: 6pt; font-size: 10pt; white-space: pre-wrap; word-break: break-word; }
    header { margin-bottom: 14pt; border-bottom: 1pt solid #e5e7eb; padding-bottom: 8pt; }
    .meta { color:#6b7280; font-size:10pt; margin-top: 2pt; }
    .fm-footer { position: fixed; left:0; right:0; bottom:10mm; text-align:center; font-size:9pt; color:#94a3b8; }
    .fm-footer a { color: inherit; text-decoration: none; }
  `;

  const now = new Date().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `<!doctype html><html><head><meta charset="utf-8" />
<title>${escapeHTML(title || "Note")}</title>
<style>${css}</style></head>
<body>
<header><h1>${escapeHTML(
    title || "Note"
  )}</h1><div class="meta">Exporté le ${escapeHTML(now)}</div></header>
${body || "<p>(note vide)</p>"}
<footer class="fm-footer"><a href="https://fullmargin.net" target="_blank" rel="noopener">fullmargin.net</a></footer>
<script>window.addEventListener('load',()=>{setTimeout(()=>{window.print();},80);});</script>
</body></html>`;
}

export async function exportNoteAsPDF(
  id: string,
  onPopupBlocked?: () => void
): Promise<void> {
  const w = window.open("", "_blank");
  if (!w) {
    onPopupBlocked?.(); // plus d'alert()
    return;
  }
  try {
    w.document.write(
      "<!doctype html><title>Export…</title><body>Préparation du PDF…</body>"
    );
    w.document.close();

    const full = await getNote(id);
    const title = ((full as Rec).title as string) || "Note";
    const doc = (full as Rec).doc;

    const html = docToHTML(doc, title);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    w.location.replace(url);
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (err) {
    console.error(err);
    try {
      w.document.body.textContent = "Export PDF impossible.";
    } catch (e) {
      void e;
    }
  }
}
