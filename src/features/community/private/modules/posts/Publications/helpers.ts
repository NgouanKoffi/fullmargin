/* helpers communs */
// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\tabs\Publications\helpers.ts
export async function parseJsonSafe<T = unknown>(
  r: Response
): Promise<T | null> {
  try {
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export function getAuthHeader(): HeadersInit {
  try {
    const raw = localStorage.getItem("fm:session");
    const tok: string | undefined = raw ? JSON.parse(raw)?.token : undefined;
    return tok ? { Authorization: `Bearer ${tok}` } : {};
  } catch {
    return {};
  }
}

type FMEvents =
  | { name: "fm:open-account"; detail: { mode: "signin" | "signup" } }
  | {
      name: "fm:toast";
      detail: {
        type: "success" | "error" | "info";
        title?: string;
        text?: string;
        autoClose?: number;
        dedupeKey?: string;
      };
    }
  | { name: "fm:community:post:created"; detail: { post: unknown } }
  | {
      name: "fm:community:post:edit";
      detail: {
        id: string;
        content: string;
        media: Array<{
          type: "image" | "video";
          url: string;
          thumbnail: string;
          publicId: string;
        }>;
      };
    };

export function dispatchFM<E extends FMEvents>(e: E): void {
  window.dispatchEvent(
    new CustomEvent(e.name, { detail: e.detail } as CustomEventInit)
  );
}

export function openAuthModal(mode: "signin" | "signup" = "signin") {
  try {
    const from =
      window.location.pathname + window.location.search + window.location.hash;
    localStorage.setItem("fm:auth:intent", from);
  } catch {
    /* ignore */
  }
  dispatchFM({ name: "fm:open-account", detail: { mode } });
}

/** compose className proprement */
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* petits helpers de typage */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}
export function getStr(o: Record<string, unknown>, k: string): string | null {
  const v = o[k];
  return typeof v === "string" ? v : null;
}
export function getOptionalStr(
  o: Record<string, unknown>,
  k: string
): string | null {
  const v = o[k];
  if (v == null) return null;
  return typeof v === "string" ? v : String(v);
}
export function getNum(o: Record<string, unknown>, k: string): number | null {
  const v = o[k];
  return typeof v === "number" ? v : null;
}
