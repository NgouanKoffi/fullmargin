// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\notes\composants\EditorFullScreen.tsx
import React, { useEffect, useId, useState, type CSSProperties } from "react";
import { X, CheckCircle2, Link2, Loader2 } from "lucide-react";
import {
  useCreateBlockNote,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import type { PartialBlock } from "@blocknote/core";
import { fr as dictFr } from "@blocknote/core/locales";
import type { BNEditor } from "../types";
import { toast } from "../lib/toast";
import { assertImageOrThrow, MAX_IMAGE_BYTES } from "../lib/upload";
import UrlModal from "./UrlModal";

/* Thème clair uniquement */
const bnVarsLight: CSSProperties & Record<string, string> = {
  "--bn-colors-editor-background": "transparent",
  "--bn-colors-menu-background": "#ffffff",
  "--bn-colors-menu-text": "#0f172a",
  "--bn-colors-hover": "rgba(99,102,241,.10)",
  "--bn-colors-selection": "rgba(99,102,241,.16)",
  "--bn-colors-border": "rgba(0,0,0,.12)",
};

type SlashItem = ReturnType<typeof getDefaultReactSlashMenuItems>[number];

export default function EditorFullScreen({
  title,
  setTitle,
  seedDoc,
  bnStyle,
  onReady,
  onSave,
  onClose,
  tempUploadsRef,
}: {
  title: string;
  setTitle: (v: string) => void;
  seedDoc: PartialBlock[];
  bnStyle: CSSProperties;
  onReady: (ed: BNEditor) => void;
  onSave: () => void | Promise<void>;
  onClose: () => void;
  tempUploadsRef: React.MutableRefObject<Map<string, File>>;
}) {
  const inputId = useId();

  // pour l'anim de bouton
  const [isSaving, setIsSaving] = useState(false);

  // Classe utile (portals, etc.)
  useEffect(() => {
    document.body.classList.add("fm-notes-open");
    return () => document.body.classList.remove("fm-notes-open");
  }, []);

  const editor = useCreateBlockNote({
    initialContent: seedDoc,
    dictionary: {
      ...dictFr,
      placeholders: {
        ...dictFr.placeholders,
        default: "Commencez à écrire… (tapez « / » pour les commandes)",
        heading: "Titre",
        emptyDocument: "Commencez à écrire…",
      },
    },
    // Upload: images ≤ 5 Mo (aperçu via ObjectURL)
    uploadFile: async (file) => {
      try {
        assertImageOrThrow(file);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Fichier refusé", "error");
        throw err;
      }
      const objUrl = URL.createObjectURL(file);
      tempUploadsRef.current.set(objUrl, file);
      return objUrl;
    },
  });

  useEffect(() => {
    onReady(editor as unknown as BNEditor);
  }, [editor, onReady]);

  /* ---------- Modal URL (remplace prompt) ---------- */
  const [urlModal, setUrlModal] = useState<null | {
    kind: "video" | "audio" | "doc";
    title: string;
    placeholder: string;
  }>(null);

  const insertUrlAtCursor = async (href: string) => {
    const blocks: PartialBlock[] = [
      {
        type: "paragraph",
        content: [
          {
            type: "link",
            href,
            content: [{ type: "text", text: href, styles: {} }],
          },
        ],
      },
    ];
    const pos = editor.getTextCursorPosition();
    const referenceBlock = pos?.block ?? editor.topLevelBlocks[0];
    await editor.insertBlocks(blocks, referenceBlock, "after");
    toast("Lien inséré", "success");
  };

  const makeUrlItem = (
    label: string,
    placeholder: string,
    kind: "video" | "audio" | "doc"
  ): SlashItem => ({
    title: label,
    aliases: ["url", "lien"],
    group: "Insérer",
    icon: <Link2 className="w-4 h-4" />,
    onItemClick: async () => {
      // Ouvre la modale au lieu du prompt
      setUrlModal({ kind, title: label, placeholder });
    },
  });

  // -------- bouton enregistrer avec anim ----------
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const maybePromise = onSave();
      if (maybePromise && typeof maybePromise.then === "function") {
        await maybePromise;
      } else {
        // petit délai pour laisser voir l'anim même si sync
        await new Promise((res) => setTimeout(res, 400));
      }
    } catch (err) {
      // tu peux afficher un toast ici si besoin
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fm-notes-editor fixed inset-0 z-[1000] bg-white text-slate-900 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-[1] px-2 sm:px-4 py-2 sm:py-3 grid grid-cols-[auto,1fr,auto] items-center gap-2 sm:gap-3 border-b border-black/10 bg-white">
        <button
          onClick={onClose}
          className="rounded-lg p-2 hover:bg-black/5"
          title="Fermer l’éditeur"
          id={inputId}
        >
          <X className="w-5 h-5" />
        </button>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre…"
          className="min-w-0 w-full bg-transparent outline-none text-base sm:text-lg font-semibold px-1"
        />

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`inline-flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white whitespace-nowrap transition ${
            isSaving ? "opacity-75 cursor-wait" : "hover:brightness-95"
          }`}
          title="Enregistrer"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </span>
        </button>
      </div>

      {/* Éditeur */}
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="mx-auto w-full max-w-full lg:max-w-[1400px] px-2 sm:px-4 py-3 sm:py-4">
          {/* Garde-fous paste/drag: images uniquement ≤ 5 Mo */}
          <div
            onPasteCapture={(e) => {
              const files = Array.from(e.clipboardData?.files || []);
              if (files.some((f) => !f.type.startsWith("image/")))
                e.preventDefault();
              const big = files.find(
                (f) => f.type.startsWith("image/") && f.size > MAX_IMAGE_BYTES
              );
              if (big) e.preventDefault();
            }}
            onDropCapture={(e) => {
              const files = Array.from(e.dataTransfer?.files || []);
              if (files.some((f) => !f.type.startsWith("image/")))
                e.preventDefault();
              const big = files.find(
                (f) => f.type.startsWith("image/") && f.size > MAX_IMAGE_BYTES
              );
              if (big) e.preventDefault();
            }}
          >
            <BlockNoteView
              editor={editor}
              className="bn-prose px-2 sm:px-4 md:px-6 py-2 sm:py-4 min-h-[calc(100svh-170px)] sm:min-h-[calc(100svh-200px)] max-w-none"
              style={{ ...bnStyle, ...bnVarsLight }}
            >
              {/* Menu “/” personnalisé : pas d’upload fichier, URL uniquement (via modale) */}
              <SuggestionMenuController
                triggerCharacter="/"
                getItems={async () => {
                  const base = getDefaultReactSlashMenuItems(editor);

                  // On garde TOUT le menu natif (dont "Liste repliable")
                  // et on ajoute simplement nos 3 actions URL
                  return [
                    ...base,
                    makeUrlItem(
                      "Vidéo (URL)",
                      "Collez l’URL de la vidéo…",
                      "video"
                    ),
                    makeUrlItem(
                      "Audio (URL)",
                      "Collez l’URL de l’audio…",
                      "audio"
                    ),
                    makeUrlItem(
                      "Document (URL)",
                      "Collez l’URL du document…",
                      "doc"
                    ),
                  ];
                }}
              />
            </BlockNoteView>
          </div>

          <div className="mt-2 text-[11px] opacity-60">
            Images : glisser/coller ou tapez <code>/image</code> (≤ 5&nbsp;Mo).
            Vidéo / Audio / Document : <strong>URL uniquement</strong>.
          </div>
        </div>
      </div>

      {/* Modale d’insertion d’URL */}
      <UrlModal
        open={!!urlModal}
        title={urlModal?.title ?? ""}
        placeholder={urlModal?.placeholder ?? ""}
        confirmLabel="Insérer le lien"
        onCancel={() => setUrlModal(null)}
        onSubmit={async (href) => {
          await insertUrlAtCursor(href);
          setUrlModal(null);
        }}
      />
    </div>
  );
}
