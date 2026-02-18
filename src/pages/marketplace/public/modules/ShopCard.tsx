// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\modules\ShopCard.tsx
import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { publicShopUrl } from "../../lib/publicShopApi";
import RatingBadge from "../components/RatingBadge";

type Props = {
  id: string;
  slug: string;
  name: string;
  desc: string;
  cover?: string;
  avatar?: string;
  products: number;
  /** NOTE BOUTIQUE (agrégée) */
  ratingAvg?: number;
  ratingCount?: number;
};

export default memo(function ShopCard({
  id,
  slug,
  name,
  desc,
  cover,
  avatar,
  products,
  ratingAvg = 0,
  ratingCount = 0,
}: Props) {
  const to = publicShopUrl(slug || id);

  // Initiales pour fallback avatar (max 2 lettres)
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  }, [name]);

  return (
    <article
      className="
        group relative overflow-hidden rounded-3xl
        bg-white/80 dark:bg-neutral-900/60 backdrop-blur
        ring-1 ring-black/10 dark:ring-white/10
        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl
      "
      title={name}
    >
      {/* zone cliquable : toute la carte */}
      <Link
        to={to}
        className="absolute inset-0 z-10"
        aria-label={`Visiter la boutique ${name}`}
      />

      {/* Halo subtil au survol */}
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity
          rounded-3xl
          [background:
            radial-gradient(120%_100%_at_0%_0%,rgba(124,58,237,.18),transparent_60%),
            radial-gradient(120%_100%_at_100%_0%,rgba(59,130,246,.16),transparent_60%)
          ]
        "
      />

      {/* Media */}
      <div className="relative">
        <div className="aspect-[16/9] overflow-hidden">
          {cover ? (
            <img
              src={cover}
              alt={`${name} – couverture`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"
            />
          ) : (
            <div
              className="
                h-full w-full
                bg-[radial-gradient(120%_100%_at_0%_0%,#a78bfa33,transparent_60%),
                    radial-gradient(120%_100%_at_100%_0%,#60a5fa33,transparent_60%),
                    linear-gradient(#111,#111)]
                dark:bg-[radial-gradient(120%_100%_at_0%_0%,#7c3aed33,transparent_60%),
                          radial-gradient(120%_100%_at_100%_0%,#2563eb33,transparent_60%),
                          linear-gradient(#0a0a0a,#0a0a0a)]
              "
            />
          )}
        </div>

        {/* Chip produits (gauche haut) */}
        <div className="absolute left-3 top-3 z-20">
          <span
            className="
              inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium
              bg-white/95 text-neutral-900 ring-1 ring-black/10 dark:bg-neutral-100
            "
          >
            {products} produit{products > 1 ? "s" : ""}
          </span>
        </div>

        {/* Badge note (bas gauche) — n’affiche rien si count=0 */}
        <div className="absolute left-3 bottom-3 z-20">
          <RatingBadge rating={ratingAvg} count={ratingCount} />
        </div>

        {/* CTA discret (haut droit) */}
        <div className="absolute right-3 top-3 z-20">
          <span
            className="
              inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold
              bg-neutral-900/85 text-white ring-1 ring-white/15 backdrop-blur
              transition-colors group-hover:bg-neutral-900
            "
          >
            Visiter
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Dégradé bas pour lisibilité */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
      </div>

      {/* Contenu (avatar + nom + description) */}
      <div className="relative z-20 p-3.5 sm:p-4">
        <div className="flex items-start gap-3.5">
          {/* Avatar / Initiales */}
          <div
            className="
              relative h-10 w-10 shrink-0 rounded-2xl overflow-hidden
              ring-1 ring-black/10 dark:ring-white/10
              bg-white/70 dark:bg-neutral-800/70 grid place-items-center
              text-[13px] font-bold tracking-wide
            "
            aria-hidden={!avatar}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={`${name} – avatar`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="opacity-80">{initials || "FM"}</span>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-[15px] md:text-[16px] font-semibold leading-tight truncate">
              {name}
            </h3>
            <p className="mt-1 text-[13px] opacity-80 line-clamp-2">
              {desc || "Aucune description fournie."}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
});
