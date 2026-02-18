// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\NotePublic.tsx
import { useEffect, useRef, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import {
  resolveSharedFromLocation,
  type SharePayloadV1,
} from "./notes/lib/share";

/* ===== Helpers ===== */
type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === "object" && v !== null;

async function sha256Hex(input: string) {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getViewerId() {
  try {
    const KEY = "fm:viewer:id";
    let v = localStorage.getItem(KEY);
    if (!v) {
      v =
        (crypto.randomUUID && crypto.randomUUID()) ||
        Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return "anon";
  }
}

/** S’assure que le doc envoyé à BlockNote n’est jamais vide */
function normalizePublicDoc(doc: unknown): PartialBlock[] {
  const arr = Array.isArray(doc) ? (doc as PartialBlock[]) : [];
  return arr.length > 0
    ? arr
    : [{ type: "paragraph", content: "" } as PartialBlock];
}

/* ===== Sous-composant clé-ifié pour (re)créer l’éditeur avec le bon doc ===== */
function PublicDoc({
  doc,
  scheme,
}: {
  doc: PartialBlock[];
  scheme: "light" | "dark";
}) {
  const editor = useCreateBlockNote({ initialContent: doc });

  return (
    <div data-mantine-color-scheme={scheme}>
      <BlockNoteView
        editor={editor}
        editable={false}
        className="bn-prose max-w-none px-3 sm:px-5 py-4"
      />
    </div>
  );
}

/* ===== Page ===== */
export default function NotePublic() {
  const [payload, setPayload] = useState<SharePayloadV1 | null>(null);
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<number | null>(null);

  const loadFromLocation = async () => {
    setLoading(true);
    const p = await resolveSharedFromLocation(window.location);
    setPayload(p);
    setLoading(false);
  };

  useEffect(() => {
    void loadFromLocation();
  }, []);

  useEffect(() => {
    const handler = () => void loadFromLocation();
    window.addEventListener("popstate", handler);
    window.addEventListener("hashchange", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener("hashchange", handler);
    };
  }, []);

  // suivi des vues
  const postedRef = useRef(false);
  useEffect(() => {
    if (!payload || postedRef.current) return;
    postedRef.current = true;

    (async () => {
      try {
        const raw = JSON.stringify(payload);
        const hash = await sha256Hex(raw);
        const res = await fetch("/api/shares/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hash,
            title: payload.title ?? "Sans titre",
            viewer: getViewerId(),
          }),
        });
        if (res.ok) {
          const j: unknown = await res.json().catch(() => null);
          let data: unknown = j;
          if (isRec(j) && "data" in j && isRec((j as Rec).data)) {
            data = (j as { data: unknown }).data;
          }
          if (isRec(data) && typeof data["views"] === "number") {
            setViews(Number(data["views"]));
          }
        }
      } catch {
        /* silent */
      }
    })();
  }, [payload]);

  const scheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";

  // corrections BlockNote (dark + largeur)
  const BN_FIX = `
    .note-paper, .note-paper * { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
    .note-paper .bn-editor, .note-paper .bn-editor .ProseMirror, .note-paper .bn-root { background: transparent !important; }
    .note-paper .bn-editor, .note-paper .bn-editor .ProseMirror { padding: 0 !important; }

    .note-paper { width: 100%; }
    .note-paper .bn-prose { font-size: clamp(14px, 3.8vw, 16px); line-height: 1.65; }
    .note-paper .bn-prose p { margin: .55rem 0; }
    .note-paper .bn-prose h1 { font-size: clamp(22px, 7vw, 28px); line-height: 1.25; margin: .4rem 0 .6rem; }
    .note-paper .bn-prose h2 { font-size: clamp(18px, 6vw, 24px); line-height: 1.28; margin: .5rem 0 .6rem; }
    .note-paper .bn-prose h3 { font-size: clamp(16px, 5.2vw, 20px); line-height: 1.32; margin: .5rem 0 .5rem; }
    .note-paper .bn-prose, .note-paper .bn-prose * { overflow-wrap: anywhere; word-break: break-word; hyphens: auto; }

    .note-paper .bn-prose img { display:block; max-width:100%; height:auto; border-radius:10px; background: transparent !important; }

    .note-paper .bn-prose pre {
      padding: .6rem .7rem;
      border-radius: 10px;
      border: 1px solid rgba(100,116,139,.35);
      background: rgba(15,23,42,.03);
    }

    /* 🌙 dark : texte bien lisible */
    .dark .note-paper .bn-prose,
    .dark .note-paper .bn-prose * {
      color: rgba(248,250,252,.98) !important;
    }
    .dark .note-paper .bn-prose a {
      color: rgba(191,219,254,1) !important;
    }
    .dark .note-paper .bn-prose pre {
      background: rgba(15,23,42,.35) !important;
      border-color: rgba(148,163,184,.45) !important;
    }
  `;

  if (loading) {
    return (
      <main className="min-h-[80svh] flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-xl w-full">
          <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800 mb-4 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse w-11/12" />
            <div className="h-4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse w-9/12" />
          </div>
        </div>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="min-h-[80svh] flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-xl text-center">
          <h1 className="text-lg font-semibold mb-2">Lien de note invalide</h1>
          <p className="opacity-70">Le contenu partagé est introuvable.</p>
        </div>
      </main>
    );
  }

  const doc = normalizePublicDoc(payload.doc);
  const publicKey =
    (payload as Rec)["id"]?.toString() ??
    (payload as Rec)["short"]?.toString() ??
    String(doc.length) + ":" + String((doc[0] as Rec)?.type ?? "p");

  return (
    <main className="min-h-[100svh] py-8 bg-slate-50 dark:bg-slate-950">
      <style>{BN_FIX}</style>

      {/* 👇 conteneur plus large + paddings */}
      <div className="mx-auto w-full max-w-[110rem] px-3 sm:px-6 lg:px-10 relative z-[1]">
        <article className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden isolate">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500" />

          <header className="p-4 sm:p-5 lg:p-6 border-b border-slate-100 dark:border-slate-800">
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-slate-900 dark:text-slate-50">
              {payload.title || "Sans titre"}
            </h1>
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Vue partagée — lecture seule
              {views != null ? ` • ${views} vue${views > 1 ? "s" : ""}` : ""}
            </div>
          </header>

          <section className="p-2 sm:p-4 lg:p-6">
            <div className="note-paper isolate relative z-[1] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm w-full">
              <PublicDoc key={publicKey} doc={doc} scheme={scheme} />
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
