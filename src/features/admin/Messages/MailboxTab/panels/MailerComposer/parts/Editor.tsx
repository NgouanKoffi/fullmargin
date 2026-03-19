// src/features/admin/Messages/MailboxTab/panels/MailerComposer/parts/Editor.tsx
import { useEffect } from "react"; // Suppression de useMemo
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
// import "@blocknote/core/fonts/inter.css"; // Optionnel si déjà global

type Props = {
  subject: string;
  setSubject: (v: string) => void;
  tab: "rich" | "html";
  setTab: (v: "rich" | "html") => void;
  html: string;
  setHtml: (v: string) => void;
};

export default function Editor({
  subject,
  setSubject,
  tab,
  setTab,
  html,
  setHtml,
}: Props) {
  // 1. Initialisation de l'éditeur BlockNote
  const editor = useCreateBlockNote();

  // 2. Synchronisation: Blocks -> HTML (quand on tape)
  const handleEditorChange = async () => {
    // Remplacement de blocksToHTML par blocksToHTMLLossy
    const newHtml = await editor.blocksToHTMLLossy(editor.document);
    // On ne met à jour que si c'est différent pour éviter des loops inutiles
    if (newHtml !== html) {
      setHtml(newHtml);
    }
  };

  // 3. Synchronisation: HTML -> Blocks (quand on change via l'onglet HTML ou seed)
  useEffect(() => {
    async function sync() {
      if (tab !== "rich") return;
      
      // Remplacement de blocksToHTML par blocksToHTMLLossy
      const currentHtml = await editor.blocksToHTMLLossy(editor.document);
      const incomingHtml = html || "";

      // Si le HTML entrant est différent de ce qu'on a en interne, on remplace
      // On utilise un petit check pour éviter de reset le curseur pendant la frappe
      if (currentHtml !== incomingHtml) {
        const blocks = await editor.tryParseHTMLToBlocks(incomingHtml);
        editor.replaceBlocks(editor.topLevelBlocks, blocks);
      }
    }
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]); // On synchronise surtout au switch d'onglet

  return (
    <div className="space-y-3 sm:space-y-4 min-w-0">
      {/* Sujet */}
      <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-3">
        <label className="text-xs font-medium text-skin-muted">Sujet</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder=""
          className="mt-1 w-full rounded-xl border border-skin-border/30 bg-transparent px-3 py-2"
          dir="auto"
          style={{ textAlign: "start" }}
        />
      </div>

      {/* Éditeur */}
      <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface overflow-hidden">
        {/* Onglets */}
        <div className="flex items-center gap-2 px-2 sm:px-3 py-2 border-b border-skin-border/15">
          <div className="inline-flex gap-1 rounded-xl p-1 ring-1 ring-skin-border/20 bg-skin-surface">
            <button
              onClick={() => setTab("rich")}
              className={[
                "px-3 py-1.5 rounded-lg text-sm",
                tab === "rich" ? "bg-[#7c3aed] text-white" : "hover:bg-skin-tile",
              ].join(" ")}
              type="button"
            >
              Texte
            </button>
            <button
              onClick={() => setTab("html")}
              className={[
                "px-3 py-1.5 rounded-lg text-sm",
                tab === "html" ? "bg-[#7c3aed] text-white" : "hover:bg-skin-tile",
              ].join(" ")}
              type="button"
            >
              HTML
            </button>
          </div>
        </div>

        <div className="min-h-72">
          {tab === "rich" ? (
            <div className="p-2 sm:p-4 bg-white text-black dark:bg-slate-950 dark:text-slate-200">
              <BlockNoteView
                editor={editor}
                theme="light" // ou géré dynamiquement
                onChange={handleEditorChange}
                className="bn-prose"
              />
            </div>
          ) : (
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={15}
              className="w-full p-4 font-mono text-sm min-h-[300px] bg-transparent focus:outline-none"
              placeholder="Contenu HTML..."
              dir="auto"
              style={{ textAlign: "start" }}
            />
          )}
        </div>
      </div>

      {/* Aperçu */}
      <div className="rounded-2xl ring-1 ring-skin-border/20 bg-white text-black p-4">
        <div className="text-xs text-gray-600 mb-3 pb-2 border-b border-gray-100">
          <b>Aperçu du sujet :</b> {subject || "(Sans objet)"}
        </div>
        <div
          className="prose prose-sm max-w-none min-h-20"
          dir="auto"
          style={{ direction: "inherit", textAlign: "start", unicodeBidi: "plaintext" }}
          dangerouslySetInnerHTML={{ __html: html || "" }}
        />
      </div>
    </div>
  );
}