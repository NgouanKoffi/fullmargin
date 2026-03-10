// src/auth/ui/FeatureList.tsx
import {
    HiOutlineBookOpen,
    HiOutlineUsers,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
  } from "react-icons/hi2";
  import type { ReactNode } from "react";
  
  export default function FeatureList({ className = "" }: { className?: string }) {
    return (
      <div className={`relative p-6 lg:p-10 ${className}`}>
        {/* clean light/dark backgrounds */}
        <div
          className="absolute inset-0 -z-10 rounded-3xl opacity-100 dark:hidden"
          style={{
            background:
              "radial-gradient(900px 480px at -10% 0%, rgba(111,60,255,.10) 0, rgba(111,60,255,0) 60%)," +
              "radial-gradient(800px 460px at 115% 20%, rgba(134,56,255,.08) 0, rgba(134,56,255,0) 62%)",
          }}
        />
        <div
          className="absolute inset-0 -z-10 rounded-3xl hidden dark:block"
          style={{
            background:
              "radial-gradient(900px 520px at -10% 0%, rgba(149,100,255,.18) 0, rgba(149,100,255,0) 60%)," +
              "radial-gradient(820px 500px at 115% 20%, rgba(134,56,255,.16) 0, rgba(134,56,255,0) 62%)",
          }}
        />
  
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-skin-base">
          Rejoins FullMargin
        </h2>
        <p className="mt-2 text-sm text-skin-muted">
          Le hub pour trader, créer et progresser.
        </p>
  
        <ul className="mt-6 space-y-4 text-skin-base/95">
          <Feature
            icon={<HiOutlineBookOpen />}
            title="Journal & PnL"
            desc="Notes, métriques et analytics en clair."
          />
          <Feature
            icon={<HiOutlineUsers />}
            title="Communautés"
            desc="Groupes privés vérifiés, accès en 1 clic."
          />
          <Feature
            icon={<HiOutlineShieldCheck />}
            title="Outils validés"
            desc="Robots, indicateurs & ressources testés."
          />
          <Feature
            icon={<HiOutlineSparkles />}
            title="IA & contenus"
            desc="Routines, podcasts et tips actionnables."
          />
        </ul>
      </div>
    );
  }
  
  function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
    return (
      <li className="flex items-start gap-3">
        <span
          className="
            mt-0.5 inline-flex h-8 w-8 items-center justify-center
            rounded-lg
            bg-[rgb(var(--primary))/0.12] text-[rgb(var(--primary))]
          "
        >
          <span className="text-lg">{icon}</span>
        </span>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-skin-muted">{desc}</div>
        </div>
      </li>
    );
  }  