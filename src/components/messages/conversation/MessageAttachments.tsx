import { useEffect, useState } from "react";
import {
  FileText,
  Video,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { API_BASE } from "../../../lib/api";
import type { ChatAttachment } from "./messages.types";

/* ---------- Helpers ---------- */

function formatSize(size?: number): string {
  if (!size || size <= 0) return "";
  if (size < 1024) return `${size} o`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} Ko`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} Mo`;
}

/**
 * Certains noms arrivent mal encodés (UTF-8 lu en Latin-1 → MÃ©taverse, etc.).
 * On tente de les “réparer” proprement pour l’affichage / le téléchargement.
 */
function normalizeFilename(raw?: string | null): string {
  if (!raw) return "";
  const name = raw.toString();

  if (!/[ÃÂ]/.test(name)) return name;

  try {
    const bytes = Uint8Array.from([...name].map((c) => c.charCodeAt(0)));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded;
  } catch {
    return name;
  }
}

function base64ToBlobUrl(base64: string, mime = "application/pdf"): string {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mime });
  return URL.createObjectURL(blob);
}

/* ---------- Types état viewer ---------- */

type PdfViewerState = {
  attachment: ChatAttachment;
  loading: boolean;
  error?: string;
  blobUrl?: string;
};

type Props = {
  attachments?: ChatAttachment[];
};

