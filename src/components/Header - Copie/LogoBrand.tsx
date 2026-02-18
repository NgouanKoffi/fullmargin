// src/components/Header/LogoBrand.tsx
import { Link } from "react-router-dom";

type Props = { logoSrc: string };

export default function LogoBrand({ logoSrc }: Props) {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
      aria-label="Aller à l'accueil"
    >
      <img
        src={logoSrc}
        alt="FullMargin"
        className="w-8 h-8 object-contain rounded-full"
      />
      <div className="flex items-baseline gap-1">
        {/* Masquer le nom à ≤ 405px */}
        <span className="font-semibold tracking-tight leading-none text-skin-base whitespace-nowrap max-[275px]:hidden">
          FullMargin
        </span>
        {/* Masquer le badge à ≤ 240px */}
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full
                      font-bold bg-[#ff0000] text-white
                      ring-1 ring-[#ff4d4d]
                      whitespace-nowrap leading-none
                      max-[330px]:hidden"
        >
          2 ans
        </span>
      </div>
    </Link>
  );
}
