export type Rec = Record<string, unknown>;
export const isRec = (v: unknown): v is Rec =>
  typeof v === "object" && v !== null;

export type Preview = { text: string; imageUrl?: string };

const previewCache = new Map<string, Preview>();
export const getPreviewCache = () => previewCache;

function textFromInline(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(textFromInline).join("");
  if (isRec(v)) {
    const t = typeof v.text === "string" ? v.text : "";
    const c = Array.isArray(v.content)
      ? (v.content as unknown[]).map(textFromInline).join("")
      : "";
    return [t, c].filter(Boolean).join("");
  }
  return "";
}

function findFirstImageUrl(b: unknown): string | undefined {
  if (!isRec(b)) return undefined;

  const t = typeof b.type === "string" ? b.type : "";
  const propsRaw = (b as Rec).props as unknown;
  const props = isRec(propsRaw) ? (propsRaw as Rec) : undefined;

  if (
    t === "image" &&
    props &&
    typeof props.url === "string" &&
    props.url.trim()
  ) {
    return props.url as string;
  }

  const childrenRaw = (b as Rec).children as unknown;
  if (Array.isArray(childrenRaw)) {
    for (const ch of childrenRaw as unknown[]) {
      const u = findFirstImageUrl(ch);
      if (u) return u;
    }
  }
  return undefined;
}

function textFromBlock(b: unknown): string {
  if (!isRec(b)) return "";
  let s = "";

  const contentRaw = (b as Rec).content as unknown;
  if (Array.isArray(contentRaw)) {
    const contentArr = contentRaw as unknown[];
    s += contentArr.map(textFromInline).join("");
  }

  const propsRaw = (b as Rec).props as unknown;
  if (isRec(propsRaw)) {
    const p = propsRaw as Rec;
    if (typeof p.caption === "string") s += " " + p.caption;
    if (typeof p.title === "string") s += " " + p.title;
    if (
      typeof p.url === "string" &&
      ((b as Rec).type === "link" || (b as Rec).type === "bookmark")
    ) {
      s += " " + p.url;
    }
  }

  const childrenRaw = (b as Rec).children as unknown;
  if (Array.isArray(childrenRaw)) {
    const childrenArr = childrenRaw as unknown[];
    if (childrenArr.length > 0) {
      s += " " + childrenArr.map(textFromBlock).join(" ");
    }
  }

  return s;
}

function clampText(s: string, limit = 220): string {
  const cleaned = s.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  return cleaned.slice(0, limit - 1).trimEnd() + "…";
}

export function extractPreviewFromDoc(doc: unknown): Preview {
  let imageUrl: string | undefined;
  let text = "";

  if (Array.isArray(doc)) {
    for (const b of doc as unknown[]) {
      if (!imageUrl) imageUrl = findFirstImageUrl(b);
      if (text.length < 220) text += " " + textFromBlock(b);
      if (imageUrl && text.length >= 220) break;
    }
  } else if (typeof doc === "string") {
    text = doc;
  }

  const finalText = clampText(text);
  return { text: finalText || (imageUrl ? "" : "—"), imageUrl };
}
