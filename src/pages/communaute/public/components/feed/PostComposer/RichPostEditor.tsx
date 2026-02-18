// src/pages/communaute/public/components/feed/PostComposer/RichPostEditor.tsx
import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Smile,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Palette,
  Image as ImageIcon,
  Video as VideoIcon,
} from "lucide-react";
import { TEXT_COLORS, IMAGE_ACCEPT, VIDEO_ACCEPT } from "./constants";
import EmojiPicker from "./EmojiPicker";

type RichPostEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onSelectImages?: (files: File[]) => void;
  onSelectVideos?: (files: File[]) => void;
};

export default function RichPostEditor({
  value,
  onChange,
  placeholder = "Quoi de neuf ?",
  onSelectImages,
  onSelectVideos,
}: RichPostEditorProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      Color.configure({ types: ["textStyle"] }),
      TextStyle,
      Underline,
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const toggle = (fn: () => void) => {
    if (!editor) return;
    fn();
    editor.chain().focus().run();
  };

  const onEmojiPick = (emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
    setEmojiOpen(false);
  };

  const onImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    onSelectImages?.(Array.from(e.target.files));
    e.target.value = "";
  };

  const onVideoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    onSelectVideos?.(Array.from(e.target.files));
    e.target.value = "";
  };

  return (
    <div className="rounded-2xl bg-white/95 dark:bg-slate-900/70 ring-1 ring-black/10 dark:ring-white/10 overflow-hidden">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-100/70 dark:border-slate-700/40">
        {/* emoji */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setEmojiOpen((v) => !v);
              setColorOpen(false);
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Smile className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-slate-500 dark:text-slate-200">
              Emoji
            </span>
          </button>
          {emojiOpen ? (
            <div className="absolute top-8 left-0 z-40">
              <EmojiPicker
                onPick={onEmojiPick}
                onClose={() => setEmojiOpen(false)}
              />
            </div>
          ) : null}
        </div>

        {/* text styles */}
        <button
          type="button"
          onClick={() => toggle(() => editor?.chain().toggleBold().run())}
          className={`inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-black/5 dark:hover:bg-white/10 ${
            editor?.isActive("bold") ? "bg-black/5 dark:bg-white/10" : ""
          }`}
          title="Gras"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => toggle(() => editor?.chain().toggleItalic().run())}
          className={`inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-black/5 dark:hover:bg-white/10 ${
            editor?.isActive("italic") ? "bg-black/5 dark:bg-white/10" : ""
          }`}
          title="Italique"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => toggle(() => editor?.chain().toggleUnderline().run())}
          className={`inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-black/5 dark:hover:bg-white/10 ${
            editor?.isActive("underline") ? "bg-black/5 dark:bg-white/10" : ""
          }`}
          title="Souligné"
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>

        {/* couleurs */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setColorOpen((v) => !v);
              setEmojiOpen(false);
            }}
            className="inline-flex items-center gap-1 h-7 px-2 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Palette className="h-4 w-4" />
            <span className="text-xs text-slate-500 dark:text-slate-200">
              Couleur
            </span>
          </button>
          {colorOpen ? (
            <div className="absolute top-8 left-0 z-30 flex gap-2 rounded-lg bg-white/95 dark:bg-slate-900/95 shadow-lg ring-1 ring-black/10 dark:ring-white/10 p-2 max-w-xs flex-wrap">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    editor?.chain().focus().setColor(c.value).run();
                    setColorOpen(false);
                  }}
                  className="h-6 w-6 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* médias */}
        <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
          <ImageIcon className="h-4 w-4" />
          <span className="text-xs text-slate-500 dark:text-slate-200">
            Image
          </span>
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            hidden
            onChange={onImageInput}
          />
        </label>

        <label className="inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
          <VideoIcon className="h-4 w-4" />
          <span className="text-xs text-slate-500 dark:text-slate-200">
            Vidéo
          </span>
          <input
            type="file"
            accept={VIDEO_ACCEPT}
            multiple
            hidden
            onChange={onVideoInput}
          />
        </label>
      </div>

      {/* éditeur */}
      <EditorContent
        editor={editor}
        className="min-h-[220px] max-h-[400px] overflow-auto px-4 py-3 prose prose-sm max-w-none dark:prose-invert focus:outline-none"
        style={{ outline: "none", boxShadow: "none", border: "none" }}
      />
      {/* tiptap met le focus sur .ProseMirror → on neutralise */}
      <style>{`
        .ProseMirror:focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}