export default function MessageAttachments({ attachments }: Props) {
  const [viewer, setViewer] = useState<PdfViewerState | null>(null);
  const [imageViewerIndex, setImageViewerIndex] = useState<number | null>(null);

  // cleanup blob
  useEffect(() => {
    return () => {
      if (viewer?.blobUrl) {
        URL.revokeObjectURL(viewer.blobUrl);
      }
    };
  }, [viewer?.blobUrl]);

  const list = Array.isArray(attachments)
    ? attachments.filter((a) => a && (a.url || a.publicId))
    : [];

  if (!list.length) return null;

  // 🔎 Séparer les types pour l’affichage
  const images: ChatAttachment[] = [];
  const videos: ChatAttachment[] = [];
  const pdfs: ChatAttachment[] = [];
  const others: ChatAttachment[] = [];

  list.forEach((att) => {
    const kind = (att.kind || "").toLowerCase();
    const mime = att.mimeType || "";
    const isImage = kind === "image" || mime.startsWith("image/");
    const isVideo = kind === "video" || mime.startsWith("video/");
    const isPdf = kind === "pdf" || mime === "application/pdf";

    if (isImage) images.push(att);
    else if (isVideo) videos.push(att);
    else if (isPdf) pdfs.push(att);
    else others.push(att);
  });

  /* ---------- PDF viewer ---------- */

  const openPdfViewer = (att: ChatAttachment) => {
    if (!att.publicId) {
      if (att.url) {
        window.open(att.url, "_blank", "noopener,noreferrer");
      }
      return;
    }

    setViewer((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return { attachment: att, loading: true };
    });

    const publicId = encodeURIComponent(att.publicId);
    const url = `${API_BASE}/communaute/discussions/attachments/${publicId}/pdf/base64`;

    (async () => {
      try {
        const res = await fetch(url, { method: "GET" });
        const j: any = await res.json().catch(() => null);

        if (!res.ok || !j || j.ok === false || !j.data) {
          throw new Error(j?.error || "Impossible de charger le document.");
        }

        const blobUrl = base64ToBlobUrl(
          j.data,
          att.mimeType || "application/pdf"
        );

        setViewer((prev) =>
          prev && prev.attachment === att
            ? { ...prev, blobUrl, loading: false, error: undefined }
            : prev
        );
      } catch (err) {
        console.error("[MessageAttachments] Erreur PDF:", err);
        setViewer((prev) =>
          prev && prev.attachment === att
            ? {
                ...prev,
                loading: false,
                error: "Impossible d'afficher ce document.",
              }
            : prev
        );
      }
    })();
  };

  const closePdfViewer = () => {
    setViewer((prev) => {
      if (prev?.blobUrl) URL.revokeObjectURL(prev.blobUrl);
      return null;
    });
  };

  const handleDownloadCurrent = () => {
    if (!viewer || !viewer.blobUrl) return;

    const fileName =
      normalizeFilename(viewer.attachment.name) || "document.pdf";

    const link = document.createElement("a");
    link.href = viewer.blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ---------- Image lightbox ---------- */

  const openImageLightbox = (index: number) => {
    if (!images.length) return;
    setImageViewerIndex(index);
  };

  const closeImageLightbox = () => {
    setImageViewerIndex(null);
  };

  const showPrevImage = () => {
    if (imageViewerIndex === null || !images.length) return;
    setImageViewerIndex((imageViewerIndex - 1 + images.length) % images.length);
  };

  const showNextImage = () => {
    if (imageViewerIndex === null || !images.length) return;
    setImageViewerIndex((imageViewerIndex + 1) % images.length);
  };

  return (
    <>
      {/* MÉDIAS DANS LA BULLE */}
      <div className="mt-2 space-y-2">
        {/* 🖼️ IMAGES EN GRID + LIGHTBOX AU CLIC */}
        {images.length > 0 && (
          <div
            className={
              images.length === 1
                ? "w-full overflow-hidden rounded-xl"
                : "grid grid-cols-2 sm:grid-cols-3 gap-1 rounded-xl overflow-hidden"
            }
          >
            {images.map((att, idx) => {
              if (!att.url) return null;
              const label = normalizeFilename(att.name) || "Image";
              const isFirst = images.length > 1 && idx === 0;

              const containerClasses =
                images.length === 1
                  ? "relative w-full h-52 sm:h-64 cursor-pointer"
                  : [
                      "relative overflow-hidden bg-black/10 dark:bg-white/10 cursor-pointer",
                      isFirst
                        ? "col-span-2 sm:col-span-3 h-40 sm:h-52"
                        : "h-24 sm:h-28",
                    ].join(" ");

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openImageLightbox(idx);
                  }}
                  className={containerClasses}
                  title={label}
                >
                  <img
                    src={att.url}
                    alt={label}
                    className="w-full h-full object-cover"
                  />
                  {att.size && (
                    <span className="absolute bottom-1 right-1 rounded-full bg-black/60 text-[10px] text-white px-2 py-[2px]">
                      {formatSize(att.size)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 🎥 VIDÉOS (lecteur direct) */}
        {videos.length > 0 && (
          <div className="space-y-2">
            {videos.map((att, idx) => {
              if (!att.url) return null;
              const label = normalizeFilename(att.name) || "Vidéo";

              return (
                <div
                  key={idx}
                  className="w-full rounded-xl overflow-hidden bg-black/10 dark:bg-white/10"
                >
                  <video
                    src={att.url}
                    controls
                    className="w-full max-h-64 bg-black"
                  />
                  <div className="flex items-center justify-between px-2 py-1.5 text-[11px] text-slate-200 bg-black/70">
                    <div className="flex items-center gap-1 min-w-0">
                      <Video className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </div>
                    {att.size && (
                      <span className="ml-2 shrink-0 opacity-80">
                        {formatSize(att.size)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 📄 PDF : bouton + viewer interne */}
        {pdfs.length > 0 && (
          <div className="space-y-1">
            {pdfs.map((att, idx) => {
              const label = normalizeFilename(att.name) || "Document PDF";
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openPdfViewer(att);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 text-xs"
                >
                  <div className="flex items-center gap-2 w-full">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="block truncate">{label}</span>
                    </div>
                    {att.size ? (
                      <span className="ml-2 shrink-0 opacity-70">
                        {formatSize(att.size)}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 📎 AUTRES FICHIERS */}
        {others.length > 0 && (
          <div className="space-y-1">
            {others.map((att, idx) => {
              if (!att.url) return null;
              const label = normalizeFilename(att.name) || "Pièce jointe";
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(att.url!, "_blank", "noopener,noreferrer");
                  }}
                  className="w-full px-2.5 py-1.5 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 text-xs"
                >
                  <div className="flex items-center gap-2 w-full">
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="block truncate">{label}</span>
                    </div>
                    {att.size ? (
                      <span className="ml-2 shrink-0 opacity-70">
                        {formatSize(att.size)}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 🔍 LIGHTBOX IMAGES : MODAL CENTRÉ + SLIDER EN BAS */}
      {imageViewerIndex !== null && images[imageViewerIndex] && (
        <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm flex items-center justify-center px-3 py-6">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#05060a] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 text-slate-100">
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">
                  {normalizeFilename(images[imageViewerIndex].name) || "Image"}
                </span>
                <span className="text-[11px] opacity-70">
                  {imageViewerIndex + 1} / {images.length}
                </span>
              </div>

              <button
                type="button"
                onClick={closeImageLightbox}
                className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 p-1.5"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image centrale */}
            <div className="flex-1 flex items-center justify-center bg-black">
              <img
                src={images[imageViewerIndex].url!}
                alt={
                  normalizeFilename(images[imageViewerIndex].name) || "Image"
                }
                className="max-h-[70vh] max-w-full object-contain mx-auto"
              />
            </div>

            {/* Barre de navigation en bas */}
            {images.length > 1 && (
              <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-white/10 bg-black/60 text-slate-100 text-xs">
                <button
                  type="button"
                  onClick={showPrevImage}
                  className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg:white/20 px-3 py-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                </button>

                <span className="text-[11px] opacity-80">
                  Image {imageViewerIndex + 1} sur {images.length}
                </span>

                <button
                  type="button"
                  onClick={showNextImage}
                  className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 px-3 py-1"
                >
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OVERLAY VIEWER PDF */}
      {viewer && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 text-slate-100 border-b border-white/10">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">
                {normalizeFilename(viewer.attachment.name) || "Document PDF"}
              </span>
              <span className="text-[11px] opacity-70">
                Document PDF – discussion
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCurrent}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-3 py-1 text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger
              </button>

              <button
                type="button"
                onClick={closePdfViewer}
                className="inline-flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 p-1.5"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div className="flex-1 relative">
            {viewer.loading && !viewer.blobUrl && !viewer.error && (
              <div className="absolute inset-0 grid place-items-center text-slate-200 text-sm">
                Chargement du document…
              </div>
            )}

            {viewer.error && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center text-slate-200 text-sm">
                {viewer.error}
              </div>
            )}

            {viewer.blobUrl && !viewer.error && (
              <iframe
                src={viewer.blobUrl}
                title={normalizeFilename(viewer.attachment.name) || "PDF"}
                className="absolute inset-0 w-full h-full"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
