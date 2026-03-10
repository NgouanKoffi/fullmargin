import { FileText } from "lucide-react";
import React, { useEffect, useState } from "react";
import useOnScreen from "../utils/useOnScreen";
import { extractPreviewFromDoc, getPreviewCache } from "../utils/preview";
import type { Rec, Preview } from "../utils/preview";
import { getNote } from "../api";

export default function NotePreview({ id }: { id: string }) {
  const { ref, visible } = useOnScreen<HTMLDivElement>(0.1);
  const [preview, setPreview] = useState<Preview | null>(
    () => getPreviewCache().get(id) ?? null
  );
  const [loading, setLoading] = useState<boolean>(!preview);

  useEffect(() => {
    let aborted = false;
    if (!visible || preview != null) return;

    (async () => {
      try {
        setLoading(true);
        const full = await getNote(id);
        const p = extractPreviewFromDoc((full as Rec).doc);
        if (!aborted) {
          getPreviewCache().set(id, p);
          setPreview(p);
        }
      } catch {
        if (!aborted) {
          // valeur conforme au type Preview → pas de "any"
          setPreview({ text: "—", imageUrl: undefined });
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [id, visible, preview]);

  const clampStyle: React.CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  return (
    <div ref={ref} className="min-w-0">
      {loading ? (
        <>
          <div className="h-28 sm:h-32 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-black/10 dark:border-white/10" />
          <div className="mt-2 space-y-2">
            <div className="h-3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-3 rounded bg-slate-200 dark:bg-slate-800 animate-pulse w-11/12" />
          </div>
        </>
      ) : (
        <>
          <div className="relative h-28 sm:h-32 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-slate-100 dark:bg-slate-800">
            {preview?.imageUrl ? (
              <>
                <img
                  src={preview.imageUrl}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/10" />
              </>
            ) : (
              <div className="h-full w-full grid place-items-center text-slate-400 dark:text-slate-500">
                <FileText className="w-6 h-6" />
              </div>
            )}
          </div>

          {preview?.text && (
            <p
              className="mt-2 text-[13px] leading-5 text-slate-700 dark:text-slate-300"
              style={clampStyle}
              title={preview.text}
            >
              {preview.text}
            </p>
          )}
        </>
      )}
    </div>
  );
}
