// src/pages/communaute/private/community-details/tabs/owner/OwnerPublicView.tsx
import { useMemo, useState } from "react";
import { Mail } from "lucide-react";
import type { OwnerView } from "./OwnerTab";
// adapte le chemin si besoin, mais a priori c'est bien celui-ci :
import ImageLightbox from "../../components/ImageLightbox";

/**
 * Génère un avatar avec les initiales via un service externe
 * (pour les utilisateurs sans vraie photo).
 */
function buildInitialsAvatar(fullName: string): string {
  const cleaned = (fullName || "").trim() || "Utilisateur";
  const bg = "4F46E5"; // violet
  const color = "FFFFFF";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    cleaned
  )}&background=${bg}&color=${color}&size=256&bold=true`;
}

export default function OwnerPublicView({ owner }: { owner: OwnerView }) {
  // Cover : vraie cover si dispo, sinon un joli gradient Unsplash
  const cover = useMemo(
    () =>
      owner.coverUrl ||
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=60",
    [owner.coverUrl]
  );

  // Avatar : vraie photo si dispo, sinon avatar aux initiales
  const avatarSrc = useMemo(
    () => owner.avatarUrl || buildInitialsAvatar(owner.fullName),
    [owner.avatarUrl, owner.fullName]
  );

  // Lightbox pour la photo de profil (une seule image)
  const [lbOpen, setLbOpen] = useState(false);

  return (
    <div className="pb-10">
      {/* 1. Bannière / cover */}
      <div className="rounded-3xl bg-slate-100 dark:bg-slate-900/50 ring-1 ring-slate-100 dark:ring-slate-900/40">
        <div className="relative h-40 sm:h-48 md:h-56 w-full overflow-hidden rounded-3xl">
          <img
            src={cover}
            alt="Bannière du propriétaire"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/30 pointer-events-none" />
        </div>
      </div>

      {/* 2. Bloc infos propriétaire */}
      <div className="mt-6 bg-[#050816]/90 dark:bg-slate-950/80 rounded-3xl ring-1 ring-white/5 px-4 sm:px-6 md:px-8 py-6 sm:py-7">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Avatar cliquable → Lightbox */}
          <button
            type="button"
            onClick={() => setLbOpen(true)}
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden ring-4 ring-[#050816] bg-slate-800 flex-shrink-0 group"
          >
            <img
              src={avatarSrc}
              alt={owner.fullName || "Propriétaire"}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </button>

          {/* Texte */}
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-slate-50">
              {owner.fullName || "Propriétaire"}
            </h1>

            {owner.email && (
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                <Mail className="h-4 w-4" />
                <span>{owner.email}</span>
              </div>
            )}

            {owner.bio && (
              <p className="mt-3 text-sm text-slate-400 max-w-xl">
                {owner.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Lightbox plein écran pour la photo de profil */}
      <ImageLightbox
        open={lbOpen}
        src={avatarSrc}
        alt={owner.fullName || "Photo du propriétaire"}
        onClose={() => setLbOpen(false)}
      />
    </div>
  );
}
