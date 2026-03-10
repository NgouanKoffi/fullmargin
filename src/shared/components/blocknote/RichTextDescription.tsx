// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\blocknote\RichTextDescription.tsx
import { useEffect } from "react";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import type { Block } from "@blocknote/core";

/* ---------- Helpers BlockNote ---------- */

function safeParseBlocks(raw: string | undefined | null): Block[] | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed as Block[];
    }
  } catch {
    // pas du JSON BlockNote → on laisse l’éditeur créer un doc vide
  }
  return undefined;
}

type RichTextDescriptionEditorProps = {
  value: string;
  onChange: (val: string) => void;
};

/* ---------- Éditeur BlockNote réutilisable ---------- */

export function RichTextDescriptionEditor({
  value,
  onChange,
}: RichTextDescriptionEditorProps) {
  const editor = useCreateBlockNote({
    initialContent: safeParseBlocks(value),
  });

  useEffect(() => {
    const blocksFromProp = safeParseBlocks(value);
    if (!blocksFromProp) return;

    try {
      const currentJson = JSON.stringify(editor.document);
      const incomingJson = JSON.stringify(blocksFromProp);

      if (currentJson !== incomingJson) {
        editor.replaceBlocks(editor.topLevelBlocks, blocksFromProp);
      }
    } catch {
      // ignore
    }
  }, [value, editor]);

  const handleChange = () => {
    try {
      const json = JSON.stringify(editor.document);
      onChange(json);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/70 bg-white dark:border-slate-700 dark:bg-slate-900 p-2 sm:p-3">
      <BlockNoteView
        editor={editor}
        theme="light"
        onChange={handleChange}
        className="bn-prose"
        // 💥 on impose le wrap ici, en inline, plus fort que tout le reste
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      />
    </div>
  );
}
