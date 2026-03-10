// src/pages/course/CoursePlayer/RichTextBN.tsx
import { useEffect, useMemo, useState } from "react";
import { BlockNoteViewRaw, useCreateBlockNote } from "@blocknote/react";
import type { PartialBlock } from "@blocknote/core";
import "@blocknote/core/style.css";

type Props = {
  /** JSON string sauvegardé depuis BlockNote */
  json?: string;
};

type BlockNoteDoc = {
  type?: string;
  content?: PartialBlock[];
};

function isBlockNoteDoc(value: unknown): value is BlockNoteDoc {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as BlockNoteDoc).content)
  );
}

export function RichTextBN({ json }: Props) {
  const hasContent = Boolean(json && json.trim().length > 0);

  const initialContent = useMemo<PartialBlock[]>(() => {
    if (!hasContent || !json) return [];

    try {
      const parsed: unknown = JSON.parse(json);

      // 1) tableau de blocs
      if (Array.isArray(parsed)) {
        return parsed as PartialBlock[];
      }

      // 2) document complet { type: "doc", content: [...] }
      if (isBlockNoteDoc(parsed) && parsed.content) {
        return parsed.content;
      }

      return [];
    } catch {
      // pas du JSON BlockNote → on affiche brut dans un paragraphe
      return [
        {
          type: "paragraph",
          content: [{ type: "text", text: json }],
        } as PartialBlock,
      ];
    }
  }, [hasContent, json]);

  const editor = useCreateBlockNote({
    initialContent,
  });

  // 🔥 Détecte le thème actuel (Tailwind `.dark` sur <html>)
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    const updateTheme = () => {
      setTheme(root.classList.contains("dark") ? "dark" : "light");
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  if (!hasContent) return null;

  return (
    <div className="fm-bn-viewer text-sm leading-relaxed">
      {/* override léger pour que BlockNote hérite du fond & du texte */}
      <style>
        {`
          .fm-bn-viewer-inner .bn-root,
          .fm-bn-viewer-inner .bn-editor,
          .fm-bn-viewer-inner .bn-container {
            background-color: transparent !important;
          }

          .fm-bn-viewer-inner .bn-editor,
          .fm-bn-viewer-inner .bn-editor * {
            color: inherit;
          }

          /* on supprime les bordures / ombres fortes */
          .fm-bn-viewer-inner .bn-editor,
          .fm-bn-viewer-inner .bn-root {
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }

          /* 🚨 FORCE WIDTH 100% sur mobile et desktop */
          .fm-bn-viewer-inner .bn-editor {
            padding-left: 0 !important;
            padding-right: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
          
          /* S'assurer que les blocs internes prennent tout l'espace */
          .fm-bn-viewer-inner .bn-block-content {
            max-width: none !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
        `}
      </style>

      <BlockNoteViewRaw
        editor={editor}
        editable={false}
        theme={theme}
        className="fm-bn-viewer-inner"
      />
    </div>
  );
}
