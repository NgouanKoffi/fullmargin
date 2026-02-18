// src/pages/communaute/private/community-details/tabs/Formations/CoursePlayer/ResourceViewer.tsx
import { useEffect, useMemo, useState } from "react";
import { Maximize2, Link2 } from "lucide-react";

import { API_BASE } from "../../../lib/api";
import { authHeaders } from "./coursePlayerUtils";
import type { CurriculumItem } from "./coursePlayerTypes";

/* ============ Utils viewer ============ */

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);

    if (
      u.hostname.includes("youtube.com") ||
      u.hostname.includes("youtu.be") ||
      u.hostname.includes("youtube-nocookie.com")
    ) {
      const v = u.searchParams.get("v");
      if (v) return v;

      if (u.hostname.includes("youtu.be")) {
        const id = u.pathname.replace("/", "");
        return id || null;
      }

      if (u.pathname.startsWith("/embed/")) {
        const id = u.pathname.replace("/embed/", "");
        return id || null;
      }

      if (u.pathname.startsWith("/shorts/")) {
        const id = u.pathname.replace("/shorts/", "");
        return id || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function isDirectVideoUrl(url: string) {
  const lower = (url || "").toLowerCase();
  return (
    lower.endsWith(".mp4") ||
    lower.includes(".mp4?") ||
    lower.endsWith(".webm") ||
    lower.includes(".webm?") ||
    lower.endsWith(".mov") ||
    lower.includes(".mov?")
  );
}

function isBunnyLikely(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host.includes("b-cdn.net") || host.includes("bunnycdn.com");
  } catch {
    return false;
  }
}

function ViewerLoader({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center text-slate-200 text-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
        <p>{message}</p>
      </div>
    </div>
  );
}

/* ============ ResourceViewer ============ */

type ResourceViewerProps = {
  courseId: string;
  item: CurriculumItem;
  onRequestFullscreen: () => void;
  fullscreen?: boolean;
};

export function ResourceViewer({
  courseId,
  item,
  onRequestFullscreen,
  fullscreen = false,
}: ResourceViewerProps) {
  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const url = item.url || "";
  const isLink = item.subtype === "link";
  const isImage = item.type === "image" || item.subtype === "image";
  const isPdf = item.type === "pdf" && !isImage;

  // YouTube embed (fallback)
  const youtubeEmbedUrl = useMemo(() => {
    if (!url) return null;
    const id = extractYoutubeId(url);
    if (!id) return null;

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      iv_load_policy: "3",
      playsinline: "1",
      enablejsapi: "1",
      origin,
      autoplay: "0",
    });

    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  }, [url]);

  // ✅ Video directe (MP4/WebM/Mov) -> parfait pour Bunny : 0 UI externe
  const isDirectVideo = useMemo(() => isDirectVideoUrl(url), [url]);
  const isBunny = useMemo(() => isBunnyLikely(url), [url]);

  // Charger éventuellement base64 pour PDF interne
  useEffect(() => {
    if (!courseId || !item) return;

    // Vidéos & liens → pas de fetch base64
    if (item.type === "video" || isLink) {
      setFileSrc(null);
      setFileError(null);
      setFileLoading(false);
      return;
    }

    // Image interne → URL directe
    if (isImage) {
      if (!item.url) {
        setFileSrc(null);
        setFileError("Image introuvable.");
        setFileLoading(false);
      } else {
        setFileSrc(item.url);
        setFileError(null);
        setFileLoading(false);
      }
      return;
    }

    // PDF interne sans URL → base64
    if (!isPdf) {
      setFileSrc(null);
      setFileError(null);
      setFileLoading(false);
      return;
    }

    let cancel = false;
    (async () => {
      try {
        setFileLoading(true);
        setFileError(null);

        const res = await fetch(
          `${API_BASE}/communaute/courses/${encodeURIComponent(
            courseId
          )}/items/${encodeURIComponent(item.id)}/pdf/base64`,
          { headers: { ...authHeaders() }, cache: "no-store" }
        );

        const j = await res.json().catch(() => null);
        if (cancel) return;

        if (!res.ok || !j || j.ok === false) {
          setFileError("Impossible d'afficher ce document.");
          setFileSrc(null);
          return;
        }

        const data = j.data;
        if (!data) {
          setFileError("Document vide.");
          setFileSrc(null);
          return;
        }

        setFileSrc(`data:application/pdf;base64,${data}`);
      } catch {
        if (!cancel) {
          setFileError("Erreur réseau pendant le chargement du document.");
          setFileSrc(null);
        }
      } finally {
        if (!cancel) setFileLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [courseId, item, isPdf, isImage, isLink]);

  const outerClass = fullscreen
    ? "absolute inset-0 bg-black"
    : "mt-2 w-full rounded-xl overflow-hidden ring-1 ring-slate-200/70 dark:ring-white/10 bg-black";

  const innerClass = fullscreen
    ? "absolute inset-0 w-full h-full"
    : "relative w-full aspect-video max-h-[60vh]";

  const renderContent = (isFull: boolean) => {
    // ✅ 0) Vidéo directe (Bunny MP4 recommandé)
    if ((item.type === "video" || isDirectVideo) && url && isDirectVideo) {
      return (
        <video
          key={url + (isFull ? "-full" : "-normal")}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          src={url}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload noremoteplayback noplaybackrate"
        />
      );
    }

    // 1) YouTube (fallback)
    if (youtubeEmbedUrl) {
      return (
        <iframe
          key={youtubeEmbedUrl + (isFull ? "-full" : "-normal")}
          className="absolute inset-0 w-full h-full"
          src={youtubeEmbedUrl}
          title={item.title || "Vidéo YouTube"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    // 2) Vidéo “classique” non-mp4 (si jamais)
    if (item.type === "video" && url) {
      // si c'est un lien Bunny mais pas mp4 (ex: m3u8), on affiche un message clair
      if (isBunny && !isDirectVideo) {
        return (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-slate-200 text-sm">
            Cette vidéo semble être une URL Bunny (HLS). Pour lecture sans
            dépendance, utilise un lien MP4 direct dans item.url.
          </div>
        );
      }

      return (
        <video
          key={url + (isFull ? "-full" : "-normal")}
          className="absolute inset-0 w-full h-full object-contain bg-black"
          src={url}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload noremoteplayback noplaybackrate"
        />
      );
    }

    // 3) Image
    if (isImage || (isLink && url && item.type === "image")) {
      if (fileLoading) return <ViewerLoader message="Chargement de l'image…" />;
      if (fileError) {
        return (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-slate-200 text-sm">
            {fileError}
          </div>
        );
      }

      const src = fileSrc || url;
      if (src) {
        return (
          <img
            key={item.id + (isFull ? "-full" : "-normal")}
            src={src}
            alt={item.title}
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />
        );
      }

      return (
        <div className="absolute inset-0 grid place-items-center text-slate-200 text-sm">
          Aucune image à afficher.
        </div>
      );
    }

    // 4) PDF
    if (isPdf || (isLink && url && item.type === "pdf")) {
      if (fileLoading)
        return <ViewerLoader message="Chargement du document…" />;
      if (fileError) {
        return (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-slate-200 text-sm">
            {fileError}
          </div>
        );
      }

      const src = fileSrc || url;
      if (src) {
        return (
          <iframe
            key={item.id + (isFull ? "-full" : "-normal")}
            className="absolute inset-0 w-full h-full"
            src={src}
            title={item.title}
          />
        );
      }

      return (
        <div className="absolute inset-0 grid place-items-center text-slate-200 text-sm">
          Aucun document à afficher.
        </div>
      );
    }

    // 5) Lien non prévisualisable
    if (isLink && url) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-slate-100 text-sm">
          <p>Cette ressource ne peut pas être prévisualisée ici.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-4 py-2 text-sm font-medium shadow"
          >
            <Link2 className="h-4 w-4" />
            Ouvrir le lien dans un nouvel onglet
          </a>
          <div className="max-w-full break-all opacity-70 text-xs">{url}</div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 grid place-items-center text-slate-300 text-sm">
        Aucun contenu à afficher pour cet item.
      </div>
    );
  };

  return (
    <div className={outerClass}>
      <div className={innerClass}>
        {!fullscreen && (
          <button
            type="button"
            onClick={onRequestFullscreen}
            className="absolute top-2 right-2 z-20 inline-flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white p-1.5"
            title="Afficher en plein écran"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}

        {renderContent(fullscreen)}
      </div>
    </div>
  );
}
