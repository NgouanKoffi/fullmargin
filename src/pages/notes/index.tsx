// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\notes\index.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Plus, Search, FolderPlus, ChevronLeft } from "lucide-react";
import type { PartialBlock } from "@blocknote/core";

import { ApiError } from "../../lib/api";
import {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  type NoteListItem,
} from "./api";

import type { BNEditor, Row } from "./types";
import { toast } from "./lib/toast";
import { convertPreviewImagesToDataURLs } from "./lib/upload";
import NotesList from "./composants/NotesList";
import EditorFullScreen from "./composants/EditorFullScreen";
import ConfirmModal from "./composants/modals/ConfirmModal";
import PromptModal from "./composants/modals/PromptModal";
import { buildShareURL } from "./lib/share";

/* === Dossiers (backend/local) === */
import {
  listFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  listNoteFolderMap,
  setNoteFolderId,
  type Folder,
} from "./foldersStore";

/** BlockNote suit currentColor */
const BN_FIX = `
  .bn-editor, .bn-editor .ProseMirror { background: transparent !important; }
  .bn-prose { color: currentColor !important; }
  .bn-prose * { color: inherit; }
  .bn-editor .ProseMirror p.is-empty::before { color: currentColor; opacity:.55; }
`;

export default function NotesPage() {
  const url = new URL(window.location.href);
  const bootId = url.searchParams.get("id") || "";

  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loadingList, setLoadingList] = useState(false);

  // ==== Dossiers ====
  const [folders, setFolders] = useState<Folder[]>([]);
  const [note2folder, setNote2folder] = useState<Record<string, string | null>>(
    {}
  );
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState<boolean>(!!bootId);
  const [noteId, setNoteId] = useState<string>(bootId);
  const [title, setTitle] = useState<string>("");
  const [seedDoc, setSeedDoc] = useState<PartialBlock[]>([
    { type: "paragraph", content: "" } as PartialBlock,
  ]);
  const [editorKey, setEditorKey] = useState<string>("new");

  // Suppression de note (ConfirmModal)
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  // Modales dossiers
  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameInitial, setRenameInitial] = useState<string>("");

  const [deleteFolderOpen, setDeleteFolderOpen] = useState(false);
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);

  const tempUploadsRef = useRef<Map<string, File>>(new Map()); // ObjectURL -> File
  const editorRef = useRef<BNEditor | null>(null);
  const onEditorReady = (ed: BNEditor) => (editorRef.current = ed);

  const bnStyle: React.CSSProperties = {
    backdropFilter: "none",
    boxShadow: "none",
  };

  const hydrateRows = useCallback(
    (items: NoteListItem[]) =>
      items.map<Row>((n) => ({
        id: n.id,
        title: n.title || "Sans titre",
        updatedAt: new Date(n.updatedAt).getTime(),
        pinned: !!n.pinned,
        tags: n.tags || [],
      })),
    []
  );

  const refreshFolders = useCallback(async () => {
    const [f, map] = await Promise.all([listFolders(), listNoteFolderMap()]);
    setFolders(f);
    setNote2folder(map);
  }, []);

  const fetchList = useCallback(
    async (search = "") => {
      try {
        setLoadingList(true);
        const res = await listNotes({ q: search, limit: 60 });
        setRows(hydrateRows(res.items));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          toast("Connecte-toi pour accéder à tes notes.", "warning");
          window.dispatchEvent(new CustomEvent("fm:open-account"));
        } else {
          toast("Chargement impossible", "error");
        }
      } finally {
        setLoadingList(false);
      }
    },
    [hydrateRows]
  );

  useEffect(() => {
    fetchList();
    void refreshFolders();
    if (bootId) void openEdit(bootId);
  }, [fetchList, bootId, refreshFolders]);

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchList(q.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [q, fetchList]);

  const openNew = () => {
    const nu = new URL(window.location.href);
    nu.searchParams.delete("id");
    window.history.replaceState({}, "", nu.toString());
    setTitle("");
    setSeedDoc([{ type: "paragraph", content: "" } as PartialBlock]);
    setNoteId("");
    setEditorKey("new");
    setEditorOpen(true);
    tempUploadsRef.current.clear();
  };

  const openEdit = async (id: string) => {
    try {
      const data = await getNote(id);
      setTitle(data.title || "Sans titre");
      setSeedDoc(
        (data.doc as PartialBlock[]) ?? [
          { type: "paragraph", content: "" } as PartialBlock,
        ]
      );
      setNoteId(id);
      setEditorKey(id);
      const nu = new URL(window.location.href);
      nu.searchParams.set("id", id);
      window.history.replaceState({}, "", nu.toString());
      setEditorOpen(true);
      tempUploadsRef.current.clear();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        toast("Session expirée. Connecte-toi.", "warning");
        window.dispatchEvent(new CustomEvent("fm:open-account"));
      } else {
        toast("Note introuvable", "error");
      }
    }
  };

  const handleSave = useCallback(
    async (notify = false) => {
      if (!editorOpen) return;
      try {
        const currentDoc = (editorRef.current?.document ??
          seedDoc) as PartialBlock[];
        const doc = await convertPreviewImagesToDataURLs(
          currentDoc,
          tempUploadsRef.current
        );

        if (noteId) {
          await updateNote(noteId, {
            title: title?.trim() || "Sans titre",
            doc,
          });
          if (notify) toast("Note enregistrée", "success");
          setRows((prev) =>
            [...prev]
              .map((r) =>
                r.id === noteId
                  ? {
                      ...r,
                      title: title?.trim() || "Sans titre",
                      updatedAt: Date.now(),
                    }
                  : r
              )
              .sort((a, b) => b.updatedAt - a.updatedAt)
          );
        } else {
          const r = await createNote({
            title: title?.trim() || "Sans titre",
            doc,
          });
          const id = r.id;

          // Ranger la note dans le dossier courant
          if (selectedFolderId) {
            await setNoteFolderId(id, selectedFolderId);
            const map = await listNoteFolderMap();
            setNote2folder(map);
          }

          setNoteId(id);
          setEditorKey(id);
          const nu = new URL(window.location.href);
          nu.searchParams.set("id", id);
          window.history.replaceState({}, "", nu.toString());
          if (notify) toast("Note créée", "success");
          void fetchList(q.trim());
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          toast("Session expirée. Connecte-toi.", "warning");
          window.dispatchEvent(new CustomEvent("fm:open-account"));
        } else {
          toast("Sauvegarde impossible", "error");
        }
      }
    },
    [editorOpen, seedDoc, noteId, title, q, fetchList, selectedFolderId]
  );

  const closeEditor = () => {
    setEditorOpen(false);
    const nu = new URL(window.location.href);
    nu.searchParams.delete("id");
    window.history.replaceState({}, "", nu.toString());
    tempUploadsRef.current.clear();
  };

  const reallyDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      const cp = { ...note2folder };
      delete cp[id];
      setNote2folder(cp);
      if (id === noteId) {
        closeEditor();
        setTitle("");
        setSeedDoc([{ type: "paragraph", content: "" } as PartialBlock]);
        setNoteId("");
        setEditorKey("new");
      }
      toast("Note supprimée", "success");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        toast("Session expirée. Connecte-toi.", "warning");
        window.dispatchEvent(new CustomEvent("fm:open-account"));
      } else {
        toast("Suppression impossible", "error");
      }
    }
  };

  const shareNote = async (id: string) => {
    try {
      let doc: PartialBlock[];
      let t = title || "Note";
      if (id === noteId && editorOpen) {
        const currentDoc = (editorRef.current?.document ??
          seedDoc) as PartialBlock[];
        doc = await convertPreviewImagesToDataURLs(
          currentDoc,
          tempUploadsRef.current
        );
      } else {
        const full = await getNote(id);
        t = full.title || t;
        doc = (full.doc as PartialBlock[]) ?? [
          { type: "paragraph", content: "" } as PartialBlock,
        ];
      }
      const urlShare = await buildShareURL({ title: t, doc });
      await navigator.clipboard.writeText(urlShare);
      toast("Lien copié", "info");
    } catch {
      toast("Partage impossible", "error");
    }
  };

  // --------- Dataset affiché ----------
  const childFolders = useMemo(
    () => folders.filter((f) => f.parentId === selectedFolderId),
    [folders, selectedFolderId]
  );

  const notesInFolder = useMemo(() => {
    const base = rows.filter(
      (r) => (note2folder[r.id] ?? null) === selectedFolderId
    );
    if (!q.trim()) return base.sort((a, b) => b.updatedAt - a.updatedAt);
    const qq = q.toLowerCase();
    return base
      .filter(
        (r) =>
          (r.title || "").toLowerCase().includes(qq) ||
          r.tags.join(" ").toLowerCase().includes(qq)
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [rows, note2folder, selectedFolderId, q]);

  // --------- Breadcrumb ----------
  const id2folder = useMemo(() => {
    const m = new Map<string, Folder>();
    for (const f of folders) m.set(f.id, f);
    return m;
  }, [folders]);

  const breadcrumb: Array<{ id: string | null; name: string }> = useMemo(() => {
    const trail: Array<{ id: string | null; name: string }> = [
      { id: null, name: "Toutes les notes" },
    ];
    let cur = selectedFolderId ? id2folder.get(selectedFolderId) || null : null;
    const stack: Array<{ id: string | null; name: string }> = [];
    while (cur) {
      stack.push({ id: cur.id, name: cur.name });
      cur = cur.parentId ? id2folder.get(cur.parentId) || null : null;
    }
    return trail.concat(stack.reverse());
  }, [selectedFolderId, id2folder]);

  const goBack = () => {
    if (!selectedFolderId) return;
    const current = id2folder.get(selectedFolderId);
    setSelectedFolderId(current?.parentId ?? null);
  };

  // ---------- actions dossiers déclenchées par NotesList ----------
  const handleCreateSubFolder = (parentId: string) => {
    setCreateParentId(parentId);
    setCreateOpen(true);
  };
  const handleRenameFolder = (id: string) => {
    const f = folders.find((x) => x.id === id);
    setRenameId(id);
    setRenameInitial(f?.name || "");
    setRenameOpen(true);
  };
  const handleDeleteFolder = (id: string) => {
    setDeleteFolderId(id);
    setDeleteFolderOpen(true);
  };

  return (
    <div className="min-h-[calc(100svh-72px)] text-slate-900 dark:text-slate-100">
      <style>{BN_FIX}</style>

      {/* En-tête */}
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 lg:py-8">
        <header className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500" />
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40"
                onClick={goBack}
                disabled={!selectedFolderId}
                title="Retour"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <nav className="text-sm flex flex-wrap gap-1">
                {breadcrumb.map((b, i) => (
                  <span
                    key={`${b.id ?? "root"}-${i}`}
                    className="flex items-center gap-1"
                  >
                    {i > 0 && <span className="opacity-60">/</span>}
                    <button
                      className={`px-1 rounded hover:bg-black/5 dark:hover:bg-white/10 ${
                        b.id === selectedFolderId ? "font-semibold" : ""
                      }`}
                      onClick={() => setSelectedFolderId(b.id)}
                    >
                      {b.name}
                    </button>
                  </span>
                ))}
              </nav>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[auto_auto,1fr] items-center">
              <button
                onClick={() => {
                  setCreateParentId(selectedFolderId);
                  setCreateOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-white/10"
                title="Créer un dossier"
              >
                <FolderPlus className="w-4 h-4" /> Nouveau dossier
              </button>

              <button
                onClick={openNew}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-95"
              >
                <Plus className="w-4 h-4" /> Nouvelle note
              </button>

              <div className="relative">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-full rounded-xl bg-white dark:bg-slate-800 border border-black/20 dark:border-white/10 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/40"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
              </div>
            </div>
          </div>
        </header>

        {/* EXPLORATEUR : Dossiers & Notes alignés */}
        <div className="mt-6">
          <NotesList
            folders={childFolders} // affichage du niveau courant
            allFolders={folders} // ⬅️ arbre complet pour le modal
            notes={notesInFolder}
            loading={loadingList}
            onOpenNote={(id) => void openEdit(id)}
            onShareNote={(id) => void shareNote(id)}
            onDeleteNote={(id) => setDeleteNoteId(id)}
            onOpenFolder={(id) => setSelectedFolderId(id)}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
            onCreateSubFolder={handleCreateSubFolder}
            onDropNoteToFolder={(noteId, folderId) =>
              void setNoteFolderId(noteId, folderId).then(async () => {
                const map = await listNoteFolderMap();
                setNote2folder(map);
              })
            }
          />
        </div>
      </div>

      {/* Éditeur plein écran */}
      {editorOpen && (
        <EditorFullScreen
          key={`fs-${editorKey}`}
          title={title}
          setTitle={setTitle}
          seedDoc={seedDoc}
          bnStyle={bnStyle}
          onReady={onEditorReady}
          onSave={() => void handleSave(true)}
          onClose={closeEditor}
          tempUploadsRef={tempUploadsRef}
        />
      )}

      {/* Suppression note */}
      <ConfirmModal
        open={!!deleteNoteId}
        title="Supprimer la note ?"
        message="Cette action est définitive."
        confirmLabel="Supprimer"
        tone="danger"
        onCancel={() => setDeleteNoteId(null)}
        onConfirm={() => {
          if (deleteNoteId) void reallyDeleteNote(deleteNoteId);
          setDeleteNoteId(null);
        }}
      />

      {/* Nouveau dossier */}
      <PromptModal
        open={createOpen}
        title="Nouveau dossier"
        placeholder="Nom du dossier…"
        initial=""
        confirmLabel="Créer"
        onCancel={() => setCreateOpen(false)}
        onConfirm={async (name) => {
          if (!name) return setCreateOpen(false);
          await createFolder({ name, parentId: createParentId ?? null });
          setCreateOpen(false);
          await refreshFolders();
          toast("Dossier créé", "success");
        }}
      />

      {/* Renommer dossier */}
      <PromptModal
        open={renameOpen}
        title="Renommer le dossier"
        placeholder="Nouveau nom…"
        initial={renameInitial}
        confirmLabel="Renommer"
        onCancel={() => setRenameOpen(false)}
        onConfirm={async (name) => {
          if (!renameId) return setRenameOpen(false);
          await renameFolder(renameId, name || "Dossier");
          setRenameOpen(false);
          await refreshFolders();
          toast("Dossier renommé", "success");
        }}
      />

      {/* Supprimer dossier */}
      <ConfirmModal
        open={deleteFolderOpen}
        title="Supprimer le dossier ?"
        message="Le dossier et ses sous-dossiers seront supprimés. Les notes ne sont pas supprimées : elles seront replacées à la racine."
        confirmLabel="Supprimer"
        tone="danger"
        onCancel={() => setDeleteFolderOpen(false)}
        onConfirm={async () => {
          if (!deleteFolderId) return setDeleteFolderOpen(false);
          await deleteFolder(deleteFolderId);
          setDeleteFolderOpen(false);
          await refreshFolders();
          if (selectedFolderId === deleteFolderId) setSelectedFolderId(null);
          toast("Dossier supprimé", "success");
        }}
      />
    </div>
  );
}
