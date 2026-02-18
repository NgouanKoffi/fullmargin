// src/pages/profil/components/ProfileHeader.tsx
import { useState, useCallback, useEffect } from "react";
import { HiUserCircle, HiPhoto, HiCamera, HiEnvelope } from "react-icons/hi2";
import RoleBadge from "./RoleBadge";
import { notifyError } from "../../../components/Notification";

type Props = {
  coverUrl?: string;
  avatarUrl?: string;
  fullName?: string;
  email?: string;
  roles: string[];
  /** Peut être synchrone ou async (Promise) */
  onUploadCover: (f: File) => void | Promise<void>;
  /** Peut être synchrone ou async (Promise) */
  onUploadAvatar: (f: File) => void | Promise<void>;
};

const MAX_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPT = ALLOWED_TYPES.join(",");

// petit type-guard pour détecter les Promises avec .finally sans any
function hasFinally(
  v: unknown
): v is { finally(onfinally?: (() => void) | undefined): unknown } {
  return (
    typeof v === "object" &&
    v !== null &&
    "finally" in v &&
    typeof (v as { finally?: unknown }).finally === "function"
  );
}

export default function ProfileHeader({
  coverUrl,
  avatarUrl,
  fullName,
  email,
  roles,
  onUploadCover,
  onUploadAvatar,
}: Props) {
  // Fallback si l’image distante échoue
  const [coverBroken, setCoverBroken] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

  // 🔁 quand l’URL change, on réinitialise le flag "cassé"
  useEffect(() => setCoverBroken(false), [coverUrl]);
  useEffect(() => setAvatarBroken(false), [avatarUrl]);

  // États UI (upload + drag)
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverDragging, setCoverDragging] = useState(false);
  const [avatarDragging, setAvatarDragging] = useState(false);

  const validate = (f: File) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      notifyError("Format non supporté. Utilise JPG, PNG, WEBP ou GIF.");
      return false;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      notifyError(`Fichier trop lourd (>${MAX_MB} Mo).`);
      return false;
    }
    return true;
  };

  /** Gère file input (sync ou async) avec indicateurs de chargement */
  const handleFile =
    (cb: (file: File) => void | Promise<void>, setBusy: (v: boolean) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      e.target.value = ""; // reset pour pouvoir re-sélectionner le même fichier
      if (!validate(f)) return;

      try {
        const r = cb(f);
        if (hasFinally(r)) {
          setBusy(true);
          r.finally(() => setBusy(false));
        }
      } catch {
        setBusy(false);
      }
    };

  /** Gère drag & drop (sync ou async) avec indicateurs de chargement */
  const handleDrop = useCallback(
    (
      ev: React.DragEvent,
      cb: (file: File) => void | Promise<void>,
      setBusy: (v: boolean) => void,
      setDragging: (v: boolean) => void
    ) => {
      ev.preventDefault();
      ev.stopPropagation();
      setDragging(false);
      const f = ev.dataTransfer.files?.[0];
      if (!f || !validate(f)) return;

      try {
        const r = cb(f);
        if (hasFinally(r)) {
          setBusy(true);
          r.finally(() => setBusy(false));
        }
      } catch {
        setBusy(false);
      }
    },
    []
  );

  const handleDragOver = (ev: React.DragEvent) => {
    ev.preventDefault();
  };

  const safeCover = !coverBroken && coverUrl ? coverUrl : undefined;
  const safeAvatar = !avatarBroken && avatarUrl ? avatarUrl : undefined;

  return (
    <section className="mt-6 rounded-3xl border border-skin-border/60 ring-1 ring-skin-border/30 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
      {/* Couverture */}
      <div
        className={[
          "relative group transition-colors",
          coverDragging ? "outline outline-2 outline-fm-primary/50" : "",
        ].join(" ")}
        onDrop={(e) =>
          handleDrop(e, onUploadCover, setCoverUploading, setCoverDragging)
        }
        onDragOver={handleDragOver}
        onDragEnter={() => setCoverDragging(true)}
        onDragLeave={() => setCoverDragging(false)}
      >
        {/* Image de couverture ou fallback */}
        {safeCover ? (
          <img
            key={safeCover} // force le remount quand l’URL change (blob -> https)
            src={safeCover}
            alt={fullName ? `Couverture de ${fullName}` : "Photo de couverture"}
            className="w-full h-56 md:h-64 object-cover"
            loading="lazy"
            decoding="async"
            onError={() => setCoverBroken(true)}
          />
        ) : (
          <div className="w-full h-56 md:h-64 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
        )}

        {/* Bouton changer couverture */}
        <label
          htmlFor="profile-cover-file"
          className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border border-white/20 ring-1 ring-black/20 bg-black/70 text-white hover:bg-black/80 cursor-pointer backdrop-blur-sm disabled:opacity-60"
          title="Changer la photo de couverture"
          aria-busy={coverUploading}
          aria-disabled={coverUploading}
        >
          {coverUploading ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
              Téléversement…
            </span>
          ) : (
            <>
              <HiCamera className="w-4 h-4" />
              Modifier la couverture
            </>
          )}
        </label>
        <input
          id="profile-cover-file"
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={handleFile(onUploadCover, setCoverUploading)}
        />

        {/* Avatar */}
        <div className="absolute left-5 sm:left-7 -bottom-10">
          <div
            className={[
              "relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-xl border border-skin-border/60 transition-colors",
              avatarDragging ? "outline outline-2 outline-fm-primary/50" : "",
            ].join(" ")}
            onDrop={(e) =>
              handleDrop(
                e,
                onUploadAvatar,
                setAvatarUploading,
                setAvatarDragging
              )
            }
            onDragOver={handleDragOver}
            onDragEnter={() => setAvatarDragging(true)}
            onDragLeave={() => setAvatarDragging(false)}
            title="Glisse-dépose une image pour changer l’avatar"
          >
            {safeAvatar ? (
              <img
                key={safeAvatar} // force le remount quand l’URL change (blob -> https)
                src={safeAvatar}
                alt={fullName ? `Avatar de ${fullName}` : "Avatar"}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-skin-muted bg-slate-200 dark:bg-slate-800">
                <HiUserCircle className="w-12 h-12" />
              </div>
            )}

            {/* Overlay "uploading" sur avatar */}
            {avatarUploading && (
              <div className="absolute inset-0 bg-black/35 grid place-items-center">
                <span className="inline-block w-6 h-6 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
              </div>
            )}

            {/* Bouton changer avatar */}
            <label
              htmlFor="profile-avatar-file"
              className="absolute bottom-1 right-1 grid place-items-center w-7 h-7 rounded-full bg-black/70 text-white cursor-pointer hover:bg-black/80 border border-white/20 disabled:opacity-60"
              title="Changer l’avatar"
              aria-label="Changer l’avatar"
              aria-busy={avatarUploading}
              aria-disabled={avatarUploading}
            >
              <HiPhoto className="w-4 h-4" />
            </label>
            <input
              id="profile-avatar-file"
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={handleFile(onUploadAvatar, setAvatarUploading)}
            />
          </div>
        </div>
      </div>

      {/* Infos sous la cover */}
      <div className="px-5 sm:px-7 pt-12 pb-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-skin-base truncate">
                {fullName || "Utilisateur"}
              </h1>
              <div className="flex items-center gap-1">
                {roles.map((r) => (
                  <RoleBadge key={r} role={r} />
                ))}
              </div>
            </div>
            <div className="mt-1 text-sm text-skin-muted inline-flex items-center gap-1">
              <HiEnvelope className="w-4 h-4 opacity-70" />
              {email}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
