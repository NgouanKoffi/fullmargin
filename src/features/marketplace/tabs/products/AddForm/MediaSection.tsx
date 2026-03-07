// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\products\AddForm\MediaSection.tsx
import { useState } from "react";
import { Card, CardHeader, Label, DropZone } from "./ui";
import { Image as ImageIcon, File as FileIcon } from "lucide-react";

export default function MediaSection({
  imageUrl,
  fileName,
  gallery = [],
  videoUrls = [],
  onChangeImageUrl,
  onChangeFile,
  onChangeGallery,
  onChangeVideoUrls,
}: {
  imageUrl?: string;
  fileName?: string;
  /** Galerie images (0 → 5) */
  gallery?: string[];
  /** Vidéos (liens externes uniquement) */
  videoUrls?: string[];
  onChangeImageUrl: (url?: string) => void;
  onChangeFile: (f: {
    file?: File | null;
    name?: string;
    mime?: string;
  }) => void;
  onChangeGallery?: (images: string[]) => void;
  onChangeVideoUrls?: (urls: string[]) => void;
}) {
  const [videoLinkInput, setVideoLinkInput] = useState("");

  function readAsDataURL(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = () => rej(fr.error);
      fr.onload = () => res(String(fr.result));
      fr.readAsDataURL(file);
    });
  }

  const maxGallery = 5;
  const maxVideos = 3;

  return (
    <Card>
      <CardHeader
        title="Médias & Fichier"
        subtitle="Visuel produit, galerie, vidéos & fichier téléchargeable"
      />

      <div className="mt-4 space-y-6">
        {/* ---- Image principale ---- */}
        <div>
          <Label>Visuel (image principale)</Label>
          <DropZone
            icon={<ImageIcon className="w-5 h-5" />}
            text="Clique pour choisir une image"
          >
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.currentTarget.files?.[0];
                if (!f) return;
                const dataUrl = await readAsDataURL(f);
                onChangeImageUrl(dataUrl);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Téléverser une image principale"
            />
          </DropZone>

          {imageUrl && (
            <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-black/10 dark:ring-white/10">
              <img
                src={imageUrl}
                alt="aperçu"
                className="w-full h-44 object-cover"
              />
            </div>
          )}
        </div>

        {/* ---- Galerie d’images ---- */}
        <div>
          <Label>Galerie d’images (jusqu’à {maxGallery})</Label>
          <DropZone
            icon={<ImageIcon className="w-5 h-5" />}
            text="Clique pour ajouter des images (max 5)"
          >
            <input
              type="file"
              accept="image/*"
              multiple
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Téléverser des images pour la galerie"
              onChange={async (e) => {
                if (!onChangeGallery) return;
                const files = Array.from(e.currentTarget.files || []);
                if (!files.length) return;

                const remaining = Math.max(0, maxGallery - gallery.length);
                if (remaining <= 0) return;

                const slice = files.slice(0, remaining);
                const dataUrls = await Promise.all(
                  slice.map((f) => readAsDataURL(f))
                );

                onChangeGallery([...gallery, ...dataUrls]);
                e.currentTarget.value = "";
              }}
            />
          </DropZone>
        </div>

        {/* ---- Vidéos (liens externes uniquement) ---- */}
        <div>
          <Label>Vidéos de présentation (liens externes, facultatif)</Label>
          <p className="text-xs opacity-70 mb-2">
            Ajoute jusqu’à {maxVideos} liens vers des vidéos (YouTube, Vimeo,
            etc.). Ces vidéos seront affichées sur la page publique du produit.
          </p>

          {/* Lien vidéo externe */}
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={videoLinkInput}
              onChange={(e) => setVideoLinkInput(e.target.value)}
              placeholder="https://youtu.be/... ou autre lien vidéo"
              className="flex-1 rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/60"
            />
            <button
              type="button"
              onClick={() => {
                if (!onChangeVideoUrls) return;
                const url = videoLinkInput.trim();
                if (!url) return;
                if (videoUrls.length >= maxVideos) return;
                onChangeVideoUrls([...videoUrls, url]);
                setVideoLinkInput("");
              }}
              className="shrink-0 px-3 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700"
            >
              Ajouter
            </button>
          </div>
        </div>

        {/* ---- Aperçu galerie + vidéos ---- */}
        {(gallery.length > 0 || videoUrls.length > 0) && (
          <div>
            <div className="mb-2">
              <Label>Aperçu de la galerie</Label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Images */}
              {gallery.map((url, idx) => (
                <div
                  key={`img-${idx}`}
                  className="relative group rounded-lg overflow-hidden ring-1 ring-black/10 dark:ring-white/10"
                >
                  <img
                    src={url}
                    alt={`image ${idx + 1}`}
                    className="w-full h-24 object-cover"
                  />
                  {onChangeGallery && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = gallery.filter((_, i) => i !== idx);
                        onChangeGallery(next);
                      }}
                      className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-xs
                                 bg-black/60 text-white opacity-0 group-hover:opacity-100
                                 transition-opacity"
                      aria-label="Retirer cette image"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {/* Vidéos (liens) */}
              {videoUrls.map((url, idx) => (
                <div
                  key={`vid-${idx}`}
                  className="relative group rounded-lg overflow-hidden ring-1 ring-black/10 dark:ring-white/10 bg-black"
                >
                  <div className="w-full h-24 flex items-center justify-center text-xs text-white px-2 text-center">
                    Lien vidéo
                    <br />
                    <span className="line-clamp-2 break-all opacity-80">
                      {url}
                    </span>
                  </div>

                  {onChangeVideoUrls && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = videoUrls.filter((_, i) => i !== idx);
                        onChangeVideoUrls(next);
                      }}
                      className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-xs
                                 bg-black/70 text-white opacity-0 group-hover:opacity-100
                                 transition-opacity"
                      aria-label="Retirer cette vidéo"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Fichier vendu ---- */}
        <div>
          <Label>Fichier produit</Label>
          <DropZone
            icon={<FileIcon className="w-5 h-5" />}
            text="Clique pour choisir un fichier (.pdf, .ex4/.ex5/.mq4/.mq5, .zip, .xlsx, etc.)"
          >
            <input
              type="file"
              accept=".pdf,.zip,.rar,.7z,.ex4,.ex5,.mq4,.mq5,.xlsx,.xls,.csv,application/pdf,application/zip,*/*"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0] || null;
                if (!f) {
                  onChangeFile({
                    file: null,
                    name: undefined,
                    mime: undefined,
                  });
                  return;
                }
                onChangeFile({
                  file: f,
                  name: f.name,
                  mime: f.type || "application/octet-stream",
                });
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Téléverser un fichier"
            />
          </DropZone>

          {fileName && (
            <p className="mt-2 text-xs opacity-70">
              Fichier sélectionné :{" "}
              <span className="font-medium">{fileName}</span>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
